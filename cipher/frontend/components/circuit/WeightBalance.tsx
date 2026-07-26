"use client";

interface Props {
  total: number;
  target?: number;
}

export function WeightBalance({ total, target = 100 }: Props) {
  const pct = Math.min(100, (total / target) * 100);
  const complete = total === target;
  const over = total > target;

  return (
    <div className="weight-balance" aria-live="polite">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--sub)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Weight Balance
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            color: over
              ? "var(--contradicted)"
              : complete
              ? "var(--confirmed)"
              : "var(--partial)",
            fontWeight: 700,
          }}
          aria-label={`Total weight: ${total} of ${target}`}
        >
          {total} / {target}
        </span>
      </div>

      <div className="weight-balance-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="weight-balance-fill"
          data-complete={complete}
          style={{
            width: `${pct}%`,
            background: over
              ? "var(--contradicted)"
              : complete
              ? "var(--confirmed)"
              : "var(--partial)",
          }}
        />
      </div>

      {!complete && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--muted)",
            marginTop: 6,
          }}
          role="alert"
        >
          {over ? `Remove ${total - target} weight` : `Add ${target - total} more weight`}
        </p>
      )}
    </div>
  );
}
