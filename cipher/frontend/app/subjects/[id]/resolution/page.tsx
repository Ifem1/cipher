"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CipherContractClient } from "@/lib/genlayer/contract";
import { CircuitCanvas } from "@/components/circuit/CircuitCanvas";
import { StatusChip } from "@/components/ui/StatusChip";
import { NodeOutcome, OUTCOME_COLOR } from "@/lib/genlayer/status";
import { Lattice } from "@/lib/circuit/lattice";
import { useWallet } from "@/lib/wallet/WalletContext";
import { Subject } from "@/lib/genlayer/contract";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const PLAYER_COLORS = ["var(--p1)", "var(--p2)", "var(--p3)", "var(--p4)", "var(--p5)", "var(--p6)"];

interface NodeResolution {
  outcome: NodeOutcome;
  evidence_summary?: string;
  rationale?: string;
}

interface ResolutionReport {
  available?: boolean;
  node_resolutions?: Record<string, NodeResolution>;
  player_scores?: Record<string, number>;
}

interface LatticeRead {
  revealed?: boolean;
  lattice?: Lattice;
}

export default function ResolutionPage() {
  const { id } = useParams<{ id: string }>();
  const { address } = useWallet();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [report, setReport] = useState<ResolutionReport | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [playerLattices, setPlayerLattices] = useState<Record<string, Lattice>>({});
  const [focusPlayer, setFocusPlayer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!CONTRACT_ADDRESS) return;
    const client = new CipherContractClient(CONTRACT_ADDRESS, address ?? undefined);
    Promise.all([
      client.getSubject(id),
      client.getResolutionReport(id),
      client.getPlayerList(id),
    ]).then(async ([sub, rep, pl]) => {
      setSubject(sub);
      setReport(rep);
      setPlayers(pl);

      const lattices: Record<string, Lattice> = {};
      await Promise.all(
        pl.map(async (p: string) => {
          try {
            const data = await client.getLattice(id, p) as LatticeRead;
            if (data.revealed && data.lattice) lattices[p] = data.lattice;
          } catch {}
        })
      );
      setPlayerLattices(lattices);
    }).finally(() => setLoading(false));
  }, [id, address]);

  if (loading) {
    return <div style={{ padding: "40px 32px" }}><p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>Loading…</p></div>;
  }

  const nodeResolutions = report?.node_resolutions ?? {};
  const playerScores = report?.player_scores ?? {};

  const displayedPlayer = focusPlayer ?? players[0];
  const displayedLattice = displayedPlayer ? playerLattices[displayedPlayer] : null;

  return (
    <div style={{ padding: "40px 32px", maxWidth: 1000 }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginBottom: 20 }}>
        <Link href={`/subjects/${id}`} style={{ color: "var(--sub)" }}>#{id}</Link>
        {" → "}Resolution Theatre
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700 }}>Resolution</h1>
        {subject && <StatusChip status={subject.status} />}
      </div>

      {/* Player focus toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {players.map((p, i) => (
          <button
            key={p}
            onClick={() => setFocusPlayer(p === focusPlayer ? null : p)}
            style={{
              fontFamily: "var(--font-mono)", fontSize: 11,
              padding: "6px 14px", borderRadius: 6,
              border: `1px solid ${p === displayedPlayer ? PLAYER_COLORS[i % 6] : "var(--border)"}`,
              background: p === displayedPlayer ? `${PLAYER_COLORS[i % 6]}18` : "var(--raised)",
              color: p === displayedPlayer ? PLAYER_COLORS[i % 6] : "var(--sub)",
              cursor: "pointer",
            }}
          >
            P{i + 1}: {p.slice(0, 6)}…
            {playerScores[p] !== undefined && ` (${Math.round(playerScores[p])})`}
          </button>
        ))}
      </div>

      {/* Canvas */}
      {displayedLattice && (
        <div style={{ marginBottom: 32 }}>
          <CircuitCanvas
            lattice={displayedLattice}
            resolutions={nodeResolutions}
            readonly
          />
        </div>
      )}

      {/* Node resolution table */}
      {Object.keys(nodeResolutions).length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            Terminal Node Resolutions
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(nodeResolutions).map(([nodeId, res]) => (
              <div key={nodeId} style={{ padding: "12px 16px", background: "var(--raised)", border: "1px solid var(--border)", borderRadius: 8, display: "grid", gridTemplateColumns: "80px 160px 1fr", gap: 16, alignItems: "start" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>{nodeId}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: OUTCOME_COLOR[res.outcome] ?? "var(--sub)" }}>
                  {res.outcome}
                </span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--sub)", lineHeight: 1.4 }}>
                  {res.evidence_summary ?? res.rationale ?? ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score table */}
      {Object.keys(playerScores).length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            Provisional Scores
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(playerScores)
              .sort(([, a], [, b]) => b - a)
              .map(([addr, score]) => (
                <div key={addr} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "var(--raised)", borderRadius: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: PLAYER_COLORS[players.indexOf(addr) % 6] }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--sub)", flex: 1 }}>{addr.slice(0, 6)}…{addr.slice(-4)}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text)", fontWeight: 700 }}>{Math.round(score)}</span>
                  <div style={{ width: 120, height: 4, background: "var(--trace)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, score)}%`, height: "100%", background: PLAYER_COLORS[players.indexOf(addr) % 6], borderRadius: 2 }} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {!report?.available && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>
          Resolution report not yet available.
        </p>
      )}
    </div>
  );
}
