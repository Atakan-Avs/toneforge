

type Props = {
  used: number;
  limit: number;
  period: string;
};

export default function UsageBar({ used, limit, period }: Props) {
  const safeLimit = Math.max(1, limit);
  const pct = Math.min(100, Math.round((used / safeLimit) * 100));
  const remaining = Math.max(0, safeLimit - used);
  const isWarning = pct >= 80;
  const isDanger = pct >= 95;

  const getBarColor = () => {
    if (isDanger) return "var(--error)";
    if (isWarning) return "var(--warning)";
    return "var(--primary)";
  };

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "var(--spacing-lg)",
        background: "var(--card)",
        boxShadow: "var(--shadow-md)",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--spacing-md)",
          marginBottom: "var(--spacing-md)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "4px",
            }}
          >
            Monthly Usage
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            Period: {period}
          </div>
        </div>

        <div
          style={{
            fontSize: "13px",
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            border: `1px solid ${isDanger ? "var(--error)" : isWarning ? "var(--warning)" : "var(--border)"}`,
            background: isDanger
              ? "rgba(239, 68, 68, 0.15)"
              : isWarning
              ? "rgba(245, 158, 11, 0.15)"
              : "var(--input-bg)",
            color: isDanger ? "var(--error)" : isWarning ? "var(--warning)" : "var(--text)",
            whiteSpace: "nowrap",
            fontWeight: 700,
          }}
        >
          {used}/{safeLimit} ({pct}%)
        </div>
      </div>

      <div
        style={{
          height: "12px",
          borderRadius: "var(--radius-full)",
          background: "var(--input-bg)",
          overflow: "hidden",
          position: "relative",
          marginBottom: "var(--spacing-md)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: "var(--radius-full)",
            background: `linear-gradient(90deg, ${getBarColor()}, ${getBarColor()}dd)`,
            transition: "width 0.3s ease, background 0.3s ease",
            boxShadow: `0 0 10px ${getBarColor()}40`,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "var(--text-secondary)",
          fontWeight: 500,
        }}
      >
        <span>
          {remaining} {remaining === 1 ? "reply" : "replies"} remaining
        </span>
        <span>Resets monthly (UTC)</span>
      </div>
    </div>
  );
}
