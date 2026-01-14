type Props = {
  item: any;
  onOpen: (item: any) => void;
  onCopy?: (item: any) => void;
  onUse?: (item: any) => void;
  templateLabel?: string;
  brandLabel?: string;
};

export default function HistoryItem({
  item,
  onOpen,
  onCopy,
  onUse,
  templateLabel,
  brandLabel,
}: Props) {
  const preview =
    item?.result?.length > 140 ? item.result.slice(0, 140) + "…" : item?.result ?? "";

  return (
    <div
      className="history-card"
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(item);
        }
      }}
    >
      {/* Row 1: Tone + Date + Actions */}
      <div className="history-row1">
        <span className={`tone-badge tone-${item.tone}`}>
          {String(item.tone).toUpperCase()}
        </span>

        <span className="history-date">
          {new Date(item.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        <div className="history-actions">
          <button
            className="history-action-btn"
            title="Copy reply"
            onClick={(e) => {
              e.stopPropagation();
              if (onCopy) onCopy(item);
              else navigator.clipboard.writeText(item.result ?? "");
            }}
          >
            Copy
          </button>

          <button
            className="history-action-btn"
            title="Use in generator"
            onClick={(e) => {
              e.stopPropagation();
              onUse?.(item);
            }}
          >
            Use
          </button>
        </div>
      </div>

      {/* Row 2: Meta Pills */}
      {(brandLabel || templateLabel) && (
        <div className="history-meta">
          {brandLabel && (
            <span className="meta-pill" title={`Brand Voice: ${brandLabel}`}>
              {brandLabel}
            </span>
          )}
          {templateLabel && (
            <span className="meta-pill" title={`Template: ${templateLabel}`}>
              {templateLabel}
            </span>
          )}
        </div>
      )}

      {/* Preview Text */}
      <p className="history-preview">{preview}</p>
    </div>
  );
}