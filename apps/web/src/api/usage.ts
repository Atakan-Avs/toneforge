import api from "./client";

export type UsageResponse = {
  ok: boolean;
  period: string;
  used: number;
  limit: number;
  remaining: number;
};

export async function fetchUsage(): Promise<UsageResponse> {
  const { data } = await api.get<UsageResponse>("/replies/usage");
  return data;
}