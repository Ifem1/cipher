import type { Metadata } from "next";
import { Syne, DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import "../styles/tokens.css";
import "../styles/node-system.css";
import { WalletProvider } from "@/lib/wallet/WalletContext";
import { OrbitalNav } from "@/components/nav/OrbitalNav";
import { WalletButton } from "@/components/ui/WalletButton";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CIPHER — Build the logic. Watch reality run it.",
  description:
    "Multi-player compound prediction protocol on GenLayer. Construct dependency-linked claim lattices. Reality adjudicates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${spaceMono.variable}`}
      style={{
        "--font-display": "var(--font-syne)",
        "--font-body":    "var(--font-dm-sans)",
        "--font-mono":    "var(--font-space-mono)",
      } as React.CSSProperties}
    >
      <body>
        <WalletProvider>
          <OrbitalNav />

          <header style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 18px 0 20px",
            borderBottom: "1px solid var(--border)",
            background: "rgba(3,3,9,0.9)",
            backdropFilter: "blur(16px)",
          }}>
            {/* CIPHER wordmark */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Circuit node icon */}
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="10" stroke="var(--confirmed)" strokeWidth="1.2"/>
                <circle cx="11" cy="11" r="5" fill="var(--confirmed)" fillOpacity="0.15"/>
                <circle cx="11" cy="11" r="2.5" fill="var(--confirmed)"/>
                <line x1="11" y1="1" x2="11" y2="5" stroke="var(--confirmed)" strokeWidth="1" opacity="0.5"/>
                <line x1="11" y1="17" x2="11" y2="21" stroke="var(--confirmed)" strokeWidth="1" opacity="0.5"/>
                <line x1="1" y1="11" x2="5" y2="11" stroke="var(--confirmed)" strokeWidth="1" opacity="0.5"/>
                <line x1="17" y1="11" x2="21" y2="11" stroke="var(--confirmed)" strokeWidth="1" opacity="0.5"/>
              </svg>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, letterSpacing: "0.3em", color: "var(--text)" }}>
                CIPHER
              </span>
            </div>

            <WalletButton />
          </header>

          <main style={{ paddingLeft: 88, paddingTop: 44, minHeight: "100vh" }}>
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
