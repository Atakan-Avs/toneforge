import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { requireOrgAccess } from "../middlewares/requireOrg";
import { enforceFeature } from "../billing/featureGating";

export const templatesRouter = Router();
templatesRouter.use(requireAuth);
// ✅ Workspace güvenliği: kullanıcının member olduğunu doğrula
templatesRouter.use(requireOrgAccess);

const CreateSchema = z.object({
  category: z.string().min(2).max(60),
  content: z.string().min(1).max(4000),
});

const UpdateSchema = CreateSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  "At least one field must be provided"
);

/**
 * GET /templates
 */
templatesRouter.get("/", async (req: AuthRequest, res) => {
  // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
  const orgId = req.orgId!;

  const items = await prisma.template.findMany({
    where: { orgId, userId: req.userId! },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      category: true,
      content: true,
      createdAt: true,
      // ❌ updatedAt varsa ekle, yoksa ekleme
    },
  });

  return res.json({ ok: true, items });
});

/**
 * POST /templates
 */
templatesRouter.post("/", async (req: AuthRequest, res) => {
  // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
  const orgId = req.orgId!;

  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  try {
    // ✅ Plan bazlı feature gating: Template limit kontrolü
    const feature = await enforceFeature(orgId, "TEMPLATE_COUNT");

    const created = await prisma.template.create({
      data: {
        orgId,
        userId: req.userId!,
        category: parsed.data.category,
        content: parsed.data.content,
      },
      select: {
        id: true,
        category: true,
        content: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ ok: true, item: created, feature });
  } catch (err: any) {
    // ✅ Feature limit exceeded hatası
    if (err?.code === "FEATURE_LIMIT_EXCEEDED") {
      return res.status(403).json({
        ok: false,
        error: `Template limit exceeded. You have reached the maximum of ${err.limit} templates for your plan. Please upgrade to create more templates.`,
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
 * PUT /templates/:id
 */
templatesRouter.put("/:id", async (req: AuthRequest, res) => {
  // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
  const orgId = req.orgId!;

  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const id = req.params.id;

  const exists = await prisma.template.findFirst({
    where: { id, orgId, userId: req.userId! },
    select: { id: true },
  });

  if (!exists) return res.status(404).json({ ok: false, error: "Not found" });

  const updated = await prisma.template.update({
    where: { id },
    data: {
      ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
      ...(parsed.data.content !== undefined ? { content: parsed.data.content } : {}),
    },
    select: {
      id: true,
      category: true,
      content: true,
      createdAt: true,
    },
  });

  return res.json({ ok: true, item: updated });
});

/**
 * DELETE /templates/:id
 */
templatesRouter.delete("/:id", async (req: AuthRequest, res) => {
  // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
  const orgId = req.orgId!;

  const id = req.params.id;

  const exists = await prisma.template.findFirst({
    where: { id, orgId, userId: req.userId! },
    select: { id: true },
  });

  if (!exists) return res.status(404).json({ ok: false, error: "Not found" });

  await prisma.template.delete({ where: { id } });

  return res.json({ ok: true });
});