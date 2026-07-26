"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CipherContractClient, Subject } from "@/lib/genlayer/contract";
import { CircuitCanvas } from "@/components/circuit/CircuitCanvas";
import { useWallet } from "@/lib/wallet/WalletContext";
import { Lattice } from "@/lib/circuit/lattice";
import { NodeOutcome } from "@/lib/genlayer/status";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const PLAYER_COLORS = ["var(--p1)", "var(--p2)", "var(--p3)", "var(--p4)", "var(--p5)", "var(--p6)"];

interface NodeResolution {
  outcome: NodeOutcome;
  evidence_summary?: string;
  rationale?: string;
}

interface ResolutionReport {
  node_resolutions?: Record<string, NodeResolution>;
  player_scores?: Record<string, number>;
}

interface LatticeRead {
  revealed?: boolean;
  lattice?: Lattice;
}

export default function CertificatePage() {
  const { id } = useParams<{ id: string }>();
  const { address } = useWallet();
  const certRef = useRef<HTMLDivElement>(null);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [report, setReport] = useState<ResolutionReport | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [myLattice, setMyLattice] = useState<Lattice | null>(null);
  const [payouts, setPayouts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!CONTRACT_ADDRESS) return;
    const client = new CipherContractClient(CONTRACT_ADDRESS, address ?? undefined);
    Promise.all([
      client.getSubject(id),
      client.getResolutionReport(id),
      client.getPlayerList(id),
      client.getPayoutDistribution(id),
    ]).then(async ([sub, rep, pl, po]) => {
      setSubject(sub);
      setReport(rep);
      setPlayers(pl);
      setPayouts(po);
      if (address) {
        const [, lattice] = await Promise.all([
          client.getPlayerInfo(id, address).catch(() => null),
          client.getLattice(id, address).catch(() => null) as Promise<LatticeRead | null>,
        ]);
        if (lattice?.revealed && lattice.lattice) setMyLattice(lattice.lattice);
      }
    }).catch(console.error);
  }, [id, address]);

  const nodeResolutions = report?.node_resolutions ?? {};
  const playerScores = report?.player_scores ?? {};

  return (
    <div style={{ padding: "40px 32px", maxWidth: 900 }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginBottom: 20 }}>
        <Link href={`/subjects/${id}`} style={{ color: "var(--sub)" }}>#{id}</Link>
        {" → "}Score Certificate
      </p>

      {/* Certificate card */}
      <div
        ref={certRef}
        style={{
          padding: 32,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circuit trace */}
        <svg style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", opacity: 0.04, pointerEvents: "none" }} aria-hidden="true">
          <pattern id="cert-grid" width={48} height={48} patternUnits="userSpaceOnUse">
            <circle cx={0} cy={0} r={1} fill="var(--confirmed)" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#cert-grid)" />
        </svg>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--confirmed)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>
              CIPHER · Circuit Resolution Certificate
            </p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700 }}>
              {subject?.title ?? `Subject #${id}`}
            </h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", marginBottom: 4 }}>Subject</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--confirmed)" }}>#{id}</p>
          </div>
        </div>

        {/* Lattice */}
        {myLattice && (
          <div style={{ marginBottom: 24 }}>
            <CircuitCanvas lattice={myLattice} resolutions={nodeResolutions} readonly width={800} height={360} />
          </div>
        )}

        {/* Scores */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            Final Scores & Payouts
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {players.map((p, i) => {
              const score = playerScores[p];
              const payout = payouts[p];
              const isMe = p.toLowerCase() === address?.toLowerCase();
              return (
                <div
                  key={p}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "24px 1fr 80px 120px",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 16px",
                    background: isMe ? "rgba(0,255,179,0.04)" : "var(--raised)",
                    border: `1px solid ${isMe ? "var(--confirmed)" : "var(--border)"}`,
                    borderRadius: 6,
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: PLAYER_COLORS[i % 6] }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: isMe ? "var(--text)" : "var(--sub)" }}>
                    {p.slice(0, 8)}…{p.slice(-4)}
                    {isMe && " (you)"}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text)", textAlign: "right" }}>
                    {score !== undefined ? Math.round(score) : "—"}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--confirmed)", textAlign: "right" }}>
                    {payout ? `${(Number(payout) / 1e18).toFixed(4)} GEN` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)" }}>
            GenLayer StudioNet · Settled via Optimistic Democracy consensus
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)" }}>
            {new Date().toISOString().slice(0, 10)}
          </p>
        </div>
      </div>

      <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginTop: 16 }}>
        Use browser print (Ctrl+P) to save this certificate as PDF.
      </p>
    </div>
  );
}
