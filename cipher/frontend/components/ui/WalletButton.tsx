"use client";
import { useWallet } from "@/lib/wallet/WalletContext";

export function WalletButton() {
  const { address, connecting, error, connect, disconnect } = useWallet();

  const short = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button
        onClick={address ? disconnect : connect}
        disabled={connecting}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
          padding: "8px 16px",
          borderRadius: 6,
          border: `1px solid ${address ? "var(--confirmed)" : "var(--border)"}`,
          background: address ? "rgba(0,255,179,0.08)" : "var(--raised)",
          color: address ? "var(--confirmed)" : "var(--sub)",
          cursor: connecting ? "wait" : "pointer",
          transition: "all 200ms ease",
        }}
        aria-label={address ? `Connected: ${address}` : "Connect wallet"}
      >
        {connecting ? "Connecting…" : short ?? "Connect Wallet"}
      </button>
      {error && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--contradicted)",
          }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
