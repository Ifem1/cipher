"use client";
import { TxPhase, TX_PHASE_LABEL } from "@/lib/genlayer/status";

interface Props {
  phase: TxPhase;
  error?: string;
}

export function TxSpinner({ phase, error }: Props) {
  if (phase === "idle") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: "var(--raised)",
        border: "1px solid var(--border)",
        borderRadius: 8,
      }}
    >
      {phase === "failed" ? (
        <span style={{ color: "var(--contradicted)", fontSize: 16 }}>✗</span>
      ) : phase === "accepted" ? (
        <span style={{ color: "var(--confirmed)", fontSize: 16 }}>✓</span>
      ) : (
        <span
          className="signal-loader"
          style={{
            display: "block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--confirmed)",
          }}
          aria-hidden="true"
        />
      )}
      <div>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color:
              phase === "failed"
                ? "var(--contradicted)"
                : phase === "accepted"
                ? "var(--confirmed)"
                : "var(--text)",
            margin: 0,
          }}
        >
          {TX_PHASE_LABEL[phase]}
        </p>
        {error && (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--contradicted)",
              margin: "4px 0 0",
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
