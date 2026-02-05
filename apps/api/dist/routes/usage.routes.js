"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usageRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const requireOrg_1 = require("../middlewares/requireOrg");
const usage_service_1 = require("../services/usage/usage.service");
exports.usageRouter = (0, express_1.Router)();
/**
 * GET /usage/current
 * Returns current month usage for selected org (x-org-id)
 */
exports.usageRouter.get("/current", auth_1.requireAuth, requireOrg_1.requireOrgAccess, async (req, res) => {
    try {
        // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
        const orgId = req.orgId;
        const period = (0, usage_service_1.getPeriodKeyUTC)();
        const used = await (0, usage_service_1.getCurrentUsage)(orgId, period);
        const limit = (0, usage_service_1.getFreeMonthlyLimit)();
        const remaining = Math.max(0, limit - used);
        res.json({ period, used, limit, remaining });
    }
    catch (err) {
        console.error("GET /usage/current error:", err);
        res.status(500).json({ error: "Failed to load usage" });
    }
});
//# sourceMappingURL=usage.routes.js.map