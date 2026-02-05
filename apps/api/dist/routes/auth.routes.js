"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../config/prisma");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const auth_1 = require("../middlewares/auth");
exports.authRouter = (0, express_1.Router)();
const RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.authRouter.post("/register", async (req, res) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ ok: false, error: parsed.error.flatten() });
    const { email, password } = parsed.data;
    const exists = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (exists)
        return res.status(409).json({ ok: false, error: "Email already exists" });
    try {
        const { user, org } = await prisma_1.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: { email, passwordHash: await (0, password_1.hashPassword)(password) },
                select: { id: true, email: true, createdAt: true },
            });
            const org = await tx.organization.create({
                data: { name: `${email.split("@")[0]}'s Workspace` },
                select: { id: true, name: true, createdAt: true },
            });
            await tx.membership.create({
                data: { userId: user.id, orgId: org.id, role: "owner" },
            });
            await tx.user.update({
                where: { id: user.id },
                data: { activeOrgId: org.id },
            });
            return { user, org };
        });
        const token = (0, jwt_1.signAccessToken)({ userId: user.id });
        return res.json({ ok: true, user, token, orgId: org.id });
    }
    catch (e) {
        console.error("Register error:", e);
        return res.status(500).json({
            ok: false,
            error: "Register failed",
            detail: process.env.NODE_ENV === "development" ? e?.message : undefined
        });
    }
});
exports.authRouter.post("/login", async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ ok: false, error: parsed.error.flatten() });
    }
    const { email, password } = parsed.data;
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        return res.status(401).json({ ok: false, error: "Invalid credentials" });
    const ok = await (0, password_1.verifyPassword)(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ ok: false, error: "Invalid credentials" });
    let orgId = user.activeOrgId ?? null;
    // 🔥 EĞER USER'IN HİÇ ORG'U YOKSA → CREATE ET
    if (!orgId) {
        const membership = await prisma_1.prisma.membership.findFirst({
            where: { userId: user.id },
        });
        if (!membership) {
            // 🆕 create org + membership
            const org = await prisma_1.prisma.organization.create({
                data: {
                    name: `${user.email.split("@")[0]}'s Workspace`,
                },
            });
            await prisma_1.prisma.membership.create({
                data: {
                    userId: user.id,
                    orgId: org.id,
                    role: "owner",
                },
            });
            await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: { activeOrgId: org.id },
            });
            orgId = org.id;
        }
        else {
            // membership var ama activeOrgId yok
            orgId = membership.orgId;
            await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: { activeOrgId: orgId },
            });
        }
    }
    const token = (0, jwt_1.signAccessToken)({ userId: user.id });
    return res.json({
        ok: true,
        user: { id: user.id, email: user.email },
        token,
        orgId,
    });
});
exports.authRouter.get("/me", auth_1.requireAuth, async (req, res) => {
    if (!req.userId)
        return res.status(401).json({ ok: false, error: "Unauthorized" });
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, email: true, createdAt: true },
    });
    return res.json({ ok: true, user });
});
//# sourceMappingURL=auth.routes.js.map