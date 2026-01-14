import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { hashPassword, verifyPassword } from "../utils/password";
import { signAccessToken } from "../utils/jwt";
import { requireAuth, AuthRequest } from "../middlewares/auth";

export const authRouter = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const { email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ ok: false, error: "Email already exists" });

  try {
    const { user, org } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, passwordHash: await hashPassword(password) },
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

    const token = signAccessToken({ userId: user.id });
    return res.json({ ok: true, user, token, orgId: org.id });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Register failed" });
  }
});

authRouter.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ ok: false, error: "Invalid credentials" });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ ok: false, error: "Invalid credentials" });

  let orgId = user.activeOrgId ?? null;

  // 🔥 EĞER USER'IN HİÇ ORG'U YOKSA → CREATE ET
  if (!orgId) {
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id },
    });

    if (!membership) {
      // 🆕 create org + membership
      const org = await prisma.organization.create({
        data: {
          name: `${user.email.split("@")[0]}'s Workspace`,
        },
      });

      await prisma.membership.create({
        data: {
          userId: user.id,
          orgId: org.id,
          role: "owner",
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { activeOrgId: org.id },
      });

      orgId = org.id;
    } else {
      // membership var ama activeOrgId yok
      orgId = membership.orgId;

      await prisma.user.update({
        where: { id: user.id },
        data: { activeOrgId: orgId },
      });
    }
  }

  const token = signAccessToken({ userId: user.id });

  return res.json({
    ok: true,
    user: { id: user.id, email: user.email },
    token,
    orgId,
  });
});


authRouter.get("/me", requireAuth, async (req: AuthRequest, res) => {
  if (!req.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, createdAt: true },
  });

  return res.json({ ok: true, user });
});