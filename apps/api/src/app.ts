import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import stripeWebhookRouter from "./routes/stripeWebhook.routes";

import { healthRouter } from "./routes/health.routes";
import { repliesRouter } from "./routes/replies.routes";
import { authRouter } from "./routes/auth.routes";
import { brandVoicesRouter } from "./routes/brandVoices.routes";
import { templatesRouter } from "./routes/templates.routes";
import { orgsRouter } from "./routes/orgs.routes";
import { usageRouter } from "./routes/usage.routes";
import billingRouter from "./routes/billing.routes";
import feedbackRouter from "./routes/feedback.routes";
import analyticsRouter from "./routes/analytics.routes";

const app = express();


// CORS configuration - allow all origins in production, specific origins in development
const corsOptions: cors.CorsOptions = {
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
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources for mobile
}));
app.use(cors(corsOptions));
app.use("/webhooks/stripe", stripeWebhookRouter);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Rate limit (mid-level dokunuş)
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false
  })
);


app.set("trust proxy", 1);

// Routes
app.use("/health", healthRouter);
app.use("/replies", repliesRouter);
app.use("/auth", authRouter);
app.use("/brand-voices", brandVoicesRouter);
app.use("/templates", templatesRouter);
app.use("/orgs", orgsRouter);
app.use("/usage", usageRouter);
app.use("/billing", billingRouter);
app.use("/feedback", feedbackRouter);
app.use("/analytics", analyticsRouter);


app.use((err: any, req: any, res: any, next: any) => {
  console.error("💥 ERROR:", err?.message);
  console.error(err?.stack || err);
  res.status(err?.status || 500).json({
    message: err?.message || "Internal Server Error",
  });
});


app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // preflight first


// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    ok: false,
    error: "Internal server error",
    detail: process.env.NODE_ENV === "development" ? err?.message : undefined
  });
});

export default app;