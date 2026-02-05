"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templatesRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../config/prisma");
const auth_1 = require("../middlewares/auth");
const requireOrg_1 = require("../middlewares/requireOrg");
const featureGating_1 = require("../billing/featureGating");
exports.templatesRouter = (0, express_1.Router)();
exports.templatesRouter.use(auth_1.requireAuth);
// ✅ Workspace güvenliği: kullanıcının member olduğunu doğrula
exports.templatesRouter.use(requireOrg_1.requireOrgAccess);
const CreateSchema = zod_1.z.object({
    category: zod_1.z.string().min(2).max(60),
    content: zod_1.z.string().min(1).max(4000),
});
const UpdateSchema = CreateSchema.partial().refine((v) => Object.keys(v).length > 0, "At least one field must be provided");
/**
 * GET /templates
 */
exports.templatesRouter.get("/", async (req, res) => {
    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    const orgId = req.orgId;
    const items = await prisma_1.prisma.template.findMany({
        where: { orgId, userId: req.userId },
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
exports.templatesRouter.post("/", async (req, res) => {
    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    const orgId = req.orgId;
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ ok: false, error: parsed.error.flatten() });
    }
    try {
        // ✅ Plan bazlı feature gating: Template limit kontrolü
        const feature = await (0, featureGating_1.enforceFeature)(orgId, "TEMPLATE_COUNT");
        const created = await prisma_1.prisma.template.create({
            data: {
                orgId,
                userId: req.userId,
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
    }
    catch (err) {
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
exports.templatesRouter.put("/:id", async (req, res) => {
    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    const orgId = req.orgId;
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ ok: false, error: parsed.error.flatten() });
    }
    const id = req.params.id;
    const exists = await prisma_1.prisma.template.findFirst({
        where: { id, orgId, userId: req.userId },
        select: { id: true },
    });
    if (!exists)
        return res.status(404).json({ ok: false, error: "Not found" });
    const updated = await prisma_1.prisma.template.update({
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
exports.templatesRouter.delete("/:id", async (req, res) => {
    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    const orgId = req.orgId;
    const id = req.params.id;
    const exists = await prisma_1.prisma.template.findFirst({
        where: { id, orgId, userId: req.userId },
        select: { id: true },
    });
    if (!exists)
        return res.status(404).json({ ok: false, error: "Not found" });
    await prisma_1.prisma.template.delete({ where: { id } });
    return res.json({ ok: true });
});
//# sourceMappingURL=templates.routes.js.map