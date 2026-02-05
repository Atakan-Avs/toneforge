import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchBillingMe,
  createCheckoutSession,
  createPortalSession,
  fetchInvoices,
  type BillingMeResponse,
  type PlanCode,
  type Invoice,
} from "../features/billing/billing.api";

type LoadState =
  | { status: "idle" | "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: BillingMeResponse };

function planLabel(code: PlanCode) {
  if (code === "FREE") return "Free";
  if (code === "PRO") return "Pro";
  return "Premium";
}

export default function BillingPage() {
  const [sp, setSearchParams] = useSearchParams();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [actionLoading, setActionLoading] = useState<null | "PRO" | "PREMIUM" | "PORTAL">(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const success = sp.get("success") === "1";
  const canceled = sp.get("canceled") === "1";

  // ✅ Clean up URL params after showing success/cancel message
  useEffect(() => {
    if (success || canceled) {
      const timer = setTimeout(() => {
        setSearchParams({}, { replace: true });
      }, 5000); // 5 saniye sonra URL'den temizle
      return () => clearTimeout(timer);
    }
  }, [success, canceled, setSearchParams]);

  // ✅ Auto-refresh billing data when success param is present
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setState({ status: "loading" });
        const [billingData, invoiceData] = await Promise.all([
          fetchBillingMe(),
          fetchInvoices(),
        ]);
        if (!mounted) return;
        setState({ status: "ready", data: billingData });
        setInvoices(invoiceData.data ?? []);
      } catch (e: any) {
        if (!mounted) return;
        setState({ status: "error", message: e?.message ?? "Failed to load billing" });
      } finally {
        if (mounted) setInvoicesLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [success]); // ✅ success param değiştiğinde refetch

  // ✅ Invoices are now loaded together with billing data in the main useEffect

  const view = useMemo(() => {
    if (state.status !== "ready") return null;
    const { data } = state;

    const currentPlan = data.planCode;
    // ✅ Backend'den gelen limit ve remaining kullan
    const limit = data.limit ?? 0;
    const used = data.used ?? 0;
    const remaining = data.remaining ?? 0;
    const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

    return { data, currentPlan, used, limit, remaining, pct };
  }, [state]);

  async function onUpgrade(plan: "PRO" | "PREMIUM") {
    try {
      setActionLoading(plan);
      const { url } = await createCheckoutSession(plan);
      window.location.href = url;
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e?.message ?? "Checkout failed");
      setActionLoading(null);
    }
  }

  async function onUpgradeViaPortal() {
    try {
      setActionLoading("PORTAL");
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e?.message ?? "Portal failed");
      setActionLoading(null);
    }
  }

  async function onDowngrade() {
    try {
      setActionLoading("PORTAL");
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e?.message ?? "Portal failed");
      setActionLoading(null);
    }
  }

  async function onManageBilling() {
    try {
      setActionLoading("PORTAL");
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e?.message ?? "Portal failed");
      setActionLoading(null);
    }
  }

  if (state.status === "loading") return <div style={{ padding: 24 }}>Loading billing...</div>;
  if (state.status === "error") return <div style={{ padding: 24 }}>Error: {state.message}</div>;

  const { currentPlan, used, limit, remaining, pct, data } = view!;

  return (
    <div style={{ padding: "clamp(8px, 2vw, 12px)", maxWidth: "980px", width: "100%", margin: "0 auto", overflowX: "hidden", boxSizing: "border-box" }}>
      <h2 style={{ marginBottom: 8, fontSize: "clamp(18px, 4.5vw, 24px)" }}>Billing</h2>

      {success && (
        <div style={{ padding: 12, border: "1px solid #2ecc71", borderRadius: 10, marginBottom: 12 }}>
          Payment successful. Your plan will be active shortly (usually instantly).
        </div>
      )}
      {canceled && (
        <div style={{ padding: 12, border: "1px solid #e67e22", borderRadius: 10, marginBottom: 12 }}>
          Payment canceled.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "clamp(12px, 3vw, 16px)", width: "100%", overflowX: "hidden" }}>
        <div style={{ border: "1px solid #2a2a2a", borderRadius: 14, padding: "clamp(12px, 3vw, 16px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "clamp(11px, 2.5vw, 12px)", opacity: 0.7 }}>Current plan</div>
              <div style={{ fontSize: "clamp(16px, 4vw, 20px)", fontWeight: 700 }}>{planLabel(currentPlan)}</div>
            </div>
            <button
              onClick={onManageBilling}
              disabled={actionLoading !== null}
              style={{
                padding: "clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 12px)",
                borderRadius: 10,
                border: "1px solid #444",
                background: "transparent",
                color: "var(--text)",
                cursor: actionLoading !== null ? "not-allowed" : "pointer",
                opacity: actionLoading !== null ? 0.6 : 1,
                fontSize: "clamp(11px, 2.5vw, 13px)",
                whiteSpace: "nowrap",
              }}
              title="Open Stripe billing portal"
            >
              {actionLoading === "PORTAL" ? "Opening..." : "Manage billing"}
            </button>
          </div>

          {/* Subscription Status & Renewal Info */}
          {data.subscription && (
            <div style={{ marginTop: "clamp(12px, 3vw, 16px)", padding: "clamp(10px, 2.5vw, 12px)", background: "#1a1a1a", borderRadius: 10 }}>
              <div style={{ fontSize: "clamp(11px, 2.5vw, 12px)", opacity: 0.7, marginBottom: 6 }}>Subscription</div>
              <div style={{ fontSize: "clamp(12px, 3vw, 13px)", fontWeight: 600, marginBottom: 8 }}>
                Status: <span style={{ textTransform: "capitalize" }}>{data.subscription.status}</span>
              </div>
              {data.subscription.currentPeriodEnd && (
                <div style={{ fontSize: "clamp(11px, 2.5vw, 12px)", opacity: 0.8 }}>
                  {data.subscription.cancelAtPeriodEnd ? (
                    <>
                      <span style={{ color: "#e67e22" }}>Cancels on: </span>
                      {new Date(data.subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </>
                  ) : (
                    <>
                      <span style={{ color: "#2ecc71" }}>Renews on: </span>
                      {new Date(data.subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: "clamp(12px, 3vw, 16px)" }}>
            <div style={{ fontSize: "clamp(11px, 2.5vw, 12px)", opacity: 0.7 }}>Monthly usage</div>
            <div style={{ marginTop: 6, fontSize: "clamp(13px, 3vw, 14px)" }}>
              <b>{used}</b> / {limit} replies ({pct}%)
            </div>
            <div style={{ height: 10, background: "#222", borderRadius: 999, marginTop: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "#555" }} />
            </div>
            <div style={{ marginTop: 8, fontSize: "clamp(11px, 2.5vw, 12px)", opacity: 0.7 }}>
              <div>Remaining: {remaining} replies</div>
              <div style={{ marginTop: 4 }}>Period: {data.period}</div>
            </div>
          </div>
        </div>

        <div style={{ border: "1px solid #2a2a2a", borderRadius: 14, padding: "clamp(12px, 3vw, 16px)" }}>
          <div style={{ fontSize: "clamp(11px, 2.5vw, 12px)", opacity: 0.7, marginBottom: 8 }}>Plans</div>

          <div style={{ display: "grid", gap: 10 }}>
            <PlanCard
              title="Free"
              subtitle="Good for testing"
              quota="20 replies / month"
              active={currentPlan === "FREE"}
              disabled={true}
              buttonText="Current / Included"
              onClick={() => {}}
            />

            <PlanCard
              title="Pro"
              subtitle="For small teams"
              quota="500 replies / month"
              active={currentPlan === "PRO"}
              disabled={actionLoading !== null || currentPlan === "PRO"}
              buttonText={
                currentPlan === "PRO"
                  ? "Current plan"
                  : currentPlan === "PREMIUM"
                    ? "Downgrade to Pro"
                    : actionLoading === "PRO"
                      ? "Redirecting..."
                      : "Upgrade to Pro"
              }
              onClick={() => {
                if (currentPlan === "PREMIUM") {
                  // PREMIUM → Pro: Portal kullan (downgrade)
                  onDowngrade();
                } else {
                  // FREE → Pro: Checkout kullan
                  onUpgrade("PRO");
                }
              }}
            />

            <PlanCard
              title="Premium"
              subtitle="High volume"
              quota="2000 replies / month"
              active={currentPlan === "PREMIUM"}
              disabled={actionLoading !== null || currentPlan === "PREMIUM"}
              buttonText={
                currentPlan === "PREMIUM"
                  ? "Current plan"
                  : currentPlan === "PRO" && data.subscription
                    ? actionLoading === "PORTAL"
                      ? "Opening..."
                      : "Upgrade to Premium"
                    : actionLoading === "PREMIUM"
                      ? "Redirecting..."
                      : "Upgrade to Premium"
              }
              onClick={() => {
                if (currentPlan === "PRO" && data.subscription) {
                  // PRO → Premium: Portal kullan (upgrade)
                  onUpgradeViaPortal();
                } else {
                  // FREE → Premium: Checkout kullan
                  onUpgrade("PREMIUM");
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Invoices Section */}
      <div style={{ marginTop: "clamp(16px, 4vw, 24px)" }}>
        <div style={{ border: "1px solid #2a2a2a", borderRadius: 14, padding: "clamp(12px, 3vw, 16px)", overflowX: "auto" }}>
          <h3 style={{ margin: "0 0 clamp(12px, 3vw, 16px) 0", fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 700 }}>Invoices</h3>

          {invoicesLoading ? (
            <div style={{ padding: 24, textAlign: "center", color: "#888" }}>Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#888" }}>
              No invoices found.
            </div>
          ) : (
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "600px",
                  borderCollapse: "collapse",
                  fontSize: "clamp(12px, 3vw, 14px)",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #333" }}>
                    <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600, opacity: 0.7 }}>
                      Date
                    </th>
                    <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600, opacity: 0.7 }}>
                      Status
                    </th>
                    <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600, opacity: 0.7 }}>
                      Amount
                    </th>
                    <th style={{ textAlign: "left", padding: "12px 8px", fontWeight: 600, opacity: 0.7 }}>
                      Number
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 8px", fontWeight: 600, opacity: 0.7 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const date = new Date(inv.created * 1000);
                    const amount = (inv.amountPaid || inv.amountDue) / 100; // Stripe amounts are in cents
                    const statusColor =
                      inv.status === "paid"
                        ? "#2ecc71"
                        : inv.status === "open"
                          ? "#3498db"
                          : inv.status === "draft"
                            ? "#95a5a6"
                            : "#e67e22";

                    return (
                      <tr
                        key={inv.id}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--card-hover)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <td style={{ padding: "12px 8px" }}>
                          {date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 12,
                              fontSize: 12,
                              fontWeight: 600,
                              textTransform: "capitalize",
                              background: `${statusColor}20`,
                              color: statusColor,
                              border: `1px solid ${statusColor}40`,
                            }}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 8px", fontWeight: 600 }}>
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: (inv.currency || "usd").toUpperCase(),
                          }).format(amount)}
                        </td>
                        <td style={{ padding: "12px 8px", opacity: 0.8, fontFamily: "monospace", fontSize: 13 }}>
                          {inv.number || "-"}
                        </td>
                        <td style={{ padding: "12px 8px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            {inv.hostedInvoiceUrl && (
                              <button
                                onClick={() => window.open(inv.hostedInvoiceUrl!, "_blank")}
                                className="secondary"
                                style={{
                                  padding: "6px 12px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                Open
                              </button>
                            )}
                            {inv.invoicePdf && (
                              <button
                                onClick={() => window.open(inv.invoicePdf!, "_blank")}
                                className="secondary"
                                style={{
                                  padding: "6px 12px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                PDF
                              </button>
                            )}
                            {!inv.hostedInvoiceUrl && !inv.invoicePdf && (
                              <span style={{ fontSize: 12, opacity: 0.5 }}>-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlanCard(props: {
  title: string;
  subtitle: string;
  quota: string;
  active: boolean;
  disabled: boolean;
  buttonText: string;
  onClick: () => void;
}) {
  return (
    <div style={{ border: "1px solid #333", borderRadius: 12, padding: "clamp(10px, 2.5vw, 12px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "clamp(8px, 2vw, 10px)", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "clamp(14px, 3.5vw, 16px)" }}>
            {props.title}{" "}
            {props.active && (
              <span style={{ fontSize: "clamp(10px, 2.5vw, 12px)", opacity: 0.7, fontWeight: 500 }}>(Current)</span>
            )}
          </div>
          <div style={{ fontSize: "clamp(11px, 2.5vw, 12px)", opacity: 0.7 }}>{props.subtitle}</div>
          <div style={{ marginTop: 6, fontSize: "clamp(11px, 2.5vw, 12px)" }}>{props.quota}</div>
        </div>

        <button
          onClick={props.onClick}
          disabled={props.disabled}
          style={{
            padding: "clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 12px)",
            borderRadius: 10,
            border: "1px solid #444",
            background: props.active ? "#1f1f1f" : props.disabled ? "#333" : "transparent",
            color: props.disabled ? "#fff" : "var(--text)",
            cursor: props.disabled ? "not-allowed" : "pointer",
            opacity: props.disabled ? 1 : 1,
            minHeight: 40,
            alignSelf: "center",
            whiteSpace: "nowrap",
            fontSize: "clamp(11px, 2.5vw, 13px)",
          }}
        >
          {props.buttonText}
        </button>
      </div>
    </div>
  );
}