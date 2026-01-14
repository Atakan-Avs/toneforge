import { Router } from "express";
import { prisma } from "../config/prisma";
import { requireAuth, AuthRequest } from "../middlewares/auth";

export const orgsRouter = Router();
orgsRouter.use(requireAuth);

orgsRouter.get("/mine", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const rows = await prisma.membership.findMany({
      where: { userId },
      select: {
        role: true,
        org: {
          select: { id: true, name: true, createdAt: true },
        },
      },
      
      // orderBy: { org: { createdAt: "desc" } },
    });

    
    const orgs = rows
      .map((r) => ({
        id: r.org.id,
        name: r.org.name,
        createdAt: r.org.createdAt,
        role: r.role ?? "member",
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ ok: true, orgs });
  } catch (err) {
    console.error("GET /orgs/mine error:", err);
    return res.status(500).json({ error: "Failed to load orgs" });
  }
});