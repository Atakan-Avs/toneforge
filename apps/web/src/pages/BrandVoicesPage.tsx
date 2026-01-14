import { useEffect, useState } from "react";
import {
  type BrandVoiceDto,
  createBrandVoice,
  deleteBrandVoice,
  listBrandVoices,
  updateBrandVoice,
} from "../features/brandVoices/brandVoices.api";

export default function BrandVoicesPage() {
  const [items, setItems] = useState<BrandVoiceDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

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
    if (!name.trim()) return;

    if (editingId) {
      const updated = await updateBrandVoice(editingId, { name, description });
      setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setEditingId(null);
    } else {
      const created = await createBrandVoice({ name, description });
      setItems((prev) => [created, ...prev]);
    }

    setName("");
    setDescription("");
  };

  const onEdit = (bv: BrandVoiceDto) => {
    setEditingId(bv.id);
    setName(bv.name);
    setDescription(bv.description ?? "");
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
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: "var(--spacing-xl)",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: "var(--spacing-xs)",
          }}
        >
          Brand Voices
        </h2>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px" }}>
          Define your brand's voice and tone guidelines for consistent replies
        </p>
      </div>

      {/* Create / Edit Form */}
      <div
        className="card"
        style={{
          marginBottom: "var(--spacing-xl)",
        }}
      >
        <h3 style={{ marginBottom: "var(--spacing-lg)", fontSize: "18px" }}>
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
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Calm & Professional, Friendly & Helpful..."
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
              Guidelines
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your brand voice: tone rules, do's and don'ts, example phrases, etc."
              rows={8}
              style={{
                padding: "12px 16px",
                fontSize: "14px",
                fontFamily: "var(--font-sans)",
              }}
            />
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginTop: "4px",
                marginBottom: 0,
              }}
            >
              These guidelines will be used to generate replies that match your brand voice.
            </p>
          </div>

          <div style={{ display: "flex", gap: "var(--spacing-md)", flexWrap: "wrap" }}>
            <button
              onClick={onSubmit}
              disabled={!name.trim()}
              style={{
                padding: "12px 24px",
                fontSize: "14px",
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

      {/* Brand Voices List */}
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
            <p style={{ marginTop: "var(--spacing-md)", fontSize: "14px" }}>Loading brand voices...</p>
          </div>
        ) : items.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: "center",
              padding: "var(--spacing-2xl)",
            }}
          >
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
              No brand voices yet.
            </p>
            <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "var(--spacing-sm)" }}>
              Create your first brand voice above to get started.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "var(--spacing-md)" }}>
            {items.map((bv) => (
              <div
                key={bv.id}
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
                        fontSize: "18px",
                        marginBottom: "4px",
                        color: "var(--text)",
                      }}
                    >
                      {bv.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        fontWeight: 500,
                      }}
                    >
                      Updated {new Date(bv.updatedAt).toLocaleDateString("en-US", {
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
                    }}
                  >
                    <button
                      onClick={() => onEdit(bv)}
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

                {bv.description ? (
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
                    {bv.description}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}