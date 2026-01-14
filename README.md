# ToneForge 🚀  
**AI-powered customer reply workflow for modern support teams**

ToneForge is a production-ready, multi-tenant SaaS that helps teams generate **consistent, on-brand customer replies** for real support scenarios such as refunds, shipping delays, complaints, and pricing questions.

This is **not a generic ChatGPT wrapper**.  
ToneForge is designed around **business context, tone control, brand voice enforcement, and subscription-based usage limits**.

---

## ✨ Key Features

### 🧠 Context-aware AI replies
- Focused on real customer support scenarios
- Encourages **describing the situation**, not writing prompts
- Supports tone selection (formal, friendly, calm, etc.)

### 🎭 Brand Voice & Templates
- **Brand Voice**: enforce communication rules, wording, and style
- **Templates**: reusable responses for common cases (refunds, shipping, pricing)
- Prevents inconsistent or off-brand replies at scale

### 🏢 Multi-tenant SaaS Architecture
- Organization-based data isolation
- Membership system (`owner` / `member`)
- Secure org-level access enforcement

### 💳 Subscription Billing (Stripe)
- Free / Pro / Premium plans
- Plan-based quotas & feature gating
- Stripe Checkout & Billing Portal
- Webhook-driven subscription sync (idempotent & retry-safe)

### 📊 Usage & Quota Enforcement
- Monthly usage tracking per organization
- Atomic quota consumption
- Hard enforcement before AI generation
- Upgrade prompts when limits are reached

### 🧾 Billing Dashboard
- Current plan & status
- Quota usage (used / remaining)
- Subscription details & invoices
- Upgrade / manage billing actions

### 🎨 Professional Dashboard UI
- Sales-ready layout with sidebar & topbar
- Smooth transitions, loading & empty states
- Clear upgrade CTAs and pricing flow

---

## 🧩 Why ToneForge is different

Most AI tools generate text.

ToneForge generates **business-safe replies** by combining:
- Customer context
- Tone selection
- Brand rules
- Templates
- Plan-aware usage limits

> The goal is not creativity — it’s **consistency, speed, and trust**.

---

## 🏗️ Architecture Overview

**High-level flow:**

Auth → Organization → Billing → Quota → AI Generation → Persistence



### Backend
- Node.js + TypeScript (Express)
- Prisma ORM + PostgreSQL
- JWT authentication
- Stripe subscriptions & webhooks
- Organization-level access middleware

### Frontend
- React + TypeScript (Vite)
- Dashboard-oriented layout
- Feature-aware UI (plan & quota driven)
- Clean separation by feature modules

---

## 🔐 Security & Multi-tenancy

- JWT-based authentication
- Organization access enforced via membership checks
- No blind trust in client-provided org IDs
- Billing & usage strictly scoped per organization

This prevents cross-tenant data access and mirrors real production SaaS requirements.

---

## 💸 Billing & Plans

| Plan     | Usage Quota | Features |
|----------|-------------|----------|
| Free     | Limited     | Core generation |
| Pro      | Higher      | Templates, extended usage |
| Premium  | Highest     | Bulk usage, advanced workflows |

- Stripe Checkout for upgrades
- Stripe Billing Portal for plan changes & invoices
- Webhook-driven subscription state (idempotent)

---

## 🧪 Development Setup

### Requirements
- Node.js 18+
- PostgreSQL
- Stripe test account

### Environment Variables
Sensitive values are **not committed**.  
Use the provided `.env.example` files.

```bash
apps/api/.env.example
apps/web/.env.example


📦 Database & Migrations

Prisma schema-first workflow

Migrations are committed

Usage is tracked per organization per month (YYYY-MM)

🧠 Engineering Decisions (Highlights)

Organization-based quotas instead of per-user limits

Webhook idempotency to safely handle Stripe retries

Plan-aware feature gating instead of UI-only restrictions

Pre-generation quota enforcement to avoid over-usage

These choices reflect real-world SaaS constraints and scalability concerns.

🚀 Current Status

ToneForge is feature-complete and production-ready:

Core product works end-to-end

Billing and quota enforcement are live

Dashboard UI is sales-ready

Currently suitable for:

Private beta

Micro-SaaS monetization

Portfolio & senior-level engineering showcase

📌 Future Improvements

Async job queue for bulk generation

Reply effectiveness feedback (👍 / 👎)

Advanced analytics & insights

Team invitations & role management

👤 Author

Built by Atakan Avsever
Focused on production-grade backend systems and SaaS architecture.
