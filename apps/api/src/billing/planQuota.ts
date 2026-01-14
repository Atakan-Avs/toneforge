import type { PlanCode } from "@prisma/client";

export function monthlyQuota(plan: PlanCode | string | null | undefined): number {
  switch (plan) {
    case "PRO":
      return 500;
    case "PREMIUM":
      return 2000;
    case "FREE":
    default:
      return 20;
  }
}