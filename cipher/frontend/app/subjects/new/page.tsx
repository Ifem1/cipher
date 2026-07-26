"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CipherContractClient } from "@/lib/genlayer/contract";
import { TxSpinner } from "@/components/ui/TxSpinner";
import { TxPhase } from "@/lib/genlayer/status";
import { useWallet } from "@/lib/wallet/WalletContext";
import { errorMessage } from "@/lib/errors";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

const STAGES = ["Define", "Evidence Policy", "Constitution", "Review"];

const DEFAULT_CONSTITUTION = JSON.stringify({
  source_policy: "Use Reuters, AP, BBC, and official government sources only.",
  appeal_threshold: 3,
  resolution_window_hours: 48,
}, null, 2);

type SubjectForm = {
  title: string;
  description: string;
  entity: string;
  obs_start: string;
  obs_end: string;
  min_players: number;
  max_players: number;
  stake_gen: string;
  constitution_json: string;
};

export default function NewSubjectPage() {
  const router = useRouter();
  const { address } = useWallet();
  const [stage, setStage] = useState(0);
  const [txPhase, setTxPhase] = useState<TxPhase>("idle");
  const [txError, setTxError] = useState<string | undefined>();

  const [form, setForm] = useState({
    title: "",
    description: "",
    entity: "",
    obs_start: "",
    obs_end: "",
    min_players: 2,
    max_players: 4,
    stake_gen: "1",
    constitution_json: DEFAULT_CONSTITUTION,
  });

  function field(key: keyof typeof form) {
    return {
      value: String(form[key]),
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  async function handleCreate() {
    if (!address || !CONTRACT_ADDRESS) return;
    setTxPhase("sign");
    setTxError(undefined);
    try {
      let constitution: object;
      try {
        constitution = JSON.parse(form.constitution_json);
      } catch {
        throw new Error("Constitution must be valid JSON.");
      }

      const client = new CipherContractClient(CONTRACT_ADDRESS, address);
      setTxPhase("transmit");

      await client.createSubject({
        title: form.title,
        description: form.description,
        entity: form.entity,
        obs_start: form.obs_start,
        obs_end: form.obs_end,
        min_players: Number(form.min_players),
        max_players: Number(form.max_players),
        stake_wei: String(BigInt(Math.floor(parseFloat(form.stake_gen) * 1e18))),
        constitution_json: JSON.stringify(constitution),
      });

      setTxPhase("accepted");
      setTimeout(() => router.push("/"), 1200);
    } catch (e: unknown) {
      setTxPhase("failed");
      setTxError(errorMessage(e, "Transaction failed."));
    }
  }

  if (!address) {
    return (
      <div style={{ padding: "80px 32px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--muted)" }}>
          Connect your wallet to create a circuit.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 32px", maxWidth: 680 }}>
      {/* Header */}
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--confirmed)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
        New Circuit
      </p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, marginBottom: 32 }}>
        Initialise Subject
      </h1>

      {/* Stage indicator */}
      <div style={{ display: "flex", gap: 0, marginBottom: 40, position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "var(--border)", transform: "translateY(-50%)", zIndex: 0 }} />
        {STAGES.map((s, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative", zIndex: 1 }}>
            <div
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: i < stage ? "var(--confirmed)" : i === stage ? "var(--raised)" : "var(--deep)",
                border: `2px solid ${i <= stage ? "var(--confirmed)" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: i < stage ? "var(--void)" : i === stage ? "var(--confirmed)" : "var(--muted)" }}>
                {i < stage ? "✓" : i + 1}
              </span>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: i === stage ? "var(--text)" : "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Stage 0: Define */}
      {stage === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Field label="Subject Title" hint="5–200 characters">
            <input {...field("title")} placeholder="e.g. Will AAPL close above $220 on Dec 31?" style={inputStyle} />
          </Field>
          <Field label="Description" hint="What specifically is being predicted?">
            <textarea {...field("description")} rows={4} placeholder="Detailed description of the prediction…" style={{ ...inputStyle, resize: "vertical" }} />
          </Field>
          <Field label="Entity / Topic" hint="The main subject (stock ticker, team name, etc.)">
            <input {...field("entity")} placeholder="e.g. AAPL" style={inputStyle} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Observation Start">
              <input type="date" {...field("obs_start")} style={inputStyle} />
            </Field>
            <Field label="Observation End">
              <input type="date" {...field("obs_end")} style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Field label="Min Players">
              <select {...field("min_players")} style={inputStyle}>
                {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Max Players">
              <select {...field("max_players")} style={inputStyle}>
                {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Stake per Player (GEN)">
              <input type="number" step="0.001" min="0.001" {...field("stake_gen")} style={inputStyle} />
            </Field>
          </div>
          <StageNav onNext={() => setStage(1)} nextLabel="Next: Evidence Policy →" />
        </div>
      )}

      {/* Stage 1: Evidence Policy */}
      {stage === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ padding: "16px 20px", background: "var(--raised)", border: "1px solid var(--border)", borderRadius: 8 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--sub)", marginBottom: 8 }}>
              The constitution defines how adjudicators must resolve this subject.
              Source policy, appeal rules, and resolution windows are encoded here.
            </p>
          </div>
          <Field label="Constitution JSON" hint="Editable — will be stored on-chain">
            <textarea
              value={form.constitution_json}
              onChange={(e) => setForm((f) => ({ ...f, constitution_json: e.target.value }))}
              rows={12}
              style={{ ...inputStyle, fontFamily: "var(--font-mono)", fontSize: 12, resize: "vertical" }}
            />
          </Field>
          <StageNav onBack={() => setStage(0)} onNext={() => setStage(2)} nextLabel="Next: Review →" />
        </div>
      )}

      {/* Stage 2: Constitution review */}
      {stage === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SummaryCard form={form} />
          <StageNav onBack={() => setStage(1)} onNext={() => setStage(3)} nextLabel="Confirm & Deploy →" />
        </div>
      )}

      {/* Stage 3: Deploy */}
      {stage === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SummaryCard form={form} />
          <TxSpinner phase={txPhase} error={txError} />
          {txPhase === "idle" || txPhase === "failed" ? (
            <StageNav onBack={() => setStage(2)} onNext={handleCreate} nextLabel="Deploy Subject →" />
          ) : null}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "var(--raised)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
  outline: "none",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
        {label}
        {hint && <span style={{ color: "var(--muted)", marginLeft: 8, textTransform: "none", letterSpacing: 0 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function StageNav({ onBack, onNext, nextLabel }: { onBack?: () => void; onNext?: () => void; nextLabel?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8 }}>
      {onBack ? (
        <button onClick={onBack} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--sub)", padding: "10px 16px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent" }}>
          ← Back
        </button>
      ) : <div />}
      {onNext && (
        <button onClick={onNext} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--void)", background: "var(--confirmed)", padding: "10px 20px", borderRadius: 6, border: "none", fontWeight: 700 }}>
          {nextLabel ?? "Next →"}
        </button>
      )}
    </div>
  );
}

function SummaryCard({ form }: { form: SubjectForm }) {
  return (
    <div style={{ padding: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--confirmed)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Summary</p>
      <dl style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px 16px" }}>
        {[
          ["Title", form.title],
          ["Entity", form.entity],
          ["Observation", `${form.obs_start} → ${form.obs_end}`],
          ["Players", `${form.min_players}–${form.max_players}`],
          ["Stake", `${form.stake_gen} GEN per player`],
        ].map(([k, v]) => (
          <React.Fragment key={k}>
            <dt style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>{k}</dt>
            <dd style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text)" }}>{v}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}

import React from "react";
