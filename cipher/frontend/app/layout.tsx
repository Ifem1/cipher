import type { Metadata } from "next";
import "./globals.css";
import "../styles/tokens.css";
import "../styles/node-system.css";
import { WalletProvider } from "@/lib/wallet/WalletContext";
import { OrbitalNav } from "@/components/nav/OrbitalNav";
import { WalletButton } from "@/components/ui/WalletButton";

export const metadata: Metadata = {
  title: "CIPHER — Compound Prediction Protocol",
  description:
    "Multi-player claim lattice prediction protocol on GenLayer. Build compound prediction graphs and settle via AI consensus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      style={{
        "--font-display": "Syne, Inter, system-ui, sans-serif",
        "--font-body": "'DM Sans', Inter, system-ui, sans-serif",
        "--font-mono": "'Space Mono', 'SFMono-Regular', Consolas, monospace",
      } as React.CSSProperties}
    >
      <body
        style={{
          background: "var(--void)",
          color: "var(--text)",
          fontFamily: "var(--font-body)",
          margin: 0,
          minHeight: "100vh",
        }}
      >
        <WalletProvider>
          {/* Orbital navigation rail */}
          <OrbitalNav />

          {/* Top bar */}
          <header
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              padding: "12px 24px",
              borderBottom: "1px solid var(--border)",
              background: "rgba(3,3,9,0.85)",
              backdropFilter: "blur(12px)",
            }}
          >
            <WalletButton />
          </header>

          {/* Main content — offset for orbital nav and top bar */}
          <main
            style={{
              paddingLeft: 160,
              paddingTop: 64,
              minHeight: "100vh",
            }}
          >
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
