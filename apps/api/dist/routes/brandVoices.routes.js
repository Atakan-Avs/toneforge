"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.brandVoicesRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../config/prisma");
const auth_1 = require("../middlewares/auth");
const requireOrg_1 = require("../middlewares/requireOrg");
const featureGating_1 = require("../billing/featureGating");
exports.brandVoicesRouter = (0, express_1.Router)();
exports.brandVoicesRouter.use(auth_1.requireAuth);
// ✅ Workspace güvenliği: kullanıcının member olduğunu doğrula
exports.brandVoicesRouter.use(requireOrg_1.requireOrgAccess);
const CreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(60),
    description: zod_1.z.string().min(0).max(2000).optional().default(""),
});
const UpdateSchema = CreateSchema.partial().refine((v) => Object.keys(v).length > 0, "At least one field must be provided");
/**
 * GET /brand-voices
 */
exports.brandVoicesRouter.get("/", async (req, res) => {
    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    const orgId = req.orgId;
    const items = await prisma_1.prisma.brandVoice.findMany({
        where: { orgId, userId: req.userId },
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
exports.brandVoicesRouter.post("/", async (req, res) => {
    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    const orgId = req.orgId;
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ ok: false, error: parsed.error.flatten() });
    }
    try {
        // ✅ Plan bazlı feature gating: Brand Voice limit kontrolü
        const feature = await (0, featureGating_1.enforceFeature)(orgId, "BRAND_VOICE_COUNT");
        const created = await prisma_1.prisma.brandVoice.create({
            data: {
                orgId,
                userId: req.userId,
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
    }
    catch (err) {
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
exports.brandVoicesRouter.put("/:id", async (req, res) => {
    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    const orgId = req.orgId;
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ ok: false, error: parsed.error.flatten() });
    }
    const id = req.params.id;
    const exists = await prisma_1.prisma.brandVoice.findFirst({
        where: { id, orgId, userId: req.userId },
        select: { id: true },
    });
    if (!exists)
        return res.status(404).json({ ok: false, error: "Not found" });
    const updated = await prisma_1.prisma.brandVoice.update({
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
exports.brandVoicesRouter.delete("/:id", async (req, res) => {
    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    const orgId = req.orgId;
    const id = req.params.id;
    const exists = await prisma_1.prisma.brandVoice.findFirst({
        where: { id, orgId, userId: req.userId },
        select: { id: true },
    });
    if (!exists)
        return res.status(404).json({ ok: false, error: "Not found" });
    await prisma_1.prisma.brandVoice.delete({ where: { id } });
    return res.json({ ok: true });
});
//# sourceMappingURL=brandVoices.routes.js.map