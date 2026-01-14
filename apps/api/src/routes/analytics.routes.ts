import { Router } from "express";
import { prisma } from "../config/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { requireOrgAccess } from "../middlewares/requireOrg";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);
analyticsRouter.use(requireOrgAccess);

/**
 * GET /analytics/usage
 * Get usage insights: saved time, common issues, etc.
 */
analyticsRouter.get("/usage", async (req: AuthRequest, res) => {
  try {
    const orgId = req.orgId!;

    // ✅ Get replies from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const replies = await prisma.reply.findMany({
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
    const toneCounts: Record<string, number> = {};
    replies.forEach((r) => {
      toneCounts[r.tone] = (toneCounts[r.tone] || 0) + 1;
    });
    const mostCommonTone = Object.entries(toneCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

    // ✅ Customer message keywords (simple extraction for "common issues")
    const allMessages = replies.map((r) => r.customerMessage.toLowerCase());
    const commonWords = ["delayed", "refund", "cancel", "issue", "problem", "help", "wrong", "missing"];
    const issueCounts: Record<string, number> = {};
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
  } catch (err: any) {
    console.error("Analytics error:", err);
    return res.status(500).json({ ok: false, error: "Failed to load analytics", detail: err?.message });
  }
});

export default analyticsRouter;

