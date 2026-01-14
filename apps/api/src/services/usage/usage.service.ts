import { prisma } from "../../config/prisma";
import type { Prisma } from "@prisma/client";


export function getPeriodKeyUTC(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function getFreeMonthlyLimit(): number {
  const raw = process.env.FREE_MONTHLY_REPLY_LIMIT ?? "30";
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

export async function getCurrentUsage(orgId: string, period = getPeriodKeyUTC()) {
  const row = await prisma.usage.findUnique({
    where: { org_period_unique: { orgId, period } },
  });
  return row?.count ?? 0;
}

export async function consumeOneReply(orgId: string) {
  const period = getPeriodKeyUTC();
  const limit = getFreeMonthlyLimit();

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
      const err = new Error("Monthly reply limit exceeded") as any;
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