import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { requireOrgAccess } from "../middlewares/requireOrg";
import { enforceFeature } from "../billing/featureGating";

export const brandVoicesRouter = Router();
brandVoicesRouter.use(requireAuth);
// ✅ Workspace güvenliği: kullanıcının member olduğunu doğrula
brandVoicesRouter.use(requireOrgAccess);

const CreateSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().min(0).max(2000).optional().default(""),
});

const UpdateSchema = CreateSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  "At least one field must be provided"
);

/**
 * GET /brand-voices
 */
brandVoicesRouter.get("/", async (req: AuthRequest, res) => {
  // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
  const orgId = req.orgId!;

  const items = await prisma.brandVoice.findMany({
    where: { orgId, userId: req.userId! },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      // ❌ updatedAt yok — kaldırıldı
    },
  });

  return res.json({ ok: true, items });
});

/**
 * POST /brand-voices
 */
brandVoicesRouter.post("/", async (req: AuthRequest, res) => {
  // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
  const orgId = req.orgId!;

  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  try {
    // ✅ Plan bazlı feature gating: Brand Voice limit kontrolü
    const feature = await enforceFeature(orgId, "BRAND_VOICE_COUNT");

    const created = await prisma.brandVoice.create({
      data: {
        orgId,
        userId: req.userId!,
        name: parsed.data.name,
        description: parsed.data.description ?? "",
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ ok: true, item: created, feature });
  } catch (err: any) {
    // ✅ Feature limit exceeded hatası
    if (err?.code === "FEATURE_LIMIT_EXCEEDED") {
      return res.status(403).json({
        ok: false,
        error: `Brand voice limit exceeded. You have reached the maximum of ${err.limit} brand voices for your plan. Please upgrade to create more brand voices.`,
        feature: {
          name: err.feature,
          current: err.current,
          limit: err.limit,
          planCode: err.planCode,
        },
      });
    }

    // ✅ Subscription inactive hatası
    if (err?.code === "SUB_INACTIVE") {
      return res.status(402).json({
        ok: false,
        error: "Subscription inactive. Please update your payment method or upgrade your plan.",
      });
    }

    throw err;
  }
});

/**
 * PUT /brand-voices/:id
 */
brandVoicesRouter.put("/:id", async (req: AuthRequest, res) => {
  // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
  const orgId = req.orgId!;

  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const id = req.params.id;

  const exists = await prisma.brandVoice.findFirst({
    where: { id, orgId, userId: req.userId! },
    select: { id: true },
  });

  if (!exists) return res.status(404).json({ ok: false, error: "Not found" });

  const updated = await prisma.brandVoice.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
    },
  });

  return res.json({ ok: true, item: updated });
});

/**
 * DELETE /brand-voices/:id
 */
brandVoicesRouter.delete("/:id", async (req: AuthRequest, res) => {
  // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
  const orgId = req.orgId!;

  const id = req.params.id;

  const exists = await prisma.brandVoice.findFirst({
    where: { id, orgId, userId: req.userId! },
    select: { id: true },
  });

  if (!exists) return res.status(404).json({ ok: false, error: "Not found" });

  await prisma.brandVoice.delete({ where: { id } });

  return res.json({ ok: true });
});