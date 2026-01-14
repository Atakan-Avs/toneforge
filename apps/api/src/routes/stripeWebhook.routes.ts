import { Router } from "express";
import express from "express";
import { prisma } from "../config/prisma";
import { stripe } from "../lib/stripe";
import type { Prisma } from "@prisma/client";

const router = Router();

/**
 * Stripe webhook MUST use raw body for signature verification.
 * This router mounts with express.raw({ type: "application/json" }).
 */
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string | undefined;

    if (!sig) return res.status(400).send("Missing stripe-signature header");

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("Webhook signature verify failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ✅ Idempotency: Event'i transaction içinde kontrol et ve işle
    try {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Idempotency check: Aynı event daha önce işlendi mi?
        const existing = await tx.stripeEvent.findUnique({
          where: { stripeEventId: event.id },
        });

        if (existing) {
          // Event zaten işlenmiş, sadece success dön
          return;
        }

        // Event kaydı oluştur (henüz işlenmedi, ama kayıt oluştur)
        await tx.stripeEvent.create({
          data: {
            stripeEventId: event.id,
            type: event.type,
            // orgId varsa handleStripeEvent içinde set edilecek
          },
        });

        // Event'i işle (transaction içinde)
        await handleStripeEvent(tx, event);
      });

      return res.json({ received: true });
    } catch (e: any) {
      // Unique constraint violation = event zaten var (idempotency)
      if (e?.code === "P2002" && e?.meta?.target?.includes("stripeEventId")) {
        return res.json({ received: true, message: "Event already processed" });
      }

      console.error("Webhook handler error:", e);
      return res.status(500).json({ message: "Webhook handler error", detail: e?.message });
    }
  }
);

/**
 * Stripe event handler (transaction içinde çalışır)
 */
async function handleStripeEvent(tx: Prisma.TransactionClient, event: any) {
  switch (event.type) {
    /**
     * Subscription state changes
     */
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as any; // Stripe.Subscription

      const orgId = sub?.metadata?.orgId as string | undefined;
      if (!orgId) {
        console.warn("No orgId in subscription.metadata");
        break;
      }

      const stripeSubscriptionId = sub.id as string;
      const stripeCustomerId = sub.customer as string;
      const stripePriceId = sub.items?.data?.[0]?.price?.id as string | undefined;

      const status = sub.status as string; // active, trialing, canceled...
      const cancelAtPeriodEnd = !!sub.cancel_at_period_end;

      const currentPeriodStart = sub.current_period_start
        ? new Date(sub.current_period_start * 1000)
        : null;
      const currentPeriodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null;

      const proPrice = process.env.STRIPE_PRICE_PRO_MONTHLY;
      const premiumPrice = process.env.STRIPE_PRICE_PREMIUM_MONTHLY;

      let planCode: "FREE" | "PRO" | "PREMIUM" = "FREE";

      // Mevcut plan'ı al (plan değişikliğini loglamak için)
      const currentOrg = await tx.organization.findUnique({
        where: { id: orgId },
        select: { planCode: true },
      });
      const oldPlanCode = currentOrg?.planCode ?? "FREE";

      // Aktif/trialing değilse FREE'ye düşür (ürün mantığı)
      if (status === "active" || status === "trialing") {
        if (stripePriceId === proPrice) planCode = "PRO";
        if (stripePriceId === premiumPrice) planCode = "PREMIUM";
      }

      // ✅ Audit trail: Plan değişikliğini logla
      if (oldPlanCode !== planCode) {
        console.log(`[PLAN_CHANGE] orgId: ${orgId}, oldPlan: ${oldPlanCode}, newPlan: ${planCode}, eventType: ${event.type}, stripeSubscriptionId: ${stripeSubscriptionId}, status: ${status}`);
      }

      // Org customerId sync
      await tx.organization.update({
        where: { id: orgId },
        data: {
          stripeCustomerId, // customerId org üzerinde unique
          planCode,
        },
      });

      // Subscription upsert (org başına 1)
      await tx.subscription.upsert({
        where: { orgId },
        update: {
          stripeSubscriptionId,
          stripePriceId: stripePriceId ?? null,
          status,
          cancelAtPeriodEnd,
          currentPeriodStart: currentPeriodStart ?? undefined,
          currentPeriodEnd: currentPeriodEnd ?? undefined,
        },
        create: {
          orgId,
          stripeSubscriptionId,
          stripePriceId: stripePriceId ?? null,
          status,
          cancelAtPeriodEnd,
          currentPeriodStart: currentPeriodStart ?? undefined,
          currentPeriodEnd: currentPeriodEnd ?? undefined,
        },
      });

      // StripeEvent'e orgId yaz (opsiyonel ama iyi)
      await tx.stripeEvent.update({
        where: { stripeEventId: event.id },
        data: { orgId },
      });

      break;
    }

    /**
     * Optional: Checkout completed — genelde subscription events zaten gelir
     */
    case "checkout.session.completed": {
      // burada ekstra bir şey şart değil
      break;
    }

    case "invoice.payment_failed": {
      // istersen burada log/uyarı işleyebiliriz
      break;
    }

    default:
      // Bilinmeyen event type'ları için log
      console.log(`Unhandled event type: ${event.type}`);
      break;
  }
}

export default router;