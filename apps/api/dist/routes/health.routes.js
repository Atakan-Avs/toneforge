"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
exports.healthRouter = (0, express_1.Router)();
exports.healthRouter.get("/", (req, res) => {
    res.json({
        ok: true,
        service: "replypilot-api",
        time: new Date().toISOString()
    });
});
//# sourceMappingURL=health.routes.js.map