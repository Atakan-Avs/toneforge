import { Router } from "express";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { requireOrgAccess } from "../middlewares/requireOrg";
import {
  getCurrentUsage,
  getFreeMonthlyLimit,
  getPeriodKeyUTC,
} from "../services/usage/usage.service";

export const usageRouter = Router();

/**
 * GET /usage/current
 * Returns current month usage for selected org (x-org-id)
 */
usageRouter.get("/current", requireAuth, requireOrgAccess, async (req: AuthRequest, res) => {
  try {
    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    const orgId = req.orgId!;

    const period = getPeriodKeyUTC();
    const used = await getCurrentUsage(orgId, period);
    const limit = getFreeMonthlyLimit();
    const remaining = Math.max(0, limit - used);

    res.json({ period, used, limit, remaining });
  } catch (err) {
    console.error("GET /usage/current error:", err);
    res.status(500).json({ error: "Failed to load usage" });
  }
});