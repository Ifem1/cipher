"use client";
import { useWallet } from "@/lib/wallet/WalletContext";

export function WalletButton() {
  const { address, connecting, error, connect, disconnect } = useWallet();
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button
        onClick={address ? disconnect : connect}
        disabled={connecting}
        aria-label={address ? `Connected: ${address}` : "Connect wallet"}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          padding: "7px 16px",
          border: `1px solid ${address ? "var(--confirmed)" : "var(--border)"}`,
          background: address ? "rgba(0,255,179,0.06)" : "transparent",
          color: address ? "var(--confirmed)" : "var(--sub)",
          cursor: connecting ? "wait" : "pointer",
          transition: "border-color 0.2s, color 0.2s",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
        onMouseEnter={e => { if (!address) { e.currentTarget.style.borderColor = "var(--sub)"; e.currentTarget.style.color = "var(--text)"; }}}
        onMouseLeave={e => { if (!address) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--sub)"; }}}
      >
        {/* Status dot */}
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: address ? "var(--confirmed)" : "var(--muted)",
          animation: connecting ? "signal-pulse 1s ease-in-out infinite" : undefined,
        }}/>
        {connecting ? "Connecting…" : short ?? "Connect Wallet"}
      </button>
      {error && (
        <p role="alert" style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--contradicted)", letterSpacing: "0.05em" }}>
          {error}
        </p>
      )}
    </div>
  );
}
