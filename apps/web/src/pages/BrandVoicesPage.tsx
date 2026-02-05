import { useEffect, useMemo, useState } from "react";
import {
  type BrandVoiceDto,
  createBrandVoice,
  deleteBrandVoice,
  listBrandVoices,
  updateBrandVoice,
} from "../features/brandVoices/brandVoices.api";

function safeDateLabel(value: unknown, prefix: string) {
  if (!value) return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return `${prefix} ${d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export default function BrandVoicesPage() {
  const [items, setItems] = useState<BrandVoiceDto[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ guarantee strings (never undefined)
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const canSubmit = useMemo(() => (name ?? "").trim().length > 0, [name]);

  async function refresh() {
    setLoading(true);
    try {
      const list = await listBrandVoices();
      setItems(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const onSubmit = async () => {
    const safeName = (name ?? "").trim();
    const safeDesc = (description ?? "").trim();

    if (!safeName) return;

    try {
      if (editingId) {
        const updated = await updateBrandVoice(editingId, {
          name: safeName,
          description: safeDesc,
        });
        setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        setEditingId(null);
      } else {
        const created = await createBrandVoice({ name: safeName, description: safeDesc });
        setItems((prev) => [created, ...prev]);
      }

      // ✅ reset
      setName("");
      setDescription("");
    } catch (e) {
      console.error(e);
    }
  };

  const onEdit = (bv: BrandVoiceDto) => {
    setEditingId(bv.id);
    // ✅ safe fill
    setName((bv as any)?.name ?? "");
    setDescription((bv as any)?.description ?? "");
  };

  const onDelete = async (id: string) => {
    await deleteBrandVoice(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setName("");
      setDescription("");
    }
  };

  return (
    <div
      style={{
        maxWidth: "1000px",
        width: "100%",
        margin: "0 auto",
        overflowX: "hidden",
        boxSizing: "border-box",
        padding: "0 clamp(8px, 2vw, 12px)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "clamp(16px, 4vw, 24px)" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(18px, 4.5vw, 28px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: "clamp(4px, 1vw, 8px)",
          }}
        >
          Brand Voices
        </h2>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "clamp(12px, 3vw, 14px)" }}>
          Define your brand's voice and tone guidelines for consistent replies
        </p>
      </div>

      {/* Create / Edit Form */}
      <div className="card" style={{ marginBottom: "clamp(16px, 4vw, 24px)", width: "100%" }}>
        <h3 style={{ marginBottom: "clamp(12px, 3vw, 16px)", fontSize: "clamp(15px, 3.5vw, 18px)" }}>
          {editingId ? "Edit Brand Voice" : "Create New Brand Voice"}
        </h3>

        <div style={{ display: "grid", gap: "var(--spacing-md)" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "6px",
                color: "var(--text-secondary)",
              }}
            >
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value ?? "")}
              placeholder="e.g. Calm & Professional, Friendly & Helpful..."
              style={{
                padding: "clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)",
                fontSize: "clamp(14px, 3.5vw, 16px)",
                width: "100%",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "6px",
                color: "var(--text-secondary)",
              }}
            >
              Guidelines
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value ?? "")}
              placeholder="Describe your brand voice: tone rules, do's and don'ts, example phrases, etc."
              rows={8}
              style={{
                padding: "clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)",
                fontSize: "clamp(14px, 3.5vw, 16px)",
                fontFamily: "var(--font-sans)",
                width: "100%",
              }}
            />
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px", marginBottom: 0 }}>
              These guidelines will be used to generate replies that match your brand voice.
            </p>
          </div>

          <div style={{ display: "flex", gap: "var(--spacing-md)", flexWrap: "wrap" }}>
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              style={{
                padding: "clamp(10px, 2.5vw, 12px) clamp(20px, 5vw, 24px)",
                fontSize: "clamp(13px, 3vw, 14px)",
                fontWeight: 600,
              }}
            >
              {editingId ? "Update Brand Voice" : "Create Brand Voice"}
            </button>

            {editingId && (
              <button
                className="secondary"
                onClick={() => {
                  setEditingId(null);
                  setName("");
                  setDescription("");
                }}
                style={{
                  padding: "clamp(10px, 2.5vw, 12px) clamp(20px, 5vw, 24px)",
                  fontSize: "clamp(13px, 3vw, 14px)",
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Brand Voices List */}
      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "var(--spacing-2xl)", color: "var(--text-secondary)" }}>
            <div className="spinner" style={{ width: "24px", height: "24px", margin: "0 auto" }} />
            <p style={{ marginTop: "var(--spacing-md)", fontSize: "14px" }}>Loading brand voices...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "var(--spacing-2xl)" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>No brand voices yet.</p>
            <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "var(--spacing-sm)" }}>
              Create your first brand voice above to get started.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "var(--spacing-md)" }}>
            {items.map((bv) => {
              const updatedLabel = safeDateLabel((bv as any)?.updatedAt, "Updated");
              const createdLabel = safeDateLabel((bv as any)?.createdAt, "Created");
              const metaLabel = updatedLabel ?? createdLabel; // prefer updated, fallback created

              return (
                <div key={bv.id} className="card" style={{ transition: "all 0.2s ease" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "var(--spacing-md)",
                      marginBottom: "var(--spacing-md)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "18px",
                          marginBottom: "4px",
                          color: "var(--text)",
                        }}
                      >
                        {(bv as any)?.name ?? "-"}
                      </div>

                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                        {metaLabel ?? "-"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
                      <button
                        onClick={() => onEdit(bv)}
                        className="secondary"
                        style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(bv.id)}
                        className="secondary"
                        style={{
                          padding: "8px 16px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--error)",
                          borderColor: "var(--error)",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {(bv as any)?.description ? (
                    <div
                      style={{
                        padding: "var(--spacing-md)",
                        borderRadius: "var(--radius-md)",
                        background: "var(--primary-light)",
                        border: "1px solid var(--border)",
                        fontSize: "14px",
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                        wordWrap: "break-word",
                        color: "var(--text)",
                      }}
                    >
                      {(bv as any).description}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "var(--spacing-md)",
                        color: "var(--text-secondary)",
                        fontStyle: "italic",
                        fontSize: "14px",
                      }}
                    >
                      No description provided
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}