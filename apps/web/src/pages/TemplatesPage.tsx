import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import {
  type TemplateDto,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../features/templates/templates.api";

export default function TemplatesPage() {
  const { orgId } = useWorkspace();
  
  const [items, setItems] = useState<TemplateDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [q, setQ] = useState("");

  // ✅ workspace-specific localStorage key
  const safeOrgId = orgId ?? "no-org";
  const BV_KEY = `brandVoiceId:${safeOrgId}`;
  const TPL_KEY = `templateId:${safeOrgId}`;


  async function refresh() {
    setLoading(true);
    try {
      const list = await listTemplates();
      setItems(list ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((t) =>
      `${t.category} ${t.content}`.toLowerCase().includes(s)
    );
  }, [items, q]);

  const onSubmit = async () => {
    if (!category.trim() || !content.trim()) return;

    if (editingId) {
      const updated = await updateTemplate(editingId, {
        category: category.trim(),
        content: content.trim(),
      });
      setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setEditingId(null);
    } else {
      const created = await createTemplate({
        category: category.trim(),
        content: content.trim(),
      });
      setItems((prev) => [created, ...prev]);
    }

    setCategory("");
    setContent("");
  };

  const onEdit = (t: TemplateDto) => {
    setEditingId(t.id);
    setCategory(t.category);
    setContent(t.content);
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
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--spacing-md)",
          marginBottom: "var(--spacing-xl)",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Templates
          </h2>
          <p style={{ margin: "var(--spacing-xs) 0 0 0", color: "var(--text-secondary)", fontSize: "14px" }}>
            Create and manage reusable reply templates
          </p>
        </div>
        <button
          className="secondary"
          onClick={refresh}
          disabled={loading}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
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
      <div
        className="card"
        style={{
          marginBottom: "var(--spacing-xl)",
        }}
      >
        <h3 style={{ marginBottom: "var(--spacing-lg)", fontSize: "18px" }}>
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
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Refund request, Shipping inquiry, Product question..."
              style={{ padding: "12px 16px", fontSize: "14px" }}
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
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your template content here..."
              rows={8}
              style={{
                padding: "12px 16px",
                fontSize: "14px",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "var(--spacing-md)", flexWrap: "wrap" }}>
            <button
              onClick={onSubmit}
              disabled={!category.trim() || !content.trim()}
              style={{
                padding: "12px 24px",
                fontSize: "14px",
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
                  padding: "12px 24px",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "var(--spacing-lg)" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Search templates..."
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: "14px",
          }}
        />
      </div>

      {/* Templates List */}
      <div>
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "var(--spacing-2xl)",
              color: "var(--text-secondary)",
            }}
          >
            <div className="spinner" style={{ width: "24px", height: "24px", margin: "0 auto" }} />
            <p style={{ marginTop: "var(--spacing-md)", fontSize: "14px" }}>Loading templates...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: "center",
              padding: "var(--spacing-2xl)",
            }}
          >
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
            {filtered.map((t) => (
              <div
                key={t.id}
                className="card"
                style={{
                  transition: "all 0.2s ease",
                }}
              >
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
                        fontSize: "16px",
                        marginBottom: "4px",
                        color: "var(--text)",
                      }}
                    >
                      {t.category}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        fontWeight: 500,
                      }}
                    >
                      Created {new Date(t.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "var(--spacing-sm)",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => onUse(t)}
                      className="secondary"
                      style={{
                        padding: "8px 16px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      Use
                    </button>
                    <button
                      onClick={() => onEdit(t)}
                      className="secondary"
                      style={{
                        padding: "8px 16px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
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
                  {t.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}