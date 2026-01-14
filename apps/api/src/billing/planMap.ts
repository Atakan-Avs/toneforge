export type PaidPlan = "PRO" | "PREMIUM";

export function priceIdForPlan(plan: PaidPlan): string {
  if (plan === "PRO") return process.env.STRIPE_PRICE_PRO_MONTHLY!;
  return process.env.STRIPE_PRICE_PREMIUM_MONTHLY!;
}

export function quotaForPlanCode(planCode: "FREE" | "PRO" | "PREMIUM"): number {
  if (planCode === "PRO") return 500;
  if (planCode === "PREMIUM") return 2000;
  return 20;
}