"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CipherContractClient, Subject } from "@/lib/genlayer/contract";
import { StatusChip } from "@/components/ui/StatusChip";
import { useWallet } from "@/lib/wallet/WalletContext";
import { errorMessage } from "@/lib/errors";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

export default function Observatory() {
  const { address } = useWallet();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(Boolean(CONTRACT_ADDRESS));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!CONTRACT_ADDRESS) return;
    const client = new CipherContractClient(CONTRACT_ADDRESS);
    client
      .getAllSubjects()
      .then(setSubjects)
      .catch((e: unknown) => setError(errorMessage(e, "Failed to load subjects")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "40px 32px", maxWidth: 1100 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 48,
          paddingBottom: 24,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--confirmed)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Observatory
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 36,
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: 1.1,
            }}
          >
            Active Circuits
          </h1>
        </div>
        {address && (
          <Link
            href="/subjects/new"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.08em",
              padding: "10px 20px",
              borderRadius: 6,
              border: "1px solid var(--confirmed)",
              background: "rgba(0,255,179,0.08)",
              color: "var(--confirmed)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ⊕ New Circuit
          </Link>
        )}
      </div>

      {!CONTRACT_ADDRESS && (
        <div
          style={{
            padding: "16px 20px",
            background: "var(--raised)",
            border: "1px solid var(--partial)",
            borderRadius: 8,
            marginBottom: 32,
          }}
        >
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--partial)" }}>
            ⚠ Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local after deploying the contract.
          </p>
        </div>
      )}

      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 160,
                background: "var(--raised)",
                border: "1px solid var(--border)",
                borderRadius: 10,
              }}
            />
          ))}
        </div>
      )}

      {error && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--contradicted)" }}>
          {error}
        </p>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--muted)", marginBottom: 16 }}>
            No active circuits
          </p>
          {address && (
            <Link href="/subjects/new" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--confirmed)" }}>
              Initialise the first circuit →
            </Link>
          )}
        </div>
      )}

      {!loading && subjects.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {subjects.map((sub) => (
            <SubjectCard key={sub.id} subject={sub} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubjectCard({ subject }: { subject: Subject }) {
  const stakeGEN = (Number(subject.stake_per_player) / 1e18).toFixed(4);
  const potGEN = (Number(subject.gross_pot) / 1e18).toFixed(4);
  return (
    <Link
      href={`/subjects/${subject.id}`}
      style={{
        display: "block",
        padding: 20,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        transition: "border-color 200ms ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>
            #{subject.id} · {subject.entity}
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>
            {subject.title}
          </h2>
        </div>
        <StatusChip status={subject.status} small />
      </div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--sub)", lineHeight: 1.5, marginBottom: 16, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
        {subject.description}
      </p>
      <div style={{ display: "flex", gap: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
        <Stat label="Players" value={`${subject.player_count}/${subject.max_players}`} />
        <Stat label="Stake" value={`${stakeGEN} GEN`} />
        <Stat label="Pot" value={`${potGEN} GEN`} />
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</p>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }}>{value}</p>
    </div>
  );
}
