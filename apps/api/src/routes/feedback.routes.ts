import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { requireOrgAccess } from "../middlewares/requireOrg";

export const feedbackRouter = Router();

feedbackRouter.use(requireAuth);
feedbackRouter.use(requireOrgAccess);

const FeedbackSchema = z.object({
  rating: z.enum(["thumbs_up", "thumbs_down"]),
  reason: z.string().max(500).optional(),
});

/**
 * POST /feedback/:replyId
 * Submit feedback for a reply
 */
feedbackRouter.post("/:replyId", async (req: AuthRequest, res) => {
  try {
    const replyId = req.params.replyId;
    const orgId = req.orgId!;
    const userId = req.userId!;

    // ✅ Verify reply exists and belongs to user's org
    const reply = await prisma.reply.findFirst({
      where: {
        id: replyId,
        orgId,
        userId,
      },
      select: { id: true },
    });

    if (!reply) {
      return res.status(404).json({ ok: false, error: "Reply not found" });
    }

    const parsed = FeedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: parsed.error.flatten() });
    }

    // ✅ Upsert feedback (user can update their feedback)
    const feedback = await prisma.replyFeedback.upsert({
      where: { replyId },
      update: {
        rating: parsed.data.rating,
        reason: parsed.data.reason ?? null,
      },
      create: {
        replyId,
        rating: parsed.data.rating,
        reason: parsed.data.reason ?? null,
      },
    });

    return res.json({ ok: true, feedback });
  } catch (err: any) {
    console.error("Feedback error:", err);
    return res.status(500).json({ ok: false, error: "Failed to save feedback", detail: err?.message });
  }
});

/**
 * GET /feedback/insights
 * Get aggregated feedback insights for the organization
 * Note: This is at /feedback/insights, not /insights
 */
feedbackRouter.get("/insights", async (req: AuthRequest, res) => {
  try {
    const orgId = req.orgId!;

    // ✅ Get feedback stats
    const feedbacks = await prisma.replyFeedback.findMany({
      where: {
        reply: {
          orgId,
        },
      },
      select: {
        rating: true,
        reply: {
          select: {
            tone: true,
            templateId: true,
            brandVoiceId: true,
          },
        },
      },
    });

    const total = feedbacks.length;
    const thumbsUp = feedbacks.filter((f) => f.rating === "thumbs_up").length;
    const thumbsDown = feedbacks.filter((f) => f.rating === "thumbs_down").length;

    // ✅ Tone performance
    const toneStats: Record<string, { total: number; thumbsUp: number; thumbsDown: number }> = {};
    feedbacks.forEach((f) => {
      const tone = f.reply.tone || "unknown";
      if (!toneStats[tone]) {
        toneStats[tone] = { total: 0, thumbsUp: 0, thumbsDown: 0 };
      }
      toneStats[tone].total++;
      if (f.rating === "thumbs_up") toneStats[tone].thumbsUp++;
      else toneStats[tone].thumbsDown++;
    });

    // ✅ Find best performing tone
    const bestTone = Object.entries(toneStats)
      .map(([tone, stats]) => ({
        tone,
        successRate: stats.total > 0 ? stats.thumbsUp / stats.total : 0,
        total: stats.total,
      }))
      .sort((a, b) => b.successRate - a.successRate)[0];

    return res.json({
      ok: true,
      insights: {
        totalFeedback: total,
        thumbsUp,
        thumbsDown,
        satisfactionRate: total > 0 ? thumbsUp / total : 0,
        bestPerformingTone: bestTone?.tone ?? null,
        toneStats,
      },
    });
  } catch (err: any) {
    console.error("Insights error:", err);
    return res.status(500).json({ ok: false, error: "Failed to load insights", detail: err?.message });
  }
});

export default feedbackRouter;

