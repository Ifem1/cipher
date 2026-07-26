"use client";

const STATUS_COLOR: Record<string, { color: string; bg: string; border: string }> = {
  OPEN: { color: "var(--confirmed)", bg: "rgba(0,255,179,0.08)", border: "var(--confirmed)" },
  COMMITTED: { color: "var(--partial)", bg: "rgba(255,184,0,0.08)", border: "var(--partial)" },
  REVIEW_PENDING: { color: "var(--partial)", bg: "rgba(255,184,0,0.08)", border: "var(--partial)" },
  OBSERVATION_ACTIVE: { color: "var(--confirmed)", bg: "rgba(0,255,179,0.08)", border: "var(--confirmed)" },
  REVEAL_WINDOW: { color: "var(--partial)", bg: "rgba(255,184,0,0.08)", border: "var(--partial)" },
  RESOLUTION_PENDING: { color: "#00B4FF", bg: "rgba(0,180,255,0.08)", border: "#00B4FF" },
  PROVISIONAL_SCORES: { color: "#B400FF", bg: "rgba(180,0,255,0.08)", border: "#B400FF" },
  APPEAL_WINDOW: { color: "var(--warning)", bg: "rgba(255,140,0,0.08)", border: "var(--warning)" },
  APPEAL_PENDING: { color: "var(--warning)", bg: "rgba(255,140,0,0.08)", border: "var(--warning)" },
  FINALIZED: { color: "var(--confirmed)", bg: "rgba(0,255,179,0.08)", border: "var(--confirmed)" },
  CLAIMABLE: { color: "var(--confirmed)", bg: "rgba(0,255,179,0.15)", border: "var(--confirmed)" },
  CLOSED: { color: "var(--muted)", bg: "transparent", border: "var(--border)" },
  CANCELLED: { color: "var(--contradicted)", bg: "rgba(255,45,85,0.08)", border: "var(--contradicted)" },
  REFUNDED: { color: "var(--contradicted)", bg: "rgba(255,45,85,0.08)", border: "var(--contradicted)" },
  INSUFFICIENT_EVIDENCE: { color: "var(--muted)", bg: "transparent", border: "var(--border)" },
};

interface Props {
  status: string;
  small?: boolean;
}

export function StatusChip({ status, small = false }: Props) {
  const colors = STATUS_COLOR[status] ?? {
    color: "var(--sub)",
    bg: "transparent",
    border: "var(--border)",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: "var(--font-mono)",
        fontSize: small ? 9 : 10,
        letterSpacing: "0.08em",
        padding: small ? "2px 6px" : "3px 8px",
        borderRadius: 4,
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        color: colors.color,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
      aria-label={`Status: ${status.replace(/_/g, " ")}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
