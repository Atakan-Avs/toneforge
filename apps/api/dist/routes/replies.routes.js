"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repliesRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../config/prisma");
const auth_1 = require("../middlewares/auth");
const ai_1 = require("../services/ai"); // HuggingFace-based AI service
const requireOrg_1 = require("../middlewares/requireOrg");
const featureGating_1 = require("../billing/featureGating");
// ✅ usage service imports
const usage_service_1 = require("../services/usage/usage.service");
exports.repliesRouter = (0, express_1.Router)();
// auth zorunlu
exports.repliesRouter.use(auth_1.requireAuth);
// ✅ Workspace güvenliği: kullanıcının member olduğunu doğrula
exports.repliesRouter.use(requireOrg_1.requireOrgAccess);
/**
 * Request body validation
 */
const BodySchema = zod_1.z.object({
    customerMessage: zod_1.z.string().min(1),
    tone: zod_1.z.enum(["formal", "friendly", "short"]),
    brandVoiceId: zod_1.z.string().optional(),
    templateId: zod_1.z.string().optional(),
    language: zod_1.z.enum(["en", "tr"]).optional(),
});
/**
 * Converts UI tone selection into AI writing guidelines
 */
function toneToGuidelines(tone) {
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
function assertOrgId(req, res) {
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
exports.repliesRouter.post("/generate", async (req, res) => {
    const parsed = BodySchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            ok: false,
            error: parsed.error.flatten(),
        });
    }
    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    const orgId = req.orgId;
    const { customerMessage, tone, brandVoiceId, templateId, language } = parsed.data;
    try {
        // ✅ 1) Enforce monthly quota BEFORE generating (atomic increment)
        const quota = await (0, usage_service_1.consumeOneReply)(orgId);
        /**
         * Fetch optional Brand Voice & Template
         */
        const [brandVoice, template] = await Promise.all([
            brandVoiceId
                ? prisma_1.prisma.brandVoice.findFirst({
                    where: {
                        id: brandVoiceId,
                        userId: req.userId, // brand voice user bazlı
                        orgId, // ✅ org scope güvenliği
                    },
                })
                : Promise.resolve(null),
            templateId
                ? prisma_1.prisma.template.findFirst({
                    where: {
                        id: templateId,
                        userId: req.userId,
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
        const aiResult = await (0, ai_1.generateReply)({
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
        const savedReply = await prisma_1.prisma.reply.create({
            data: {
                customerMessage,
                tone,
                result: aiResult.reply,
                // ✅ required relations
                user: { connect: { id: req.userId } },
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
    }
    catch (err) {
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
exports.repliesRouter.get("/history", async (req, res) => {
    const q = req.query.q?.trim();
    const tone = req.query.tone?.trim();
    const limitRaw = req.query.limit;
    const limit = Math.min(100, Math.max(1, Number(limitRaw ?? 50) || 50));
    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    const orgId = req.orgId;
    // ✅ Plan bazlı tarih filtresi (FREE: 30 gün, PRO: 6 ay, PREMIUM: limitsiz)
    const dateFilter = await (0, featureGating_1.getHistoryDateFilter)(orgId);
    const where = {
        userId: req.userId,
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
    const items = await prisma_1.prisma.reply.findMany({
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
exports.repliesRouter.get("/usage", async (req, res) => {
    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    const orgId = req.orgId;
    const period = (0, usage_service_1.getPeriodKeyUTC)();
    const used = await (0, usage_service_1.getCurrentUsage)(orgId, period);
    const limit = (0, usage_service_1.getFreeMonthlyLimit)();
    return res.json({
        ok: true,
        period,
        used,
        limit,
        remaining: Math.max(0, limit - used),
    });
});
//# sourceMappingURL=replies.routes.js.map