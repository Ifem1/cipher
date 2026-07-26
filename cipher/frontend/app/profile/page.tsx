"use client";
import { useEffect, useState } from "react";
import { CipherContractClient, PlayerInfo, Subject } from "@/lib/genlayer/contract";
import { useWallet } from "@/lib/wallet/WalletContext";
import Link from "next/link";
import { errorMessage } from "@/lib/errors";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

function CipherFingerprint({ address, stats }: { address: string; stats: ProfileStats }) {
  const seed = parseInt(address.slice(2, 10), 16);
  const rng = (n: number) => Math.sin(seed * n * 9301 + 49297) * 0.5 + 0.5;

  const hue1 = Math.floor(rng(1) * 360);
  const hue2 = (hue1 + 137) % 360;
  const hue3 = (hue1 + 222) % 360;

  const nodes = Array.from({ length: 7 }, (_, i) => ({
    cx: 50 + 32 * Math.cos((i / 7) * Math.PI * 2),
    cy: 50 + 32 * Math.sin((i / 7) * Math.PI * 2),
    r: 4 + rng(i + 10) * 8,
    opacity: 0.4 + rng(i + 20) * 0.6,
  }));

  const innerNodes = Array.from({ length: 3 }, (_, i) => ({
    cx: 50 + 14 * Math.cos((i / 3) * Math.PI * 2),
    cy: 50 + 14 * Math.sin((i / 3) * Math.PI * 2),
    r: 3 + rng(i + 30) * 5,
  }));

  return (
    <svg
      viewBox="0 0 100 100"
      width={160}
      height={160}
      style={{ display: "block" }}
      aria-label={`Generative fingerprint for ${address.slice(0, 8)}`}
    >
      <defs>
        <radialGradient id="fp-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`hsl(${hue1},60%,20%)`} stopOpacity={0.5} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="fp-inner" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`hsl(${hue2},80%,55%)`} stopOpacity={0.8} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      <circle cx={50} cy={50} r={48} fill="url(#fp-bg)" />

      {/* Outer ring nodes with edges to centre */}
      {nodes.map((n, i) => (
        <g key={i}>
          <line x1={50} y1={50} x2={n.cx} y2={n.cy} stroke={`hsl(${hue3},60%,50%)`} strokeWidth={0.4} strokeOpacity={0.3} />
          <circle cx={n.cx} cy={n.cy} r={n.r} fill={`hsl(${hue1},70%,55%)`} fillOpacity={n.opacity} />
        </g>
      ))}

      {/* Inner cluster */}
      {innerNodes.map((n, i) => (
        <circle key={i} cx={n.cx} cy={n.cy} r={n.r} fill={`hsl(${hue2},80%,60%)`} fillOpacity={0.7} />
      ))}

      {/* Centre node — grows with score */}
      <circle cx={50} cy={50} r={6 + Math.min(10, stats.avgScore / 12)} fill="url(#fp-inner)" />

      {/* Score arc */}
      {stats.avgScore > 0 && (() => {
        const pct = Math.min(1, stats.avgScore / 100);
        const r = 44;
        const x = 50 + r * Math.cos(-Math.PI / 2);
        const y = 50 + r * Math.sin(-Math.PI / 2);
        const ex = 50 + r * Math.cos(-Math.PI / 2 + pct * Math.PI * 2);
        const ey = 50 + r * Math.sin(-Math.PI / 2 + pct * Math.PI * 2);
        const large = pct > 0.5 ? 1 : 0;
        return (
          <path
            d={`M ${x} ${y} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`}
            fill="none"
            stroke={`hsl(${hue2},90%,60%)`}
            strokeWidth={1.5}
            strokeOpacity={0.7}
            strokeLinecap="round"
          />
        );
      })()}
    </svg>
  );
}

interface ProfileStats {
  totalCircuits: number;
  wins: number;
  avgScore: number;
  totalEarned: number;
}

interface ProfileSubject extends Subject {
  myInfo: PlayerInfo;
}

interface ResolutionReport {
  player_scores?: Record<string, number>;
}

export default function ProfilePage() {
  const { address, connect } = useWallet();
  const [subjects, setSubjects] = useState<ProfileSubject[]>([]);
  const [stats, setStats] = useState<ProfileStats>({ totalCircuits: 0, wins: 0, avgScore: 0, totalEarned: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address || !CONTRACT_ADDRESS) return;
    const client = new CipherContractClient(CONTRACT_ADDRESS, address);

    const loadProfile = async () => {
      setLoading(true);
      const subs = await client.getAllSubjects();
      const participated: ProfileSubject[] = [];
      let wins = 0;
      let scoreSum = 0;
      let scoreCount = 0;
      let earned = 0;

      await Promise.all(
        subs.map(async (sub) => {
          try {
            const info = await client.getPlayerInfo(sub.id, address);
            if (!info.joined) return;

            participated.push({ ...sub, myInfo: info });

            if (sub.status === "CLAIMABLE" || sub.status === "CLOSED") {
              const report = await client.getResolutionReport(sub.id).catch(() => null) as ResolutionReport | null;
              const scores = report?.player_scores as Record<string, number> | undefined;
              if (scores?.[address.toLowerCase()]) {
                const s = scores[address.toLowerCase()];
                scoreSum += s;
                scoreCount++;
                if (s >= 50) wins++;
              }
              if (Number(info.payout ?? "0") > 0) earned += Number(info.payout) / 1e18;
            }
          } catch {}
        })
      );

      setSubjects(participated.sort((a, b) => Number(b.id) - Number(a.id)));
      setStats({
        totalCircuits: participated.length,
        wins,
        avgScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0,
        totalEarned: earned,
      });
    };

    Promise.resolve()
      .then(loadProfile)
      .catch((e: unknown) => console.error(errorMessage(e, "Failed to load profile")))
      .finally(() => setLoading(false));
  }, [address]);

  if (!address) {
    return (
      <div style={{ padding: "80px 32px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--muted)", marginBottom: 24 }}>
          Connect your wallet to view your profile.
        </p>
        <button
          onClick={connect}
          style={{ fontFamily: "var(--font-mono)", fontSize: 12, padding: "12px 24px", background: "var(--confirmed)", color: "var(--void)", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700 }}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 32px", maxWidth: 860 }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", marginBottom: 24, textTransform: "uppercase", letterSpacing: "0.15em" }}>
        Profile
      </p>

      {/* Identity row */}
      <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 40 }}>
        <CipherFingerprint address={address} stats={stats} />
        <div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--confirmed)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>
            CIPHER Participant
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text)", marginBottom: 4 }}>
            {address.slice(0, 10)}…{address.slice(-6)}
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
            StudioNet · Chain 61999
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 40 }}>
        {[
          ["Circuits", stats.totalCircuits],
          ["Wins", stats.wins],
          ["Avg Score", stats.avgScore ? `${stats.avgScore}` : "—"],
          ["GEN Earned", stats.totalEarned > 0 ? stats.totalEarned.toFixed(4) : "—"],
        ].map(([label, value]) => (
          <div key={label as string} style={{ padding: "16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
              {label}
            </p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--text)" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Circuit history */}
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
        Circuit History
      </p>

      {loading && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>Loading…</p>
      )}

      {!loading && subjects.length === 0 && (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
            No circuits yet.
          </p>
          <Link
            href="/subjects/new"
            style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--confirmed)", padding: "10px 20px", border: "1px solid var(--confirmed)", borderRadius: 6 }}
          >
            Create your first circuit →
          </Link>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {subjects.map((sub) => (
          <Link
            key={sub.id}
            href={`/subjects/${sub.id}`}
            style={{
              display: "grid",
              gridTemplateColumns: "48px 1fr 100px 120px",
              alignItems: "center",
              gap: 16,
              padding: "14px 18px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
              #{sub.id}
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text)" }}>
              {sub.title}
            </span>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em",
              padding: "3px 8px", borderRadius: 4,
              background: "var(--raised)", color: "var(--sub)",
              textAlign: "center"
            }}>
              {sub.status}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", textAlign: "right" }}>
              {Number(sub.myInfo?.payout ?? "0") > 0
                ? `+${(Number(sub.myInfo.payout) / 1e18).toFixed(4)} GEN`
                : sub.myInfo?.withdrawn ? "withdrawn" : ""}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
