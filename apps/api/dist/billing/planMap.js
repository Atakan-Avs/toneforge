"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceIdForPlan = priceIdForPlan;
exports.quotaForPlanCode = quotaForPlanCode;
function priceIdForPlan(plan) {
    if (plan === "PRO")
        return process.env.STRIPE_PRICE_PRO_MONTHLY;
    return process.env.STRIPE_PRICE_PREMIUM_MONTHLY;
}
function quotaForPlanCode(planCode) {
    if (planCode === "PRO")
        return 500;
    if (planCode === "PREMIUM")
        return 2000;
    return 20;
}
//# sourceMappingURL=planMap.js.map