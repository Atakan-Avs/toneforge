"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../config/prisma");
const auth_1 = require("../middlewares/auth");
const requireOrg_1 = require("../middlewares/requireOrg");
exports.feedbackRouter = (0, express_1.Router)();
exports.feedbackRouter.use(auth_1.requireAuth);
exports.feedbackRouter.use(requireOrg_1.requireOrgAccess);
const FeedbackSchema = zod_1.z.object({
    rating: zod_1.z.enum(["thumbs_up", "thumbs_down"]),
    reason: zod_1.z.string().max(500).optional(),
});
/**
 * POST /feedback/:replyId
 * Submit feedback for a reply
 */
exports.feedbackRouter.post("/:replyId", async (req, res) => {
    try {
        const replyId = req.params.replyId;
        const orgId = req.orgId;
        const userId = req.userId;
        // ✅ Verify reply exists and belongs to user's org
        const reply = await prisma_1.prisma.reply.findFirst({
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
        const feedback = await prisma_1.prisma.replyFeedback.upsert({
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
    }
    catch (err) {
        console.error("Feedback error:", err);
        return res.status(500).json({ ok: false, error: "Failed to save feedback", detail: err?.message });
    }
});
/**
 * GET /feedback/insights
 * Get aggregated feedback insights for the organization
 * Note: This is at /feedback/insights, not /insights
 */
exports.feedbackRouter.get("/insights", async (req, res) => {
    try {
        const orgId = req.orgId;
        // ✅ Get feedback stats
        const feedbacks = await prisma_1.prisma.replyFeedback.findMany({
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
        const toneStats = {};
        feedbacks.forEach((f) => {
            const tone = f.reply.tone || "unknown";
            if (!toneStats[tone]) {
                toneStats[tone] = { total: 0, thumbsUp: 0, thumbsDown: 0 };
            }
            toneStats[tone].total++;
            if (f.rating === "thumbs_up")
                toneStats[tone].thumbsUp++;
            else
                toneStats[tone].thumbsDown++;
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
    }
    catch (err) {
        console.error("Insights error:", err);
        return res.status(500).json({ ok: false, error: "Failed to load insights", detail: err?.message });
    }
});
exports.default = exports.feedbackRouter;
//# sourceMappingURL=feedback.routes.js.map