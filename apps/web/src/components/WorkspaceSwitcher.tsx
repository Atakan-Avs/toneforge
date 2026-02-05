import { useWorkspace } from "../contexts/WorkspaceContext";

export default function WorkspaceSwitcher() {
  const { workspaces, loading, orgId, setOrgId } = useWorkspace();

  if (loading) {
    return (
      <div
        style={{
          padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px)",
          borderRadius: "var(--radius-md)",
          background: "var(--input-bg)",
          fontSize: "clamp(11px, 2.5vw, 13px)",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          gap: "clamp(6px, 1.5vw, 8px)",
          whiteSpace: "nowrap",
        }}
      >
        <div className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px", flexShrink: 0 }} />
        Loading…
      </div>
    );
  }

  if (!workspaces.length) {
    return (
      <div
        style={{
          padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px)",
          borderRadius: "var(--radius-md)",
          background: "var(--input-bg)",
          fontSize: "clamp(11px, 2.5vw, 13px)",
          color: "var(--text-secondary)",
          whiteSpace: "nowrap",
        }}
      >
        No workspaces
      </div>
    );
  }

  return (
    <select
      value={orgId ?? ""}
      onChange={(e) => setOrgId(e.target.value)}
      style={{
        padding: "clamp(4px, 1vw, 6px) clamp(24px, 6vw, 28px) clamp(4px, 1vw, 6px) clamp(10px, 2.5vw, 12px)",
        borderRadius: "var(--radius-md)",
        background: "var(--input-bg)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        fontSize: "clamp(10px, 2.5vw, 13px)",
        fontWeight: 500,
        cursor: "pointer",
        minWidth: "80px",
        maxWidth: "100%",
        width: "auto",
        flexShrink: 1,
      }}
    >
      {workspaces.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name} {w.role === "owner" ? "(Owner)" : ""}
        </option>
      ))}
    </select>
  );
}