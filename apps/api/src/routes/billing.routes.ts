import { Router, Request } from "express";
import { prisma } from "../config/prisma";
import { stripe } from "../lib/stripe";
import { monthlyQuota } from "../billing/planQuota";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import { requireOrgAccess } from "../middlewares/requireOrg";

const router = Router();

// ✅ Auth ve workspace güvenliği zorunlu
router.use(requireAuth);
router.use(requireOrgAccess);

type PaidPlan = "PRO" | "PREMIUM";

function priceIdForPlan(plan: PaidPlan) {
  if (plan === "PRO") return process.env.STRIPE_PRICE_PRO_MONTHLY!;
  return process.env.STRIPE_PRICE_PREMIUM_MONTHLY!;
}

/**
 * Helper: requireOrgAccess middleware zaten orgId'yi set etti
 * Bu fonksiyon sadece tip güvenliği için
 */
function getOrgId(req: AuthRequest): string {
  // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
  return req.orgId!;
}


router.post("/checkout-session", async (req: AuthRequest, res) => {
  try {
    const { plan } = req.body as { plan: PaidPlan };
    if (plan !== "PRO" && plan !== "PREMIUM") {
      return res.status(400).json({ message: "Invalid plan" });
    }

    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    const orgId = getOrgId(req);

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return res.status(404).json({ message: "Organization not found" });

    // stripe customer yoksa oluştur
    let customerId = org.stripeCustomerId ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { orgId },
      });
      customerId = customer.id;

      await prisma.organization.update({
        where: { id: orgId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceIdForPlan(plan), quantity: 1 }],
      success_url: `${process.env.APP_URL}/app/billing?success=1`,
      cancel_url: `${process.env.APP_URL}/app/billing?canceled=1`,
      subscription_data: {
        metadata: { orgId },
      },
      metadata: { orgId, plan },
      allow_promotion_codes: true,
    });

    return res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Checkout error" });
  }
});

router.post("/portal-session", async (req: AuthRequest, res) => {
  try {
    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    const orgId = getOrgId(req);

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return res.status(404).json({ message: "Organization not found" });

    // ✅ Customer yoksa oluştur
    let customerId = org.stripeCustomerId ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { orgId },
      });
      customerId = customer.id;

      await prisma.organization.update({
        where: { id: orgId },
        data: { stripeCustomerId: customerId },
      });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL}/app/billing`,
    });

    return res.json({ url: portal.url });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Portal error" });
  }
});

router.get("/me", async (req: AuthRequest, res) => {
  try {
    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    const orgId = getOrgId(req);

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { subscription: true },
    });
    if (!org) return res.status(404).json({ message: "Organization not found" });

    const now = new Date();
    const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    // ✅ compound unique isimle uğraşmadan güvenli kullanım
    const usage = await prisma.usage.findFirst({
      where: { orgId, period },
    });

    const used = usage?.count ?? 0;
    const limit = monthlyQuota(org.planCode);
    const remaining = Math.max(0, limit - used);

    return res.json({
      orgId: org.id,
      planCode: org.planCode,
      subscription: org.subscription,
      period,
      used,
      limit,
      remaining,
    });
  } catch (e: any) {
    console.error("BILLING /me ERROR:", e);
    return res.status(500).json({
      message: "Billing me error",
      detail: e?.message, // ✅ gerçek hatayı gör
    });
  }
});

router.get("/invoices", async (req: AuthRequest, res) => {
  try {
    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    const orgId = getOrgId(req);

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org?.stripeCustomerId) return res.json({ data: [] });

    const invoices = await stripe.invoices.list({
      customer: org.stripeCustomerId,
      limit: 20,
    });

    return res.json({
      data: invoices.data.map((inv) => ({
        id: inv.id,
        status: inv.status,
        currency: inv.currency,
        amountPaid: inv.amount_paid,
        amountDue: inv.amount_due,
        created: inv.created, // unix timestamp
        hostedInvoiceUrl: inv.hosted_invoice_url,
        invoicePdf: inv.invoice_pdf,
        number: inv.number,
      })),
    });
  } catch (e: any) {
    console.error("INVOICES ERROR:", e);
    return res.status(500).json({ message: "Invoices error", detail: e?.message });
  }
});

export default router;