"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const stripeWebhook_routes_1 = __importDefault(require("./routes/stripeWebhook.routes"));
const health_routes_1 = require("./routes/health.routes");
const replies_routes_1 = require("./routes/replies.routes");
const auth_routes_1 = require("./routes/auth.routes");
const brandVoices_routes_1 = require("./routes/brandVoices.routes");
const templates_routes_1 = require("./routes/templates.routes");
const orgs_routes_1 = require("./routes/orgs.routes");
const usage_routes_1 = require("./routes/usage.routes");
const billing_routes_1 = __importDefault(require("./routes/billing.routes"));
const feedback_routes_1 = __importDefault(require("./routes/feedback.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const app = (0, express_1.default)();
// CORS configuration - allow all origins in production, specific origins in development
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin) {
            return callback(null, true);
        }
        // In development, allow localhost origins
        if (process.env.NODE_ENV === "development") {
            const allowedOrigins = [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ];
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
        }
        // In production, allow all origins (you can restrict this if needed)
        // For mobile devices, we need to allow the origin of the deployed frontend
        callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-org-id"],
    credentials: true,
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};
// Security & basics
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources for mobile
}));
app.use((0, cors_1.default)(corsOptions));
app.use("/webhooks/stripe", stripeWebhook_routes_1.default);
app.use(express_1.default.json({ limit: "1mb" }));
app.use((0, morgan_1.default)("dev"));
// Rate limit (mid-level dokunuş)
app.use((0, express_rate_limit_1.default)({
    windowMs: 60000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false
}));
app.set("trust proxy", 1);
// Routes
app.use("/health", health_routes_1.healthRouter);
app.use("/replies", replies_routes_1.repliesRouter);
app.use("/auth", auth_routes_1.authRouter);
app.use("/brand-voices", brandVoices_routes_1.brandVoicesRouter);
app.use("/templates", templates_routes_1.templatesRouter);
app.use("/orgs", orgs_routes_1.orgsRouter);
app.use("/usage", usage_routes_1.usageRouter);
app.use("/billing", billing_routes_1.default);
app.use("/feedback", feedback_routes_1.default);
app.use("/analytics", analytics_routes_1.default);
// Handle preflight requests
app.options("*", (0, cors_1.default)(corsOptions));
// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
        ok: false,
        error: "Internal server error",
        detail: process.env.NODE_ENV === "development" ? err?.message : undefined
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map