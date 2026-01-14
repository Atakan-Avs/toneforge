import { useState, useEffect } from "react";
import { submitFeedback, type FeedbackRating } from "../features/feedback/feedback.api";

export default function HistoryModal({
  item,
  onClose,
  onUse,
  onRegenerate,
}: {
  item: any;
  onClose: () => void;
  onUse: (item: any) => void;
  onRegenerate: (item: any) => void;
}) {
  const [feedbackRating, setFeedbackRating] = useState<FeedbackRating | null>(null);
  const [feedbackReason, setFeedbackReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    // Reset feedback state when item changes
    setFeedbackRating(null);
    setFeedbackReason("");
    setShowReasonInput(false);
    setFeedbackSubmitted(false);
  }, [item?.id]);

  async function handleFeedback(rating: FeedbackRating) {
    if (feedbackSubmitted && feedbackRating === rating) return; // Already submitted this rating

    setFeedbackLoading(true);
    try {
      await submitFeedback(item.id, {
        rating,
        reason: feedbackReason || undefined,
      });
      setFeedbackRating(rating);
      setFeedbackSubmitted(true);
      setShowReasonInput(false);
    } catch (err: any) {
      console.error("Failed to submit feedback:", err);
      alert(err?.response?.data?.error ?? "Failed to submit feedback");
    } finally {
      setFeedbackLoading(false);
    }
  }

  if (!item) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "var(--spacing-lg)",
      }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(900px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div className="modal-header">
          <div>
            <h3>Reply Details</h3>
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span className={`tone-badge tone-${item.tone}`}>
                {String(item.tone).toUpperCase()}
              </span>
              <span>•</span>
              <span>
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="secondary"
            style={{
              padding: "8px 12px",
              fontSize: "12px",
            }}
          >
            ✕ Close
          </button>
        </div>

        <div style={{ display: "grid", gap: "var(--spacing-lg)" }}>
          <div className="modal-section">
            <label>Customer Message</label>
            <div className="bubble customer">{item.customerMessage ?? ""}</div>
          </div>

          <div className="modal-section">
            <label>Generated Reply</label>
            <div className="bubble reply">{item.result ?? ""}</div>

            {/* ✅ Feedback Section */}
            <div
              style={{
                marginTop: "var(--spacing-lg)",
                paddingTop: "var(--spacing-lg)",
                borderTop: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "var(--spacing-sm)",
                }}
              >
                Was this reply helpful?
              </div>
              <div style={{ display: "flex", gap: "var(--spacing-sm)", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => handleFeedback("thumbs_up")}
                  disabled={feedbackLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "var(--radius-md)",
                    border: `2px solid ${feedbackRating === "thumbs_up" ? "var(--success)" : "var(--border)"}`,
                    background: feedbackRating === "thumbs_up" ? "rgba(16, 185, 129, 0.15)" : "transparent",
                    cursor: feedbackLoading ? "not-allowed" : "pointer",
                    opacity: feedbackLoading ? 0.6 : 1,
                    fontSize: "14px",
                    fontWeight: 600,
                    color: feedbackRating === "thumbs_up" ? "var(--success)" : "var(--text)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!feedbackLoading && feedbackRating !== "thumbs_up") {
                      e.currentTarget.style.borderColor = "var(--success)";
                      e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (feedbackRating !== "thumbs_up") {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  Helpful
                </button>
                <button
                  onClick={() => {
                    setFeedbackRating("thumbs_down");
                    setShowReasonInput(true);
                  }}
                  disabled={feedbackLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "var(--radius-md)",
                    border: `2px solid ${feedbackRating === "thumbs_down" ? "var(--error)" : "var(--border)"}`,
                    background: feedbackRating === "thumbs_down" ? "rgba(239, 68, 68, 0.15)" : "transparent",
                    cursor: feedbackLoading ? "not-allowed" : "pointer",
                    opacity: feedbackLoading ? 0.6 : 1,
                    fontSize: "14px",
                    fontWeight: 600,
                    color: feedbackRating === "thumbs_down" ? "var(--error)" : "var(--text)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!feedbackLoading && feedbackRating !== "thumbs_down") {
                      e.currentTarget.style.borderColor = "var(--error)";
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (feedbackRating !== "thumbs_down") {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.background = "transparent";
                    }
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
                    }}
                  >
                    Thank you!
                  </span>
                )}
              </div>

              {/* Reason Input (Why not?) */}
              {showReasonInput && feedbackRating === "thumbs_down" && (
                <div style={{ marginTop: "var(--spacing-md)" }}>
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
                    }}
                  />
                  <div style={{ display: "flex", gap: "var(--spacing-sm)", marginTop: "var(--spacing-sm)" }}>
                    <button
                      onClick={() => handleFeedback("thumbs_down")}
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
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "var(--spacing-md)",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            marginTop: "var(--spacing-xl)",
            paddingTop: "var(--spacing-lg)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            className="secondary"
            onClick={() => {
              navigator.clipboard.writeText(item.result ?? "");
            }}
          >
            Copy Reply
          </button>

          <button
            className="secondary"
            onClick={() => onUse(item)}
          >
            Use in Generator
          </button>

          <button onClick={() => onRegenerate(item)}>
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}