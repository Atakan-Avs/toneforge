"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function requireAuth(req, res, next) {
    // ✅ preflight auth’a takılmasın
    if (req.method === "OPTIONS")
        return res.sendStatus(204);
    const auth = req.headers.authorization;
    if (!auth) {
        return res.status(401).json({
            ok: false,
            error: "Unauthorized: missing Authorization header",
            debug: {
                hasOrgHeader: !!req.headers["x-org-id"],
                origin: req.headers.origin,
                path: req.originalUrl,
            },
        });
    }
    const m = String(auth).match(/^Bearer\s+(.+)$/i);
    if (!m) {
        return res.status(401).json({
            ok: false,
            error: "Unauthorized: invalid Authorization format (expected 'Bearer <token>')",
            debug: { authorization: auth },
        });
    }
    const token = m[1].trim();
    try {
        const secret = process.env.JWT_SECRET || process.env.AUTH_JWT_SECRET;
        if (!secret) {
            return res.status(500).json({
                ok: false,
                error: "Server misconfigured: JWT_SECRET missing",
            });
        }
        const payload = jsonwebtoken_1.default.verify(token, secret);
        // ✅ projendeki gibi req.userId / req.orgId set et
        req.userId = payload.userId || payload.sub;
        // orgId header’dan geliyor zaten
        req.orgId = req.headers["x-org-id"] || payload.orgId || null;
        if (!req.userId) {
            return res.status(401).json({
                ok: false,
                error: "Unauthorized: token verified but userId missing in payload",
                debug: payload,
            });
        }
        return next();
    }
    catch (e) {
        return res.status(401).json({
            ok: false,
            error: "Unauthorized: token verify failed",
            detail: e?.message ?? String(e),
        });
    }
}
//# sourceMappingURL=auth.js.map