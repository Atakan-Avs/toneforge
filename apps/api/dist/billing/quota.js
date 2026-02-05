"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumeOneReply = consumeOneReply;
const prisma_1 = require("../config/prisma");
const planQuota_1 = require("./planQuota");
function periodKeyUTC(d = new Date()) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
async function consumeOneReply(orgId) {
    const period = periodKeyUTC();
    return prisma_1.prisma.$transaction(async (tx) => {
        // ✅ 1) org + subscription durumunu DB’den oku (source of truth)
        const org = await tx.organization.findUnique({
            where: { id: orgId },
            include: { subscription: true },
        });
        if (!org) {
            const err = new Error("Organization not found");
            err.code = "ORG_NOT_FOUND";
            throw err;
        }
        // ✅ 2) Paid plan ise subscription aktif olmalı
        if (org.planCode !== "FREE") {
            const s = org.subscription;
            const ok = s && (s.status === "active" || s.status === "trialing");
            if (!ok) {
                const err = new Error("Subscription inactive");
                err.code = "SUB_INACTIVE";
                throw err;
            }
        }
        // ✅ 3) Limit: org.planCode’a göre hesapla
        const limit = (0, planQuota_1.monthlyQuota)(org.planCode);
        // ✅ 4) Usage satırını oluştur / bul
        const usage = await tx.usage.findFirst({
            where: { orgId, period },
        });
        const used = usage?.count ?? 0;
        if (used >= limit) {
            const err = new Error("Quota exceeded");
            err.code = "QUOTA_EXCEEDED";
            err.period = period;
            err.used = used;
            err.limit = limit;
            throw err;
        }
        // ✅ 5) Atomic increment (row varsa update, yoksa create)
        const updated = usage
            ? await tx.usage.update({
                where: { id: usage.id },
                data: { count: { increment: 1 } },
            })
            : await tx.usage.create({
                data: { orgId, period, count: 1 },
            });
        const usedAfter = updated.count;
        return {
            period,
            usedAfter,
            limit,
            remaining: Math.max(0, limit - usedAfter),
            planCode: org.planCode, // debug için süper
        };
    });
}
//# sourceMappingURL=quota.js.map