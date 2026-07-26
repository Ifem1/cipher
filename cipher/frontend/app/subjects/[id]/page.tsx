"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CipherContractClient, Subject, PlayerInfo } from "@/lib/genlayer/contract";
import { StatusChip } from "@/components/ui/StatusChip";
import { TxSpinner } from "@/components/ui/TxSpinner";
import { TxPhase } from "@/lib/genlayer/status";
import { useWallet } from "@/lib/wallet/WalletContext";
import { errorMessage } from "@/lib/errors";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const PLAYER_COLORS = ["var(--p1)", "var(--p2)", "var(--p3)", "var(--p4)", "var(--p5)", "var(--p6)"];

export default function SubjectPage() {
  const { id } = useParams<{ id: string }>();
  const { address } = useWallet();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [myInfo, setMyInfo] = useState<PlayerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txPhase, setTxPhase] = useState<TxPhase>("idle");
  const [txError, setTxError] = useState<string | undefined>();

  const load = useCallback(async () => {
    if (!CONTRACT_ADDRESS) return;
    try {
      const client = new CipherContractClient(CONTRACT_ADDRESS, address ?? undefined);
      const [sub, pl] = await Promise.all([
        client.getSubject(id),
        client.getPlayerList(id),
      ]);
      setSubject(sub);
      setPlayers(pl);
      if (address) {
        const info = await client.getPlayerInfo(id, address);
        setMyInfo(info);
      }
    } catch (e: unknown) {
      setError(errorMessage(e, "Failed to load subject"));
    } finally {
      setLoading(false);
    }
  }, [address, id]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function handleJoin() {
    if (!address || !subject) return;
    setTxPhase("sign");
    setTxError(undefined);
    try {
      const client = new CipherContractClient(CONTRACT_ADDRESS, address);
      setTxPhase("transmit");
      await client.joinCircuit(id, subject.stake_per_player);
      setTxPhase("accepted");
      await load();
    } catch (e: unknown) {
      setTxPhase("failed");
      setTxError(errorMessage(e, "Join failed."));
    }
  }

  async function handleWithdraw() {
    if (!address) return;
    setTxPhase("sign");
    setTxError(undefined);
    try {
      const client = new CipherContractClient(CONTRACT_ADDRESS, address);
      setTxPhase("transmit");
      await client.withdraw(id);
      setTxPhase("accepted");
      await load();
    } catch (e: unknown) {
      setTxPhase("failed");
      setTxError(errorMessage(e, "Withdraw failed."));
    }
  }

  async function handleFinalize() {
    if (!address) return;
    setTxPhase("sign");
    setTxError(undefined);
    try {
      const client = new CipherContractClient(CONTRACT_ADDRESS, address);
      setTxPhase("transmit");
      await client.finalizeSubject(id);
      setTxPhase("accepted");
      await load();
    } catch (e: unknown) {
      setTxPhase("failed");
      setTxError(errorMessage(e, "Finalize failed."));
    }
  }

  async function handleRequestResolution() {
    if (!address) return;
    setTxPhase("sign");
    setTxError(undefined);
    try {
      const client = new CipherContractClient(CONTRACT_ADDRESS, address);
      setTxPhase("transmit");
      await client.requestResolution(id);
      setTxPhase("accepted");
      await load();
    } catch (e: unknown) {
      setTxPhase("failed");
      setTxError(errorMessage(e, "Resolution request failed."));
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "40px 32px" }}>
        <div style={{ width: 200, height: 20, background: "var(--raised)", borderRadius: 4, marginBottom: 16 }} />
        <div style={{ width: "100%", height: 120, background: "var(--raised)", borderRadius: 10 }} />
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div style={{ padding: "40px 32px" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--contradicted)" }}>
          {error ?? "Subject not found"}
        </p>
      </div>
    );
  }

  const stakeGEN = (Number(subject.stake_per_player) / 1e18).toFixed(4);
  const potGEN = (Number(subject.gross_pot) / 1e18).toFixed(4);
  const isPlayer = myInfo?.joined ?? false;
  const canJoin = address && !isPlayer && (subject.status === "OPEN" || subject.status === "COMMITTED");
  const canWithdraw = address && isPlayer && !myInfo?.withdrawn &&
    (subject.status === "CLAIMABLE" || subject.status === "REFUNDED") &&
    Number(myInfo?.payout ?? "0") > 0;
  const canFinalize = subject.status === "PROVISIONAL_SCORES" || subject.status === "APPEAL_WINDOW";
  const canRequestResolution = subject.status === "REVEAL_WINDOW" || subject.status === "OBSERVATION_ACTIVE";

  return (
    <div style={{ padding: "40px 32px", maxWidth: 900 }}>
      {/* Breadcrumb */}
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginBottom: 20 }}>
        <Link href="/" style={{ color: "var(--sub)" }}>Observatory</Link>
        {" → "}
        <span style={{ color: "var(--text)" }}>#{id}</span>
      </p>

      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16 }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginBottom: 6 }}>
            {subject.entity}
          </p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>
            {subject.title}
          </h1>
        </div>
        <StatusChip status={subject.status} />
      </div>

      {/* Description */}
      <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--sub)", lineHeight: 1.6, marginBottom: 32 }}>
        {subject.description}
      </p>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          ["Players", `${subject.player_count} / ${subject.max_players}`],
          ["Stake", `${stakeGEN} GEN`],
          ["Pot", `${potGEN} GEN`],
          ["Observation", `${subject.obs_start} → ${subject.obs_end}`],
        ].map(([l, v]) => (
          <div key={l} style={{ padding: "12px 16px", background: "var(--raised)", border: "1px solid var(--border)", borderRadius: 8 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{l}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text)" }}>{v}</p>
          </div>
        ))}
      </div>

      {/* Player roster */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
          Participants
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {players.map((addr, i) => (
            <div key={addr} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--raised)", borderRadius: 6, border: `1px solid ${PLAYER_COLORS[i % 6]}22` }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: PLAYER_COLORS[i % 6] }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: addr.toLowerCase() === address ? "var(--text)" : "var(--sub)" }}>
                {addr.slice(0, 6)}…{addr.slice(-4)}
                {addr.toLowerCase() === address && " (you)"}
              </span>
            </div>
          ))}
          {players.length === 0 && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>No participants yet.</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <TxSpinner phase={txPhase} error={txError} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: txPhase !== "idle" ? 16 : 0 }}>
        {canJoin && (
          <ActionButton onClick={handleJoin} label={`Join — ${stakeGEN} GEN`} primary />
        )}

        {isPlayer && (subject.status === "COMMITTED" || subject.status === "OBSERVATION_ACTIVE") && (
          <Link href={`/subjects/${id}/build`} style={actionBtnStyle(true)}>
            Build Lattice →
          </Link>
        )}

        {canRequestResolution && (
          <ActionButton onClick={handleRequestResolution} label="Request Resolution" />
        )}

        {canFinalize && address && (
          <ActionButton onClick={handleFinalize} label="Finalize & Settle" />
        )}

        {canWithdraw && (
          <ActionButton onClick={handleWithdraw} label={`Withdraw ${(Number(myInfo?.payout ?? "0") / 1e18).toFixed(4)} GEN`} primary />
        )}

        {subject.status === "PROVISIONAL_SCORES" && (
          <Link href={`/subjects/${id}/resolution`} style={actionBtnStyle(false)}>
            View Resolution →
          </Link>
        )}

        {subject.status === "CLAIMABLE" && (
          <Link href={`/subjects/${id}/certificate`} style={actionBtnStyle(false)}>
            Score Certificate →
          </Link>
        )}
      </div>
    </div>
  );
}

function actionBtnStyle(primary: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    padding: "10px 20px",
    borderRadius: 6,
    border: `1px solid ${primary ? "var(--confirmed)" : "var(--border)"}`,
    background: primary ? "rgba(0,255,179,0.08)" : "var(--raised)",
    color: primary ? "var(--confirmed)" : "var(--sub)",
    cursor: "pointer",
  };
}

function ActionButton({ onClick, label, primary = false }: { onClick: () => void; label: string; primary?: boolean }) {
  return (
    <button onClick={onClick} style={actionBtnStyle(primary)}>
      {label}
    </button>
  );
}
