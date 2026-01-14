import api from "../../api/client";

export type FeedbackRating = "thumbs_up" | "thumbs_down";

export type SubmitFeedbackRequest = {
  rating: FeedbackRating;
  reason?: string;
};

export type FeedbackResponse = {
  ok: boolean;
  feedback: {
    id: string;
    replyId: string;
    rating: FeedbackRating;
    reason: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export type FeedbackInsightsResponse = {
  ok: boolean;
  insights: {
    totalFeedback: number;
    thumbsUp: number;
    thumbsDown: number;
    satisfactionRate: number;
    bestPerformingTone: string | null;
    toneStats: Record<string, { total: number; thumbsUp: number; thumbsDown: number }>;
  };
};

export async function submitFeedback(replyId: string, data: SubmitFeedbackRequest): Promise<FeedbackResponse> {
  const res = await api.post(`/feedback/${replyId}`, data);
  return res.data;
}

export async function fetchFeedbackInsights(): Promise<FeedbackInsightsResponse> {
  const res = await api.get("/feedback/insights");
  return res.data;
}

