import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../api/client";
import { getBrandVoices, getTemplates } from "../api/lookups";
import UsageBar from "../components/UsageBar";
import { fetchUsage } from "../api/usage";
import type { UsageResponse } from "../api/usage";
import HistoryItem from "../components/HistoryItem";
import HistoryModal from "../components/HistoryModal";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useRef } from "react";
import { useLocation } from "react-router-dom";
import { submitFeedback, type FeedbackRating } from "../features/feedback/feedback.api";
import { fetchUsageInsights } from "../features/analytics/analytics.api";


type Theme = "light" | "dark";
type Tone = "formal" | "friendly" | "short";

// Lookups types (minimum)
type BrandVoiceLookup = { id: string; name: string };
type TemplateLookup = { id: string; category: string };

export default function GeneratorPage() {
  const { orgId } = useWorkspace();


  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<Tone>("friendly");

  const [cooldown, setCooldown] = useState(0); // saniye
  const [genNotice, setGenNotice] = useState<string | null>(null);

  const location = useLocation();
  const prevOrgRef = useRef<string | null>(null);


  // dropdown selections
  const [brandVoiceId, setBrandVoiceId] = useState<string | undefined>(undefined);
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);

  const [result, setResult] = useState("");
  const [currentReplyId, setCurrentReplyId] = useState<string | null>(null); // ✅ For feedback
  const [feedbackRating, setFeedbackRating] = useState<FeedbackRating | null>(null);
  const [feedbackReason, setFeedbackReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [usageInsights, setUsageInsights] = useState<{
    period: string;
    totalReplies: number;
    estimatedMinutesSaved: number;
    estimatedHoursSaved: number;
    mostCommonTone: string | null;
    mostCommonIssue: string | null;
  } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [brandVoices, setBrandVoices] = useState<BrandVoiceLookup[]>([]);
  const [templates, setTemplates] = useState<TemplateLookup[]>([]);
  const [loading, setLoading] = useState(false);

  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<any | null>(null);

  const [historyQuery, setHistoryQuery] = useState("");
  const [historyTone, setHistoryTone] = useState<"" | Tone>("");

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "light";
  });

  // ✅ Workspace-specific storage keys
  const safeOrgId = orgId ?? "no-org";
  const BV_KEY = `brandVoiceId:${safeOrgId}`;
  const TPL_KEY = `templateId:${safeOrgId}`;


  // ✅ selection preview labels
  const selectedBrandVoiceName = useMemo(() => {
    if (!brandVoiceId) return null;
    return brandVoices.find((b) => b.id === brandVoiceId)?.name ?? "Selected";
  }, [brandVoiceId, brandVoices]);

  const selectedTemplateCategory = useMemo(() => {
    if (!templateId) return null;
    return templates.find((t) => t.id === templateId)?.category ?? "Selected";
  }, [templateId, templates]);

  const templateLabelById = useMemo(() => {
    const m = new Map<string, string>();
    templates.forEach((t) => m.set(t.id, t.category));
    return m;
  }, [templates]);

  const brandLabelById = useMemo(() => {
    const m = new Map<string, string>();
    brandVoices.forEach((b) => m.set(b.id, b.name));
    return m;
  }, [brandVoices]);

  async function loadUsage() {
    try {
      setUsageLoading(true);
      const data = await fetchUsage();
      if (data?.ok) setUsage(data);
    } finally {
      setUsageLoading(false);
    }
  }

  async function loadUsageInsights() {
    if (!orgId) return;
    try {
      setInsightsLoading(true);
      const data = await fetchUsageInsights();
      if (data?.ok) setUsageInsights(data.insights);
    } catch (err) {
      console.error("Failed to load usage insights:", err);
      setUsageInsights(null);
    } finally {
      setInsightsLoading(false);
    }
  }

  const loadHistory = useCallback(async () => {
    if (!orgId) return;
    const params: any = { limit: 50 };
    if (historyQuery.trim()) params.q = historyQuery.trim();
    if (historyTone) params.tone = historyTone;

    const res = await api.get("/replies/history", { params });
    setHistory(res.data.items ?? []);
  }, [orgId, historyQuery, historyTone]);

  async function loadLookups() {
    if (!orgId) return;
    const [bv, tpl] = await Promise.all([getBrandVoices(), getTemplates()]);

    setBrandVoices((bv ?? []).map((b: any) => ({ id: b.id, name: b.name })));
    setTemplates((tpl ?? []).map((t: any) => ({ id: t.id, category: t.category })));

    // ✅ org-specific localStorage reads
    const storedBV = localStorage.getItem(BV_KEY) ?? "";
    if (storedBV && !(bv ?? []).some((x: any) => x.id === storedBV)) {
      localStorage.removeItem(BV_KEY);
      setBrandVoiceId(undefined);
    } else if (storedBV) {
      setBrandVoiceId(storedBV);
    } else {
      setBrandVoiceId(undefined);
    }

    const storedTpl = localStorage.getItem(TPL_KEY) ?? "";
    if (storedTpl && !(tpl ?? []).some((x: any) => x.id === storedTpl)) {
      localStorage.removeItem(TPL_KEY);
      setTemplateId(undefined);
    } else if (storedTpl) {
      setTemplateId(storedTpl);
    } else {
      setTemplateId(undefined);
    }
  }

  async function generate() {
    if (!message.trim()) return;
    if (loading) return;
    if (cooldown > 0) return;

    setLoading(true);
    setGenNotice(null);

    try {
      const res = await api.post("/replies/generate", {
        customerMessage: message,
        tone,
        brandVoiceId: brandVoiceId || undefined,
        templateId: templateId || undefined,
      });

      const saved = res.data?.reply ?? null;

      setResult(saved?.result ?? "");
      setCurrentReplyId(saved?.id ?? null); // ✅ Save reply ID for feedback
      // ✅ Reset feedback state for new reply
      setFeedbackRating(null);
      setFeedbackReason("");
      setShowReasonInput(false);
      setFeedbackSubmitted(false);
      setMessage("");

      // ✅ live quota update (anında UI)
      const q = res.data?.quota;
      if (q) {
        setUsage({
          ok: true,
          period: q.period,
          used: q.usedAfter,
          limit: q.limit,
          remaining: q.remaining,
        });
      }

      // ✅ optimistic history update
      if (saved) {
        setHistory((prev) => {
          const next = [saved, ...prev.filter((x) => x.id !== saved.id)];
          return next.slice(0, 20);
        });
      } else {
        await loadHistory();
      }
    } catch (err: any) {
      const status = err?.response?.status;

      // Network errors (no response) - common on mobile
      if (!err?.response) {
        if (err?.code === "ECONNABORTED" || err?.message?.includes("timeout")) {
          setGenNotice("Request timeout. Please check your connection and try again.");
        } else if (err?.message?.includes("Network Error") || err?.message?.includes("Failed to fetch")) {
          setGenNotice("Network error. Please check your internet connection and try again.");
        } else {
          setGenNotice(err?.message || "Network error. Please try again.");
        }
        return;
      }

      if (status === 429 || status === 402) {
        // ✅ cooldown başlat
        setCooldown(5);

        const q = err?.response?.data?.quota;
        setGenNotice(
          status === 402
            ? `Quota exceeded (${q?.used ?? "?"}/${q?.limit ?? "?"}). Please upgrade your plan.`
            : `Rate limit reached. Try again in a few seconds.`
        );

        // quota güncelle
        await loadUsage();
        return;
      }

      const msg = err?.response?.data?.error ?? err?.message ?? "Request failed. Please try again.";
      setGenNotice(msg);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    if (!orgId) return;

    const prev = prevOrgRef.current;
    const orgChanged = !!prev && prev !== orgId;
    prevOrgRef.current = orgId;

    // ✅ SADECE org değiştiyse temizle (yoksa geri gelince "silinmiş" hissi olur)
    if (orgChanged) {
      setHistory([]);
      setTemplates([]);
      setBrandVoices([]);
    }

    // ✅ her durumda yeniden çek (geri dönünce de dolsun)
    loadLookups();
    loadHistory();
    loadUsage();
    loadUsageInsights(); // ✅ Load usage insights
  }, [orgId, loadHistory]); // ✅ loadHistory dependency'lerini içeriyor (orgId, historyQuery, historyTone)


  // ✅ History query/tone değiştiğinde yeniden yükle (loadHistory zaten orgId değişiminde de çalışıyor, bu sadece query/tone için)
  useEffect(() => {
    if (!orgId) return;
    loadHistory();
  }, [historyQuery, historyTone, loadHistory]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function applyFromHistory(item: any) {
    setMessage(item.customerMessage ?? "");
    setTone((item.tone as Tone) ?? "friendly");

    // history item'da id alanları varsa uygula
    setBrandVoiceId(item.brandVoiceId ?? undefined);
    setTemplateId(item.templateId ?? undefined);

    // localStorage'a da yaz (workspace keyleri)
    if (item.brandVoiceId) localStorage.setItem(BV_KEY, item.brandVoiceId);
    else localStorage.removeItem(BV_KEY);

    if (item.templateId) localStorage.setItem(TPL_KEY, item.templateId);
    else localStorage.removeItem(TPL_KEY);

    setSelectedHistory(null);
    setResult("");
    setCurrentReplyId(null);
    setFeedbackRating(null);
    setFeedbackReason("");
    setShowReasonInput(false);
    setFeedbackSubmitted(false);
  }

  async function regenerateFromHistory(item: any) {
    applyFromHistory(item);
    // küçük timeout: state set edilsin sonra generate çalışsın
    setTimeout(() => {
      // message state’i dolduktan sonra generate çağır
      // generate current state kullanıyor, o yüzden direkt çağırıyoruz
      generate();
    }, 0);
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);



  return (
    <div className="container" style={{ maxWidth: "1400px", width: "100%", overflowX: "hidden", boxSizing: "border-box", padding: "clamp(8px, 2vw, 24px) clamp(8px, 2vw, 16px)" }}>
      {/* Header */}
      <div
        className="topbar"
        style={{
          display: "flex",
          gap: "clamp(8px, 2vw, 12px)",
          alignItems: "center",
          marginBottom: "clamp(12px, 3vw, 16px)",
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        <h2
          className="header"
          style={{
            margin: 0,
            flex: 1,
            fontSize: "clamp(18px, 4.5vw, 28px)",
            minWidth: 0,
          }}
        >
          AI Reply Generator
        </h2>

        <button
          className="secondary"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          style={{
            padding: "clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 14px)",
            fontSize: "clamp(10px, 2.5vw, 13px)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {theme === "light" ? "Dark" : "Light"}
        </button>
      </div>

      {/* Usage Bar */}
      <div className="usage-row" style={{ marginBottom: "clamp(12px, 3vw, 16px)", width: "100%" }}>
        <div style={{ width: "100%" }}>
          {usageLoading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(4px, 1vw, 8px)",
                color: "var(--text-secondary)",
                marginBottom: "clamp(8px, 2vw, 12px)",
              }}
            >
              <div className="spinner" style={{ width: "16px", height: "16px" }} />
              Loading usage…
            </div>
          )}
          {usage && <UsageBar used={usage.used} limit={usage.limit} period={usage.period} />}

          {/* ✅ Usage Insights */}
          {usageInsights && (
            <div
              className="card"
              style={{
                padding: "var(--spacing-lg)",
                marginTop: "var(--spacing-md)",
                background: "var(--primary-light)",
                border: "1px solid var(--primary)",
              }}
            >
              <h4
                style={{
                  margin: "0 0 var(--spacing-md) 0",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                Usage Insights (Last 7 Days)
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "var(--spacing-md)",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Replies Generated
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)" }}>
                    {usageInsights.totalReplies}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Time Saved
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--success)" }}>
                    {usageInsights.estimatedHoursSaved > 0
                      ? `${usageInsights.estimatedHoursSaved}h`
                      : `${usageInsights.estimatedMinutesSaved}m`}
                  </div>
                </div>
                {usageInsights.mostCommonTone && (
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Most Used Tone
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", textTransform: "capitalize" }}>
                      {usageInsights.mostCommonTone}
                    </div>
                  </div>
                )}
                {usageInsights.mostCommonIssue && (
                  <div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Common Issue
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", textTransform: "capitalize" }}>
                      {usageInsights.mostCommonIssue}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div />
      </div>


      <div className="grid" style={{ width: "100%" }}>
        {/* LEFT: Generator */}
        <div className="card" style={{ width: "100%", minWidth: 0 }}>
          <h3 style={{ fontSize: "clamp(16px, 4vw, 20px)", marginBottom: "clamp(12px, 3vw, 16px)" }}>
            Customer Message
          </h3>

          <textarea
            rows={6}
            placeholder="Paste the customer message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              marginBottom: "var(--spacing-md)",
              fontFamily: "var(--font-sans)",
            }}
          />

          <div className="controls" style={{ width: "100%" }}>
            <div style={{ width: "100%" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "clamp(11px, 2.5vw, 12px)",
                  fontWeight: 600,
                  marginBottom: "6px",
                  color: "var(--text-secondary)",
                }}
              >
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
                style={{ width: "100%" }}
              >
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
                <option value="short">Short</option>
              </select>
            </div>

            <div style={{ width: "100%" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "clamp(11px, 2.5vw, 12px)",
                  fontWeight: 600,
                  marginBottom: "6px",
                  color: "var(--text-secondary)",
                }}
              >
                Brand Voice
              </label>
              <select
                value={brandVoiceId ?? ""}
                onChange={(e) => {
                  const v = e.target.value || "";
                  const next = v ? v : undefined;
                  setBrandVoiceId(next);

                  if (next) localStorage.setItem(BV_KEY, next);
                  else localStorage.removeItem(BV_KEY);
                }}
                style={{ width: "100%" }}
              >
                <option value="">No brand voice</option>
                {brandVoices.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: "100%" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "clamp(11px, 2.5vw, 12px)",
                  fontWeight: 600,
                  marginBottom: "6px",
                  color: "var(--text-secondary)",
                }}
              >
                Template
              </label>
              <select
                value={templateId ?? ""}
                onChange={(e) => {
                  const v = e.target.value || "";
                  const next = v ? v : undefined;
                  setTemplateId(next);

                  if (next) localStorage.setItem(TPL_KEY, next);
                  else localStorage.removeItem(TPL_KEY);
                }}
                style={{ width: "100%" }}
              >
                <option value="">No template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.category}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={generate}
              disabled={loading || cooldown > 0 || !message.trim()}
              style={{
                marginTop: "clamp(8px, 2vw, 12px)",
                padding: "clamp(10px, 2.5vw, 14px)",
                fontSize: "clamp(13px, 3vw, 15px)",
                fontWeight: 600,
                width: "100%",
              }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: "16px", height: "16px", marginRight: "8px" }} />
                  Generating...
                </>
              ) : cooldown > 0 ? (
                `Try again in ${cooldown}s`
              ) : (
                "Generate Reply"
              )}
            </button>

            {genNotice && (
              <div
                style={{
                  marginTop: "var(--spacing-md)",
                  padding: "var(--spacing-md)",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid var(--error)",
                  color: "var(--error)",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {genNotice}
              </div>
            )}
          </div>

          {/* Selection Preview */}
          {(selectedBrandVoiceName || selectedTemplateCategory) && (
            <div
              style={{
                marginTop: "var(--spacing-lg)",
                padding: "var(--spacing-md)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
                background: "var(--primary-light)",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              {selectedBrandVoiceName && (
                <div style={{ marginBottom: selectedTemplateCategory ? "6px" : 0 }}>
                  <strong style={{ color: "var(--primary)" }}>Brand voice:</strong>{" "}
                  {selectedBrandVoiceName}
                </div>
              )}
              {selectedTemplateCategory && (
                <div>
                  <strong style={{ color: "var(--primary)" }}>Template:</strong>{" "}
                  {selectedTemplateCategory}
                </div>
              )}
            </div>
          )}

          {/* Generated Result */}
          {result && (
            <div className="result-box">
              <strong>Generated Reply</strong>
              <p>{result}</p>
              <div style={{ display: "flex", gap: "var(--spacing-sm)", flexWrap: "wrap", marginTop: "var(--spacing-md)" }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result);
                  }}
                  style={{
                    padding: "10px 16px",
                    fontSize: "13px",
                  }}
                >
                  Copy to Clipboard
                </button>
                
                {/* ✅ Feedback Buttons */}
                {currentReplyId && (
                  <>
                    <button
                      onClick={async () => {
                        if (feedbackSubmitted && feedbackRating === "thumbs_up") return;
                        setFeedbackLoading(true);
                        try {
                          await submitFeedback(currentReplyId, { rating: "thumbs_up" });
                          setFeedbackRating("thumbs_up");
                          setFeedbackSubmitted(true);
                          setShowReasonInput(false);
                        } catch (err: any) {
                          console.error("Failed to submit feedback:", err);
                          alert(err?.response?.data?.error ?? "Failed to submit feedback");
                        } finally {
                          setFeedbackLoading(false);
                        }
                      }}
                      disabled={feedbackLoading}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "10px 16px",
                        borderRadius: "var(--radius-md)",
                        border: `2px solid ${feedbackRating === "thumbs_up" ? "var(--success)" : "var(--border)"}`,
                        background: feedbackRating === "thumbs_up" ? "rgba(16, 185, 129, 0.15)" : "transparent",
                        cursor: feedbackLoading ? "not-allowed" : "pointer",
                        opacity: feedbackLoading ? 0.6 : 1,
                        fontSize: "13px",
                        fontWeight: 600,
                        color: feedbackRating === "thumbs_up" ? "var(--success)" : "var(--text)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      Helpful
                    </button>
                    <button
                      onClick={() => {
                        setFeedbackRating("thumbs_down");
                        setShowReasonInput(true);
                      }}
                      disabled={feedbackLoading || showReasonInput}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "10px 16px",
                        borderRadius: "var(--radius-md)",
                        border: `2px solid ${feedbackRating === "thumbs_down" ? "var(--error)" : "var(--border)"}`,
                        background: feedbackRating === "thumbs_down" ? "rgba(239, 68, 68, 0.15)" : "transparent",
                        cursor: feedbackLoading ? "not-allowed" : "pointer",
                        opacity: feedbackLoading ? 0.6 : 1,
                        fontSize: "13px",
                        fontWeight: 600,
                        color: feedbackRating === "thumbs_down" ? "var(--error)" : "var(--text)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      Not helpful
                    </button>
                    {feedbackSubmitted && feedbackRating === "thumbs_up" && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--success)",
                          fontWeight: 600,
                          padding: "4px 8px",
                          background: "rgba(16, 185, 129, 0.15)",
                          borderRadius: "var(--radius-sm)",
                          alignSelf: "center",
                        }}
                      >
                        Thank you!
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Reason Input (Why not?) */}
              {showReasonInput && feedbackRating === "thumbs_down" && currentReplyId && (
                <div style={{ marginTop: "var(--spacing-md)", paddingTop: "var(--spacing-md)", borderTop: "1px solid var(--border)" }}>
                  <textarea
                    value={feedbackReason}
                    onChange={(e) => setFeedbackReason(e.target.value)}
                    placeholder="Why not? (Optional - helps us improve)"
                    style={{
                      width: "100%",
                      minHeight: "80px",
                      padding: "var(--spacing-md)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      fontSize: "13px",
                      fontFamily: "inherit",
                      resize: "vertical",
                      marginBottom: "var(--spacing-sm)",
                    }}
                  />
                  <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
                    <button
                      onClick={async () => {
                        setFeedbackLoading(true);
                        try {
                          await submitFeedback(currentReplyId, {
                            rating: "thumbs_down",
                            reason: feedbackReason || undefined,
                          });
                          setFeedbackSubmitted(true);
                          setShowReasonInput(false);
                        } catch (err: any) {
                          console.error("Failed to submit feedback:", err);
                          alert(err?.response?.data?.error ?? "Failed to submit feedback");
                        } finally {
                          setFeedbackLoading(false);
                        }
                      }}
                      disabled={feedbackLoading}
                      style={{
                        padding: "8px 16px",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      {feedbackLoading ? "Submitting..." : "Submit Feedback"}
                    </button>
                    <button
                      className="secondary"
                      onClick={() => {
                        setShowReasonInput(false);
                        setFeedbackRating(null);
                        setFeedbackReason("");
                      }}
                      style={{
                        padding: "8px 16px",
                        fontSize: "13px",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: History Panel */}
        <div className="card history-panel" style={{ width: "100%", minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "clamp(12px, 3vw, 16px)",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "clamp(16px, 4vw, 20px)" }}>
              History{" "}
              <span
                style={{
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                  fontSize: "clamp(12px, 3vw, 14px)",
                }}
              >
                ({history.length})
              </span>
            </h3>
          </div>

          {/* Search & Filters */}
          <div
            style={{
              display: "grid",
              gap: "var(--spacing-md)",
              marginBottom: "var(--spacing-md)",
            }}
          >
            <input
              value={historyQuery}
              onChange={(e) => setHistoryQuery(e.target.value)}
              placeholder="Search in history..."
              style={{
                padding: "clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)",
                fontSize: "clamp(14px, 3.5vw, 16px)",
                width: "100%",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadHistory();
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "var(--spacing-sm)",
                flexWrap: "wrap",
              }}
            >
              <select
                value={historyTone}
                onChange={(e) => setHistoryTone(e.target.value as any)}
                style={{
                  flex: 1,
                  minWidth: "100px",
                  padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)",
                  fontSize: "clamp(12px, 3vw, 13px)",
                }}
              >
                <option value="">All tones</option>
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
                <option value="short">Short</option>
              </select>

              <button
                onClick={() => loadHistory()}
                className="secondary"
                style={{
                  padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)",
                  fontSize: "clamp(12px, 3vw, 13px)",
                  whiteSpace: "nowrap",
                }}
              >
                Search
              </button>

              <button
                onClick={() => {
                  setHistoryQuery("");
                  setHistoryTone("");
                  setTimeout(() => loadHistory(), 0);
                }}
                className="secondary"
                style={{
                  padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)",
                  fontSize: "clamp(12px, 3vw, 13px)",
                  whiteSpace: "nowrap",
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* History List */}
          <div className="history-scroll">
            {history.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "var(--spacing-xl)",
                  color: "var(--text-secondary)",
                }}
              >
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>No replies yet.</p>
                <p style={{ margin: "var(--spacing-sm) 0 0 0", fontSize: "12px" }}>
                  Generate your first reply to see it here.
                </p>
              </div>
            ) : (
              history.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onOpen={(it) => setSelectedHistory(it)}
                  onCopy={(it) => navigator.clipboard.writeText(it.result)}
                  onUse={(it) => applyFromHistory(it)}
                  templateLabel={
                    item.templateId ? templateLabelById.get(item.templateId) : undefined
                  }
                  brandLabel={
                    item.brandVoiceId ? brandLabelById.get(item.brandVoiceId) : undefined
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>

      {selectedHistory && (
        <HistoryModal
          item={selectedHistory}
          onClose={() => setSelectedHistory(null)}
          onUse={applyFromHistory}
          onRegenerate={regenerateFromHistory}
        />
      )}
    </div>
  );
}