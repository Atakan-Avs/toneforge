"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../config/prisma");
const auth_1 = require("../middlewares/auth");
const requireOrg_1 = require("../middlewares/requireOrg");
exports.analyticsRouter = (0, express_1.Router)();
exports.analyticsRouter.use(auth_1.requireAuth);
exports.analyticsRouter.use(requireOrg_1.requireOrgAccess);
/**
 * GET /analytics/usage
 * Get usage insights: saved time, common issues, etc.
 */
exports.analyticsRouter.get("/usage", async (req, res) => {
    try {
        const orgId = req.orgId;
        // ✅ Get replies from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const replies = await prisma_1.prisma.reply.findMany({
            where: {
                orgId,
                createdAt: {
                    gte: sevenDaysAgo,
                },
            },
            select: {
                id: true,
                customerMessage: true,
                tone: true,
                createdAt: true,
            },
        });
        const totalReplies = replies.length;
        // ✅ Estimated time saved (assume 2 minutes per reply on average)
        const estimatedMinutesSaved = totalReplies * 2;
        const estimatedHoursSaved = Math.round((estimatedMinutesSaved / 60) * 10) / 10;
        // ✅ Most common tone
        const toneCounts = {};
        replies.forEach((r) => {
            toneCounts[r.tone] = (toneCounts[r.tone] || 0) + 1;
        });
        const mostCommonTone = Object.entries(toneCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
        // ✅ Customer message keywords (simple extraction for "common issues")
        const allMessages = replies.map((r) => r.customerMessage.toLowerCase());
        const commonWords = ["delayed", "refund", "cancel", "issue", "problem", "help", "wrong", "missing"];
        const issueCounts = {};
        commonWords.forEach((word) => {
            const count = allMessages.filter((msg) => msg.includes(word)).length;
            if (count > 0) {
                issueCounts[word] = count;
            }
        });
        const mostCommonIssue = Object.entries(issueCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
        return res.json({
            ok: true,
            insights: {
                period: "last_7_days",
                totalReplies,
                estimatedMinutesSaved,
                estimatedHoursSaved,
                mostCommonTone,
                mostCommonIssue,
                issueBreakdown: issueCounts,
            },
        });
    }
    catch (err) {
        console.error("Analytics error:", err);
        return res.status(500).json({ ok: false, error: "Failed to load analytics", detail: err?.message });
    }
});
exports.default = exports.analyticsRouter;
//# sourceMappingURL=analytics.routes.js.map