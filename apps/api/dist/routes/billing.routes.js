"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../config/prisma");
const stripe_1 = require("../lib/stripe");
const planQuota_1 = require("../billing/planQuota");
const auth_1 = require("../middlewares/auth");
const requireOrg_1 = require("../middlewares/requireOrg");
const router = (0, express_1.Router)();
// ✅ Auth ve workspace güvenliği zorunlu
router.use(auth_1.requireAuth);
router.use(requireOrg_1.requireOrgAccess);
function priceIdForPlan(plan) {
    if (plan === "PRO")
        return process.env.STRIPE_PRICE_PRO_MONTHLY;
    return process.env.STRIPE_PRICE_PREMIUM_MONTHLY;
}
/**
 * Helper: requireOrgAccess middleware zaten orgId'yi set etti
 * Bu fonksiyon sadece tip güvenliği için
 */
function getOrgId(req) {
    // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
    return req.orgId;
}
router.post("/checkout-session", async (req, res) => {
    try {
        const { plan } = req.body;
        if (plan !== "PRO" && plan !== "PREMIUM") {
            return res.status(400).json({ message: "Invalid plan" });
        }
        // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
        const orgId = getOrgId(req);
        const org = await prisma_1.prisma.organization.findUnique({ where: { id: orgId } });
        if (!org)
            return res.status(404).json({ message: "Organization not found" });
        // stripe customer yoksa oluştur
        let customerId = org.stripeCustomerId ?? null;
        if (!customerId) {
            const customer = await stripe_1.stripe.customers.create({
                metadata: { orgId },
            });
            customerId = customer.id;
            await prisma_1.prisma.organization.update({
                where: { id: orgId },
                data: { stripeCustomerId: customerId },
            });
        }
        const session = await stripe_1.stripe.checkout.sessions.create({
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
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Checkout error" });
    }
});
router.post("/portal-session", async (req, res) => {
    try {
        // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
        const orgId = getOrgId(req);
        const org = await prisma_1.prisma.organization.findUnique({ where: { id: orgId } });
        if (!org)
            return res.status(404).json({ message: "Organization not found" });
        // ✅ Customer yoksa oluştur
        let customerId = org.stripeCustomerId ?? null;
        if (!customerId) {
            const customer = await stripe_1.stripe.customers.create({
                metadata: { orgId },
            });
            customerId = customer.id;
            await prisma_1.prisma.organization.update({
                where: { id: orgId },
                data: { stripeCustomerId: customerId },
            });
        }
        const portal = await stripe_1.stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.APP_URL}/app/billing`,
        });
        return res.json({ url: portal.url });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Portal error" });
    }
});
router.get("/me", async (req, res) => {
    try {
        // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
        const orgId = getOrgId(req);
        const org = await prisma_1.prisma.organization.findUnique({
            where: { id: orgId },
            include: { subscription: true },
        });
        if (!org)
            return res.status(404).json({ message: "Organization not found" });
        const now = new Date();
        const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
        // ✅ compound unique isimle uğraşmadan güvenli kullanım
        const usage = await prisma_1.prisma.usage.findFirst({
            where: { orgId, period },
        });
        const used = usage?.count ?? 0;
        const limit = (0, planQuota_1.monthlyQuota)(org.planCode);
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
    }
    catch (e) {
        console.error("BILLING /me ERROR:", e);
        return res.status(500).json({
            message: "Billing me error",
            detail: e?.message, // ✅ gerçek hatayı gör
        });
    }
});
router.get("/invoices", async (req, res) => {
    try {
        // ✅ requireOrgAccess middleware zaten orgId'yi set etti ve member kontrolü yaptı
        const orgId = getOrgId(req);
        const org = await prisma_1.prisma.organization.findUnique({ where: { id: orgId } });
        if (!org?.stripeCustomerId)
            return res.json({ data: [] });
        const invoices = await stripe_1.stripe.invoices.list({
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
    }
    catch (e) {
        console.error("INVOICES ERROR:", e);
        return res.status(500).json({ message: "Invoices error", detail: e?.message });
    }
});
exports.default = router;
//# sourceMappingURL=billing.routes.js.map