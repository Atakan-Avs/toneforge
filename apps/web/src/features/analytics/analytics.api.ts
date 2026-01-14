import api from "../../api/client";

export type UsageInsightsResponse = {
  ok: boolean;
  insights: {
    period: string;
    totalReplies: number;
    estimatedMinutesSaved: number;
    estimatedHoursSaved: number;
    mostCommonTone: string | null;
    mostCommonIssue: string | null;
    issueBreakdown: Record<string, number>;
  };
};

export async function fetchUsageInsights(): Promise<UsageInsightsResponse> {
  const res = await api.get("/analytics/usage");
  return res.data;
}

