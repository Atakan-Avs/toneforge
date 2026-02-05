"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPeriodKeyUTC = getPeriodKeyUTC;
exports.getFreeMonthlyLimit = getFreeMonthlyLimit;
exports.getCurrentUsage = getCurrentUsage;
exports.consumeOneReply = consumeOneReply;
const prisma_1 = require("../../config/prisma");
function getPeriodKeyUTC(date = new Date()) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}
function getFreeMonthlyLimit() {
    const raw = process.env.FREE_MONTHLY_REPLY_LIMIT ?? "30";
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 30;
}
async function getCurrentUsage(orgId, period = getPeriodKeyUTC()) {
    const row = await prisma_1.prisma.usage.findUnique({
        where: { org_period_unique: { orgId, period } },
    });
    return row?.count ?? 0;
}
async function consumeOneReply(orgId) {
    const period = getPeriodKeyUTC();
    const limit = getFreeMonthlyLimit();
    return prisma_1.prisma.$transaction(async (tx) => {
        await tx.usage.upsert({
            where: { org_period_unique: { orgId, period } },
            create: { orgId, period, count: 0 },
            update: {},
        });
        const current = await tx.usage.findUnique({
            where: { org_period_unique: { orgId, period } },
            select: { count: true },
        });
        const used = current?.count ?? 0;
        if (used >= limit) {
            const err = new Error("Monthly reply limit exceeded");
            err.code = "QUOTA_EXCEEDED";
            err.used = used;
            err.limit = limit;
            err.period = period;
            throw err;
        }
        const updated = await tx.usage.update({
            where: { org_period_unique: { orgId, period } },
            data: { count: { increment: 1 } },
            select: { count: true },
        });
        return {
            period,
            usedAfter: updated.count,
            limit,
            remaining: Math.max(0, limit - updated.count),
        };
    });
}
//# sourceMappingURL=usage.service.js.map