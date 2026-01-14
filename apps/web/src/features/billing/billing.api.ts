import api from "../../api/client";

export type PlanCode = "FREE" | "PRO" | "PREMIUM";

export type BillingMeResponse = {
  orgId: string;
  planCode: PlanCode;
  subscription: null | {
    id: string;
    orgId: string;
    stripeSubscriptionId: string;
    stripePriceId: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    createdAt: string;
    updatedAt: string;
  };
  period: string;
  used: number;
  limit: number;
  remaining: number;
};

export async function fetchBillingMe(): Promise<BillingMeResponse> {
  const res = await api.get("/billing/me");
  return res.data;
}

export async function createCheckoutSession(plan: "PRO" | "PREMIUM"): Promise<{ url: string }> {
  const res = await api.post("/billing/checkout-session", { plan });
  return res.data;
}

export async function createPortalSession(): Promise<{ url: string }> {
  const res = await api.post("/billing/portal-session");
  return res.data;
}

export type Invoice = {
  id: string;
  status: string;
  currency: string;
  amountPaid: number;
  amountDue: number;
  created: number; // unix timestamp
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  number: string | null;
};

export type InvoicesResponse = {
  data: Invoice[];
};

export async function fetchInvoices(): Promise<InvoicesResponse> {
  const res = await api.get("/billing/invoices");
  return res.data;
}