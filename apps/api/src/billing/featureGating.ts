import { prisma } from "../config/prisma";
import type { PlanCode } from "@prisma/client";

export type FeatureName = "TEMPLATE_COUNT" | "BRAND_VOICE_COUNT" | "HISTORY_DAYS";

/**
 * Plan bazlı feature limitleri
 * null = limitsiz (sadece PREMIUM için)
 */
export function getFeatureLimit(plan: PlanCode | string | null | undefined, feature: FeatureName): number | null {
  switch (plan) {
    case "PREMIUM":
      // PREMIUM: limitsiz
      return null;

    case "PRO":
      switch (feature) {
        case "TEMPLATE_COUNT":
          return 10;
        case "BRAND_VOICE_COUNT":
          return 10;
        case "HISTORY_DAYS":
          return 180; // 6 ay
        default:
          return null;
      }

    case "FREE":
    default:
      switch (feature) {
        case "TEMPLATE_COUNT":
          return 1;
        case "BRAND_VOICE_COUNT":
          return 1;
        case "HISTORY_DAYS":
          return 30; // 30 gün
        default:
          return null;
      }
  }
}

/**
 * Feature gating kontrolü
 * 
 * @param orgId Organization ID
 * @param feature Feature adı (TEMPLATE_COUNT, BRAND_VOICE_COUNT, HISTORY_DAYS)
 * @param currentCount Mevcut kullanım (template/brand voice sayısı için)
 * @returns limit ve kullanım bilgisi
 * @throws Error with code "FEATURE_LIMIT_EXCEEDED" if limit exceeded
 */
export async function enforceFeature(
  orgId: string,
  feature: FeatureName,
  currentCount?: number
): Promise<{ limit: number | null; current: number; remaining: number | null }> {
  // 1) Organization'ı ve plan bilgisini al
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      planCode: true,
      subscription: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!org) {
    const err: any = new Error("Organization not found");
    err.code = "ORG_NOT_FOUND";
    throw err;
  }

  // 2) Paid plan ise subscription aktif olmalı
  if (org.planCode !== "FREE") {
    const s = org.subscription;
    const ok = s && (s.status === "active" || s.status === "trialing");
    if (!ok) {
      const err: any = new Error("Subscription inactive");
      err.code = "SUB_INACTIVE";
      throw err;
    }
  }

  // 3) Feature limitini plan'a göre al
  const limit = getFeatureLimit(org.planCode, feature);

  // 4) Limit null ise (PREMIUM, limitsiz) → her zaman izin ver
  if (limit === null) {
    return {
      limit: null,
      current: currentCount ?? 0,
      remaining: null, // null = limitsiz
    };
  }

  // 5) Current count hesapla (eğer verilmediyse)
  let actualCurrent = currentCount;
  
  if (actualCurrent === undefined) {
    switch (feature) {
      case "TEMPLATE_COUNT":
        actualCurrent = await prisma.template.count({
          where: { orgId },
        });
        break;
      case "BRAND_VOICE_COUNT":
        actualCurrent = await prisma.brandVoice.count({
          where: { orgId },
        });
        break;
      case "HISTORY_DAYS":
        // HISTORY_DAYS için current count anlamsız, sadece limit kontrol edilir
        actualCurrent = 0;
        break;
      default:
        actualCurrent = 0;
    }
  }

  // 6) Limit kontrolü
  if (actualCurrent >= limit) {
    const err: any = new Error(`Feature limit exceeded: ${feature}`);
    err.code = "FEATURE_LIMIT_EXCEEDED";
    err.feature = feature;
    err.current = actualCurrent;
    err.limit = limit;
    err.planCode = org.planCode;
    throw err;
  }

  return {
    limit,
    current: actualCurrent,
    remaining: limit - actualCurrent,
  };
}

/**
 * History için tarih filtreleme (HISTORY_DAYS feature'ına göre)
 * 
 * @param orgId Organization ID
 * @returns where clause için createdAt filtresi (veya null = limitsiz)
 */
export async function getHistoryDateFilter(orgId: string): Promise<{ gte: Date } | null> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      planCode: true,
      subscription: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!org) {
    return null;
  }

  // Paid plan ise subscription aktif olmalı
  if (org.planCode !== "FREE") {
    const s = org.subscription;
    const ok = s && (s.status === "active" || s.status === "trialing");
    if (!ok) {
      // Subscription inactive → FREE plan limiti uygula
      const days = getFeatureLimit("FREE", "HISTORY_DAYS") ?? 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      return { gte: cutoffDate };
    }
  }

  const days = getFeatureLimit(org.planCode, "HISTORY_DAYS");
  
  // null = limitsiz (PREMIUM)
  if (days === null) {
    return null;
  }

  // Tarih filtresi uygula
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return { gte: cutoffDate };
}

