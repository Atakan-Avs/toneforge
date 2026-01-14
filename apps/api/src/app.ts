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


const corsOptions: cors.CorsOptions = {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-org-id"],
};

// Security & basics
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
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


app.use(cors(corsOptions));
app.options("", cors(corsOptions));

export default app;