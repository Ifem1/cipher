"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CipherContractClient } from "@/lib/genlayer/contract";
import { useWallet } from "@/lib/wallet/WalletContext";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

/* ── Hero background circuit SVG ─────────────────────────────────────────── */
function HeroCircuit() {
  return (
    <svg
      viewBox="380 80 680 520"
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3z" fill="var(--border)"/>
        </marker>
        <marker id="arr-on" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3z" fill="var(--confirmed)"/>
        </marker>
        <pattern id="hgrid" width="64" height="64" patternUnits="userSpaceOnUse">
          <circle cx="0" cy="0" r="1" fill="var(--trace)" opacity="0.8"/>
        </pattern>
        <filter id="hglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width="100%" height="100%" fill="url(#hgrid)"/>

      {/* Inactive traces */}
      <line x1="620" y1="160" x2="790" y2="260" stroke="var(--trace)" strokeWidth="1.5" markerEnd="url(#arr)" strokeDasharray="6 4"/>
      <line x1="620" y1="160" x2="550" y2="310" stroke="var(--trace)" strokeWidth="1.5" markerEnd="url(#arr)" strokeDasharray="6 4"/>
      <line x1="550" y1="310" x2="480" y2="430" stroke="var(--trace)" strokeWidth="1.5" markerEnd="url(#arr)" strokeDasharray="6 4"/>
      <line x1="790" y1="260" x2="880" y2="360" stroke="var(--trace)" strokeWidth="1.5" markerEnd="url(#arr)" strokeDasharray="6 4"/>
      <line x1="550" y1="310" x2="730" y2="400" stroke="var(--trace)" strokeWidth="1.5" markerEnd="url(#arr)" strokeDasharray="6 4"/>
      <line x1="790" y1="260" x2="730" y2="400" stroke="var(--trace)" strokeWidth="1.5" markerEnd="url(#arr)" strokeDasharray="6 4"/>

      {/* Active traces — confirmed path */}
      <line x1="620" y1="160" x2="790" y2="260" stroke="var(--confirmed)" strokeWidth="2"
        markerEnd="url(#arr-on)" opacity="0.6" strokeDasharray="8 6"
        style={{animation:"trace-flow 1.4s linear infinite"}}/>
      <line x1="790" y1="260" x2="730" y2="400" stroke="var(--partial)" strokeWidth="1.5"
        markerEnd="url(#arr-on)" opacity="0.45" strokeDasharray="6 4"/>

      {/* Nodes */}
      {/* n0 — terminal — confirmed */}
      <circle cx="620" cy="160" r="22" fill="var(--raised)" stroke="var(--confirmed)" strokeWidth="2"/>
      <circle cx="620" cy="160" r="9" fill="var(--confirmed)" filter="url(#hglow)"/>
      <circle cx="620" cy="160" r="30" fill="var(--confirmed)" opacity="0.05"/>

      {/* n1 — conditional — active */}
      <circle cx="790" cy="260" r="17" fill="var(--raised)" stroke="var(--p6)" strokeWidth="1.5"/>
      <circle cx="790" cy="260" r="6" fill="var(--p6)" opacity="0.6"/>

      {/* n2 — conjunctive — pending */}
      <circle cx="550" cy="310" r="17" fill="var(--raised)" stroke="var(--border)" strokeWidth="1" opacity="0.5"/>
      <circle cx="550" cy="310" r="5" fill="none" stroke="var(--muted)" strokeWidth="1" strokeDasharray="3 2"/>

      {/* n3 — terminal — partial */}
      <circle cx="730" cy="400" r="22" fill="var(--raised)" stroke="var(--partial)" strokeWidth="2"/>
      <circle cx="730" cy="400" r="9" fill="var(--partial)" opacity="0.6"/>

      {/* n4 — collapsed */}
      <circle cx="480" cy="430" r="14" fill="var(--raised)" stroke="var(--contradicted)" strokeWidth="1" opacity="0.35"/>
      <line x1="472" y1="422" x2="488" y2="438" stroke="var(--contradicted)" strokeWidth="1" opacity="0.4"/>
      <line x1="488" y1="422" x2="472" y2="438" stroke="var(--contradicted)" strokeWidth="1" opacity="0.4"/>

      {/* n5 — disjunctive */}
      <circle cx="880" cy="360" r="14" fill="var(--raised)" stroke="var(--border)" strokeWidth="1" opacity="0.4"/>

      {/* Type labels */}
      <text x="620" y="194" textAnchor="middle" fill="var(--confirmed)" fontSize="8" fontFamily="monospace" letterSpacing="0.1em">TERMINAL</text>
      <text x="790" y="290" textAnchor="middle" fill="var(--p6)" fontSize="8" fontFamily="monospace" letterSpacing="0.1em" opacity="0.8">CONDITIONAL</text>
      <text x="730" y="434" textAnchor="middle" fill="var(--partial)" fontSize="8" fontFamily="monospace" letterSpacing="0.1em">TERMINAL</text>
      <text x="480" y="458" textAnchor="middle" fill="var(--contradicted)" fontSize="8" fontFamily="monospace" letterSpacing="0.1em" opacity="0.5">COLLAPSED</text>

      {/* Score plates */}
      <rect x="686" y="455" width="88" height="28" rx="1" fill="var(--raised)" stroke="var(--border)"/>
      <text x="730" y="474" textAnchor="middle" fill="var(--partial)" fontSize="13" fontFamily="monospace" fontWeight="700">74.2</text>
      <rect x="580" y="455" width="88" height="28" rx="1" fill="var(--raised)" stroke="var(--confirmed)" strokeWidth="1.5"/>
      <text x="624" y="474" textAnchor="middle" fill="var(--confirmed)" fontSize="13" fontFamily="monospace" fontWeight="700">91.6</text>

      <text x="680" y="510" textAnchor="middle" fill="var(--confirmed)" fontSize="8" fontFamily="monospace" letterSpacing="0.25em" opacity="0.5">CIRCUIT RESOLVED</text>
    </svg>
  );
}

/* ── Subject tile for observatory ────────────────────────────────────────── */
function SubjectTile({ subject }: { subject: any }) {
  const stakeGEN = (Number(subject.stake_per_player ?? "0") / 1e18).toFixed(3);
  const SC: Record<string, string> = {
    OPEN: "var(--confirmed)",
    COMMITTED: "var(--p4)",
    OBSERVATION_ACTIVE: "var(--p6)",
    REVEAL_WINDOW: "var(--partial)",
    PROVISIONAL_SCORES: "var(--p2)",
    CLAIMABLE: "var(--confirmed)",
    CANCELLED: "var(--contradicted)",
    FINALIZED: "var(--p6)",
  };
  const col = SC[subject.status] ?? "var(--muted)";

  return (
    <Link href={`/subjects/${subject.id}`}
      style={{ display: "block", padding: "20px", background: "var(--surface)", border: "1px solid var(--border)", position: "relative", overflow: "hidden", transition: "border-color 0.2s var(--ease-surge)" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = col)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: col }}/>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>
          #{subject.id}{subject.entity ? ` · ${subject.entity}` : ""}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.08em", color: col, border: `1px solid ${col}`, padding: "2px 7px", opacity: 0.9 }}>
          {subject.status}
        </span>
      </div>

      <h3 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--text)", lineHeight: 1.35, marginBottom: 16 }}>
        {subject.title}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
        {[["PLAYERS", `${subject.player_count ?? 0}/${subject.max_players ?? "?"}`], ["STAKE", `${stakeGEN} GEN`], ["OBS END", subject.obs_end ?? "—"]].map(([l, v]) => (
          <div key={l}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.1em", marginBottom: 2 }}>{l}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--sub)" }}>{v}</p>
          </div>
        ))}
      </div>

      {/* Topology silhouette */}
      <svg width="100%" height="20" style={{ opacity: 0.25 }}>
        {[0.12, 0.35, 0.58, 0.8].slice(0, 2 + (Number(subject.id) % 3)).map((x, i) => (
          <circle key={i} cx={`${x * 100}%`} cy="10" r="4" fill="none" stroke="var(--confirmed)" strokeWidth="1"/>
        ))}
        <line x1="12%" y1="10" x2="35%" y2="10" stroke="var(--trace)" strokeWidth="1"/>
        <line x1="35%" y1="10" x2="58%" y2="10" stroke="var(--trace)" strokeWidth="1"/>
      </svg>
    </Link>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function Home() {
  const { address, connect } = useWallet();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!CONTRACT_ADDRESS) return;
    setLoading(true);
    const client = new CipherContractClient(CONTRACT_ADDRESS, address ?? undefined);
    client.getAllSubjects()
      .then(s => setSubjects(s))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [address]);

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 72px", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.28 }}>
          <HeroCircuit />
        </div>
        {/* Fog overlay — left side clear */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 55% 90% at 25% 50%, transparent 0%, var(--void) 68%)", pointerEvents: "none" }}/>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 680 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--confirmed)", animation: "signal-pulse 2.4s ease-in-out infinite" }}/>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--confirmed)", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Live · GenLayer StudioNet · Chain 61999
            </span>
          </div>

          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: "clamp(52px, 6.5vw, 96px)",
            lineHeight: 1.0, letterSpacing: "-0.025em",
            color: "var(--text)", marginBottom: 24,
          }}>
            Build the logic.<br/>
            <span style={{ color: "var(--confirmed)" }}>Watch reality</span><br/>
            run it.
          </h1>

          <p style={{ fontFamily: "var(--font-body)", fontSize: 18, color: "var(--sub)", lineHeight: 1.7, maxWidth: 500, marginBottom: 52 }}>
            Construct dependency-linked claim lattices about real-world events.
            GenLayer resolves each node against live public evidence.
            Accuracy earns. Inaccuracy penalises.
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/subjects/new" style={{
              fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "14px 32px",
              background: "var(--confirmed)", color: "var(--void)",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/><circle cx="6" cy="6" r="2" fill="currentColor"/></svg>
              New Circuit
            </Link>
            <a href="#observatory" style={{
              fontFamily: "var(--font-mono)", fontSize: 12,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "14px 32px",
              border: "1px solid var(--border)", color: "var(--sub)",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              View Observatory →
            </a>
          </div>

          <div style={{ display: "flex", gap: 40, marginTop: 60, flexWrap: "wrap" }}>
            {[["PROTOCOL","GenLayer"],["NETWORK","StudioNet"],["SETTLEMENT","Optimistic Democracy"],["ADJUDICATION","LLM + Live Web"]].map(([k,v]) => (
              <div key={k}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.15em", marginBottom: 4 }}>{k}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--sub)" }}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 0.35 }}>
          <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, transparent, var(--confirmed))" }}/>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--muted)", letterSpacing: "0.18em" }}>SCROLL</span>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{ padding: "96px 72px", borderTop: "1px solid var(--border)", background: "var(--deep)" }}>
        <div style={{ maxWidth: 960 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 56 }}>
            <div style={{ flex: 1, height: 1, background: "var(--trace)" }}/>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.22em", whiteSpace: "nowrap" }}>THE PROTOCOL</span>
            <div style={{ flex: 1, height: 1, background: "var(--trace)" }}/>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px 80px" }}>
            {[
              ["01","Propose a Subject","Define a real-world event with a bounded observation window and evidence policy. GenLayer reviews whether your subject is independently resolvable before a single player joins."],
              ["02","Build Your Lattice","Construct a directed acyclic graph of claim nodes. Terminal facts, conditional chains, conjunctive dependencies. Allocate exactly 100 weight points across your 3–7 nodes."],
              ["03","Seal & Commit","Hash your lattice with a random salt and submit the commitment on-chain. No player sees another's structure before the reveal window opens. Reality will adjudicate all."],
              ["04","Reality Adjudicates","GenLayer resolves each terminal node against live public evidence. Confirmed parents activate children. Contradicted parents collapse them. Your score is how much of your logic reality confirmed."],
            ].map(([n,t,b]) => (
              <div key={n} style={{ display: "flex", gap: 20 }}>
                <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--confirmed)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--confirmed)", fontWeight: 700 }}>{n}</div>
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>{t}</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--sub)", lineHeight: 1.7 }}>{b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ─────────────────────────────────────────────────── */}
      <section style={{ padding: "96px 72px", borderTop: "1px solid var(--border)" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 800, color: "var(--text)", marginBottom: 56, maxWidth: 600, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
          Not a prediction market.<br/>
          <span style={{ color: "var(--sub)", fontWeight: 400 }}>A logic-accuracy protocol.</span>
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {[
            { accent: "var(--confirmed)", title: "Compound Claims", body: "Up to 7 nodes per lattice. Conditional, conjunctive, disjunctive, inverse — your causal model of how events unfold, encoded as a directed graph." },
            { accent: "var(--p4)", title: "Weight Propagation", body: "Collapsed node weights redistribute proportionally to surviving active nodes. 80% right earns 80% of your proportional share — not zero, not a coin flip." },
            { accent: "var(--p6)", title: "Sealed Lattice", body: "Commit-reveal scheme prevents reactive copying. Your model is cryptographically sealed before any player sees another's structure." },
            { accent: "var(--partial)", title: "Bounded Evidence", body: "Each subject has a constitution: permitted source tiers, evidence cut-off, partial confirmation policy. GenLayer follows it — every validation is auditable." },
            { accent: "var(--p3)", title: "Proportional Payout", body: "No winner-takes-all. Score above the minimum threshold and receive your proportional share of the pot. Accuracy earns continuously." },
            { accent: "var(--warning)", title: "Decentralised Adjudication", body: "GenLayer validators independently evaluate each node resolution. No single party controls the outcome. Agreement via Optimistic Democracy." },
          ].map(f => (
            <div key={f.title} style={{ padding: "28px 24px", background: "var(--deep)", border: "1px solid var(--border)", borderTop: `2px solid ${f.accent}` }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: f.accent, marginBottom: 20, opacity: 0.9 }}/>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>{f.title}</p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--sub)", lineHeight: 1.65 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── OBSERVATORY ──────────────────────────────────────────────────── */}
      <section id="observatory" style={{ padding: "96px 72px", borderTop: "1px solid var(--border)", background: "var(--deep)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--confirmed)", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 8 }}>OBSERVATORY</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "var(--text)" }}>Live Circuits</h2>
          </div>
          <Link href="/subjects/new" style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", color: "var(--confirmed)", padding: "9px 22px", border: "1px solid var(--confirmed)" }}>
            + NEW CIRCUIT
          </Link>
        </div>

        {!CONTRACT_ADDRESS && (
          <div style={{ padding: "64px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <svg width="120" height="60" viewBox="0 0 120 60">
              <circle cx="20" cy="30" r="10" fill="none" stroke="var(--trace)" strokeWidth="1.5" strokeDasharray="4 3"/>
              <circle cx="60" cy="30" r="10" fill="none" stroke="var(--trace)" strokeWidth="1.5" strokeDasharray="4 3"/>
              <circle cx="100" cy="30" r="10" fill="none" stroke="var(--trace)" strokeWidth="1.5" strokeDasharray="4 3"/>
              <line x1="30" y1="30" x2="50" y2="30" stroke="var(--trace)" strokeWidth="1"/>
              <line x1="70" y1="30" x2="90" y2="30" stroke="var(--trace)" strokeWidth="1"/>
            </svg>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>No circuits are running.</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>Set NEXT_PUBLIC_CONTRACT_ADDRESS to connect the observatory.</p>
          </div>
        )}

        {CONTRACT_ADDRESS && loading && (
          <div style={{ padding: "48px 0", display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}>
            <svg width="60" height="18"><circle cx="9" cy="9" r="7" fill="none" stroke="var(--trace)" strokeWidth="1.5"/><line x1="16" y1="9" x2="44" y2="9" stroke="var(--trace)" strokeWidth="1" strokeDasharray="4 3"/><circle cx="51" cy="9" r="7" fill="none" stroke="var(--confirmed)" strokeWidth="1.5"/></svg>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", letterSpacing: "0.12em" }}>SCANNING…</span>
          </div>
        )}

        {CONTRACT_ADDRESS && !loading && subjects.length === 0 && (
          <div style={{ padding: "64px 0", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", marginBottom: 24 }}>No circuits are running.</p>
            <Link href="/subjects/new" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--confirmed)", padding: "10px 24px", border: "1px solid var(--confirmed)" }}>
              Launch the first circuit →
            </Link>
          </div>
        )}

        {subjects.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 2 }}>
            {subjects.map(s => <SubjectTile key={s.id} subject={s}/>)}
          </div>
        )}
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: "120px 72px", borderTop: "1px solid var(--border)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04 }}>
          <svg width="100%" height="100%">
            <defs><pattern id="ctad" width="64" height="64" patternUnits="userSpaceOnUse"><circle cx="32" cy="32" r="1" fill="var(--confirmed)"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#ctad)"/>
          </svg>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--confirmed)", letterSpacing: "0.25em", marginBottom: 28 }}>CIPHER IS WHERE</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,3.5vw,48px)", fontWeight: 800, color: "var(--text)", lineHeight: 1.15, letterSpacing: "-0.02em", maxWidth: 680, margin: "0 auto 48px" }}>
            Players build logical models of the future, stake on their accuracy, and GenLayer runs reality through the circuit.
          </h2>
          {address ? (
            <Link href="/subjects/new" style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "16px 40px", background: "var(--confirmed)", color: "var(--void)", display: "inline-block" }}>
              Launch a Circuit →
            </Link>
          ) : (
            <button onClick={connect} style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "16px 40px", background: "var(--confirmed)", color: "var(--void)", border: "none", cursor: "pointer" }}>
              Connect Wallet →
            </button>
          )}
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 72px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" stroke="var(--confirmed)" strokeWidth="1"/><circle cx="7" cy="7" r="2" fill="var(--confirmed)"/></svg>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em" }}>CIPHER PROTOCOL</span>
        </div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--muted)" }}>
          StudioNet · GenLayer · {CONTRACT_ADDRESS ? `${CONTRACT_ADDRESS.slice(0,10)}…${CONTRACT_ADDRESS.slice(-4)}` : "contract not configured"}
        </p>
      </footer>
    </div>
  );
}
