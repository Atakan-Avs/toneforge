import { useWorkspace } from "../contexts/WorkspaceContext";

export default function WorkspaceSwitcher() {
  const { workspaces, loading, orgId, setOrgId } = useWorkspace();

  if (loading) {
    return (
      <div
        style={{
          padding: "8px 16px",
          borderRadius: "var(--radius-md)",
          background: "var(--input-bg)",
          fontSize: "13px",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }} />
        Loading…
      </div>
    );
  }

  if (!workspaces.length) {
    return (
      <div
        style={{
          padding: "8px 16px",
          borderRadius: "var(--radius-md)",
          background: "var(--input-bg)",
          fontSize: "13px",
          color: "var(--text-secondary)",
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
        padding: "8px 32px 8px 16px",
        borderRadius: "var(--radius-md)",
        background: "var(--input-bg)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        minWidth: "180px",
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