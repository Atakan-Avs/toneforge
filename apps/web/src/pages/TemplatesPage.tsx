import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import {
  type TemplateDto,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../features/templates/templates.api";

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

export default function TemplatesPage() {
  const { orgId } = useWorkspace();

  const [items, setItems] = useState<TemplateDto[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ guarantee strings (never undefined)
  const [category, setCategory] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [q, setQ] = useState<string>("");

  // ✅ workspace-specific localStorage key
  const safeOrgId = orgId ?? "no-org";
  const BV_KEY = `brandVoiceId:${safeOrgId}`; // (kept; used elsewhere in your app)
  const TPL_KEY = `templateId:${safeOrgId}`;

  const canSubmit = useMemo(() => {
    return (category ?? "").trim().length > 0 && (content ?? "").trim().length > 0;
  }, [category, content]);

  async function refresh() {
    setLoading(true);
    try {
      const list = await listTemplates();
      setItems(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const s = (q ?? "").trim().toLowerCase();
    if (!s) return items;

    return items.filter((t: any) => {
      const cat = String(t?.category ?? "");
      const cont = String(t?.content ?? "");
      return `${cat} ${cont}`.toLowerCase().includes(s);
    });
  }, [items, q]);

  const onSubmit = async () => {
    const safeCategory = (category ?? "").trim();
    const safeContent = (content ?? "").trim();
    if (!safeCategory || !safeContent) return;

    try {
      if (editingId) {
        const updated = await updateTemplate(editingId, {
          category: safeCategory,
          content: safeContent,
        });
        setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        setEditingId(null);
      } else {
        const created = await createTemplate({
          category: safeCategory,
          content: safeContent,
        });
        setItems((prev) => [created, ...prev]);
      }

      setCategory("");
      setContent("");
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error || err?.message || "Failed to save template. Please try again.";
      alert(errorMsg);
      console.error("Template save error:", err);
    }
  };

  const onEdit = (t: TemplateDto) => {
    setEditingId(t.id);
    setCategory((t as any)?.category ?? "");
    setContent((t as any)?.content ?? "");
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;

    await deleteTemplate(id);
    setItems((prev) => prev.filter((x) => x.id !== id));

    if (editingId === id) {
      setEditingId(null);
      setCategory("");
      setContent("");
    }
  };

  const onUse = (t: TemplateDto) => {
    // ✅ set selected template for this workspace
    localStorage.setItem(TPL_KEY, t.id);

    // UX: generator’a git (sende generator / path'i farklıysa değiştir)
    window.location.href = "/app";
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "clamp(8px, 2vw, 12px)",
          marginBottom: "clamp(16px, 4vw, 24px)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(18px, 4.5vw, 28px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Templates
          </h2>
          <p
            style={{
              margin: "clamp(4px, 1vw, 8px) 0 0 0",
              color: "var(--text-secondary)",
              fontSize: "clamp(12px, 3vw, 14px)",
            }}
          >
            Create and manage reusable reply templates
          </p>
        </div>
        <button
          className="secondary"
          onClick={refresh}
          disabled={loading}
          style={{
            padding: "clamp(8px, 2vw, 10px) clamp(16px, 4vw, 20px)",
            fontSize: "clamp(12px, 3vw, 14px)",
            display: "flex",
            alignItems: "center",
            gap: "clamp(6px, 1.5vw, 8px)",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {loading ? (
            <>
              <div className="spinner" style={{ width: "14px", height: "14px" }} />
              Loading...
            </>
          ) : (
            "Refresh"
          )}
        </button>
      </div>

      {/* Create / Edit Form */}
      <div className="card" style={{ marginBottom: "clamp(16px, 4vw, 24px)", width: "100%" }}>
        <h3 style={{ marginBottom: "clamp(12px, 3vw, 16px)", fontSize: "clamp(15px, 3.5vw, 18px)" }}>
          {editingId ? "Edit Template" : "Create New Template"}
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
              Category
            </label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value ?? "")}
              placeholder="e.g. Refund request, Shipping inquiry, Product question..."
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
              Template Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value ?? "")}
              placeholder="Enter your template content here..."
              rows={8}
              style={{
                padding: "clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)",
                fontSize: "clamp(14px, 3.5vw, 16px)",
                fontFamily: "var(--font-sans)",
                width: "100%",
              }}
            />
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
              {editingId ? "Update Template" : "Create Template"}
            </button>

            {editingId && (
              <button
                className="secondary"
                onClick={() => {
                  setEditingId(null);
                  setCategory("");
                  setContent("");
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

      {/* Search */}
      <div style={{ marginBottom: "clamp(12px, 3vw, 16px)" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value ?? "")}
          placeholder="Search templates..."
          style={{
            width: "100%",
            padding: "clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)",
            fontSize: "clamp(14px, 3.5vw, 16px)",
          }}
        />
      </div>

      {/* Templates List */}
      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "var(--spacing-2xl)", color: "var(--text-secondary)" }}>
            <div className="spinner" style={{ width: "24px", height: "24px", margin: "0 auto" }} />
            <p style={{ marginTop: "var(--spacing-md)", fontSize: "14px" }}>Loading templates...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "var(--spacing-2xl)" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
              {q ? "No templates found matching your search." : "No templates yet."}
            </p>
            {!q && (
              <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "var(--spacing-sm)" }}>
                Create your first template above to get started.
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gap: "var(--spacing-md)" }}>
            {filtered.map((t: any) => {
              const updatedLabel = safeDateLabel(t?.updatedAt, "Updated");
              const createdLabel = safeDateLabel(t?.createdAt, "Created");
              const metaLabel = updatedLabel ?? createdLabel;

              return (
                <div key={t.id} className="card" style={{ transition: "all 0.2s ease" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "var(--spacing-md)",
                      marginBottom: "var(--spacing-md)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "16px",
                          marginBottom: "4px",
                          color: "var(--text)",
                          wordBreak: "break-word",
                        }}
                      >
                        {String(t?.category ?? "-")}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                        {metaLabel ?? "-"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "var(--spacing-sm)", flexWrap: "wrap" }}>
                      <button
                        onClick={() => onUse(t)}
                        className="secondary"
                        style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600 }}
                      >
                        Use
                      </button>
                      <button
                        onClick={() => onEdit(t)}
                        className="secondary"
                        style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(t.id)}
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

                  <div
                    style={{
                      padding: "var(--spacing-md)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      fontSize: "14px",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {String(t?.content ?? "")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
