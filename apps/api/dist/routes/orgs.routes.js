"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orgsRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../config/prisma");
const auth_1 = require("../middlewares/auth");
exports.orgsRouter = (0, express_1.Router)();
exports.orgsRouter.use(auth_1.requireAuth);
exports.orgsRouter.get("/mine", async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ ok: false, error: "Unauthorized" });
        }
        const rows = await prisma_1.prisma.membership.findMany({
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
    }
    catch (err) {
        console.error("GET /orgs/mine error:", err);
        return res.status(500).json({ error: "Failed to load orgs" });
    }
});
//# sourceMappingURL=orgs.routes.js.map