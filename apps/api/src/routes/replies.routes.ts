import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { generateReply } from "../services/ai"; // HuggingFace-based AI service
import { requireOrgAccess } from "../middlewares/requireOrg";
import { getHistoryDateFilter } from "../billing/featureGating";

// ✅ usage service imports
import {
  consumeOneReply,
  getCurrentUsage,
  getFreeMonthlyLimit,
  getPeriodKeyUTC,
} from "../services/usage/usage.service";

export const repliesRouter = Router();

// auth zorunlu
repliesRouter.use(requireAuth);

// ✅ Workspace güvenliği: kullanıcının member olduğunu doğrula
repliesRouter.use(requireOrgAccess);

/**
 * Request body validation
 */
const BodySchema = z.object({
  customerMessage: z.string().min(1),
  tone: z.enum(["formal", "friendly", "short"]),
  brandVoiceId: z.string().optional(),
  templateId: z.string().optional(),
  language: z.enum(["en", "tr"]).optional(),
});

/**
 * Converts UI tone selection into AI writing guidelines
 */
function toneToGuidelines(tone: "formal" | "friendly" | "short"): string {
  switch (tone) {
    case "formal":
      return "Tone: Formal, professional, respectful. Be concise. Avoid emojis.";
    case "friendly":
      return "Tone: Friendly, warm, and helpful. Emojis are allowed but should be minimal.";
    case "short":
      return "Tone: Very short, clear, and direct. No unnecessary details.";
    default:
      return "Tone: Professional and clear.";
  }
}

/**
 * Helper: req.orgId güvenli kontrol
 * (requireOrgAccess middleware zaten kontrol etti, ama tip safety için)
 */
function assertOrgId(req: AuthRequest, res: any): string | null {
  const orgId = req.orgId;
  if (!orgId) {
    res.status(400).json({
      ok: false,
      error: "Missing orgId. Workspace not selected.",
    });
    return null;
  }
  return orgId;
}

repliesRouter.post("/generate", async (req: AuthRequest, res) => {
  const parsed = BodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.flatten(),
    });
  }

  // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
  const orgId = req.orgId!;

  const { customerMessage, tone, brandVoiceId, templateId, language } = parsed.data;

  try {
    // ✅ 1) Enforce monthly quota BEFORE generating (atomic increment)
    const quota = await consumeOneReply(orgId);

    /**
     * Fetch optional Brand Voice & Template
     */
    const [brandVoice, template] = await Promise.all([
      brandVoiceId
        ? prisma.brandVoice.findFirst({
          where: {
            id: brandVoiceId,
            userId: req.userId!,   // brand voice user bazlı
            orgId,                 // ✅ org scope güvenliği
          },
        })
        : Promise.resolve(null),

      templateId
        ? prisma.template.findFirst({
          where: {
            id: templateId,
            userId: req.userId!,
            orgId, // ✅ req.orgId yerine orgId
          },
        })
        : Promise.resolve(null),
    ]);

    /**
     * Merge tone-based guidelines with saved brand voice (if any)
     */
    const mergedGuidelines = [
      toneToGuidelines(tone),
      brandVoice?.description
        ? `Additional brand voice rules:\n${brandVoice.description}`
        : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    /**
     * Generate AI reply using HuggingFace
     */
    const aiResult = await generateReply({
      userMessage: customerMessage,
      language: language ?? "en",
      brandVoice: {
        name: brandVoice?.name ?? null,
        guidelines: mergedGuidelines,
        bannedWords: [],
        exampleReplies: [],
      },
      template: {
        content: template?.content ?? null,
      },
    });

    /**
     * Persist reply to database
     */
    const savedReply = await prisma.reply.create({
      data: {
        customerMessage,
        tone,
        result: aiResult.reply,

        // ✅ required relations
        user: { connect: { id: req.userId! } },
        org: { connect: { id: orgId } },

        // ✅ optional relations
        ...(brandVoice?.id ? { brandVoice: { connect: { id: brandVoice.id } } } : {}),
        ...(template?.id ? { template: { connect: { id: template.id } } } : {}),
      },
    });

    return res.json({
      ok: true,
      reply: savedReply,
      ai: {
        provider: aiResult.provider,
        model: aiResult.model,
      },
      quota, // ✅ includes usedAfter/remaining/limit/period
    });
  } catch (err: any) {
    // ✅ Handle quota errors nicely for SaaS
    if (err?.code === "QUOTA_EXCEEDED") {
      return res.status(429).json({
        ok: false,
        error: "Monthly quota exceeded. Please upgrade your plan.",
        quota: {
          period: err.period,
          used: err.used,
          limit: err.limit,
        },
      });
    }

    // ✅ Paid plan but subscription inactive (mid-senior SaaS behavior)
    if (err?.code === "SUB_INACTIVE") {
      return res.status(402).json({
        ok: false,
        error: "Subscription inactive. Please update your payment method or upgrade your plan.",
      });
    }

    console.error("AI GENERATION ERROR:", err);
    const message = err?.message ?? "AI generation failed";

    if (/loading|estimated|rate|timeout|inference|huggingface|router/i.test(message)) {
      return res.status(503).json({ ok: false, error: message });
    }

    return res.status(502).json({ ok: false, error: message });
  }
});

/**
 * Reply history (org scoped)
 * Plan bazlı tarih filtreleme uygulanır:
 * - FREE: Son 30 gün
 * - PRO: Son 6 ay
 * - PREMIUM: Limitsiz
 */
repliesRouter.get("/history", async (req: AuthRequest, res) => {
  const q = (req.query.q as string | undefined)?.trim();
  const tone = (req.query.tone as string | undefined)?.trim();
  const limitRaw = req.query.limit as string | undefined;

  const limit = Math.min(100, Math.max(1, Number(limitRaw ?? 50) || 50));

  // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
  const orgId = req.orgId!;

  // ✅ Plan bazlı tarih filtresi (FREE: 30 gün, PRO: 6 ay, PREMIUM: limitsiz)
  const dateFilter = await getHistoryDateFilter(orgId);

  const where: any = {
    userId: req.userId!,
    orgId, // ✅ workspace scoped
  };

  // ✅ Tarih filtresi ekle (plan'a göre)
  if (dateFilter) {
    where.createdAt = dateFilter;
  }

  if (tone && ["formal", "friendly", "short"].includes(tone)) {
    where.tone = tone;
  }

  if (q) {
    where.OR = [
      { customerMessage: { contains: q, mode: "insensitive" } },
      { result: { contains: q, mode: "insensitive" } },
    ];
  }

  const items = await prisma.reply.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      customerMessage: true,
      tone: true,
      result: true,
      createdAt: true,
      brandVoiceId: true,
      templateId: true,
    },
  });

  return res.json({ ok: true, items, dateFilter: dateFilter ? { since: dateFilter.gte } : null });
});


/**
 * Current usage for the current month (org scoped)
 */
repliesRouter.get("/usage", async (req: AuthRequest, res) => {
  // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
  const orgId = req.orgId!;

  const period = getPeriodKeyUTC();
  const used = await getCurrentUsage(orgId, period);
  const limit = getFreeMonthlyLimit();

  return res.json({
    ok: true,
    period,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  });
});