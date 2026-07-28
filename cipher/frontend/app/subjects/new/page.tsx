"use client";
import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CipherContractClient } from "@/lib/genlayer/contract";
import { TxSpinner } from "@/components/ui/TxSpinner";
import { TxPhase } from "@/lib/genlayer/status";
import { useWallet } from "@/lib/wallet/WalletContext";
import { errorMessage } from "@/lib/errors";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const STAGES = ["Define", "Evidence Policy", "Review & Deploy"];
const DEFAULT_CONSTITUTION = JSON.stringify({
  source_policy:"Use Reuters, AP, BBC, and official government sources only.",
  permitted_tiers:["primary","independent","contextual"],
  appeal_threshold:3, resolution_window_hours:48,
  min_primary_sources_per_node:1,
  partial_confirmation:"allow", insufficient_evidence:"refund_all",
},null,2);

const IS: React.CSSProperties = { width:"100%", padding:"10px 14px", background:"var(--raised)", border:"1px solid var(--border)", color:"var(--text)", fontFamily:"var(--font-body)", fontSize:14, outline:"none", transition:"border-color 0.2s" };
const LS: React.CSSProperties = { display:"block", fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:6 };
const focus = (e: React.FocusEvent<HTMLElement>) => (e.target as HTMLElement).style.borderColor="var(--confirmed)";
const blur  = (e: React.FocusEvent<HTMLElement>) => (e.target as HTMLElement).style.borderColor="var(--border)";

function Field({ label, hint, children }: { label:string; hint?:string; children:React.ReactNode }) {
  return <div><label style={LS}>{label}{hint&&<span style={{ color:"var(--muted)", marginLeft:6, textTransform:"none", letterSpacing:0, fontSize:9 }}>{hint}</span>}</label>{children}</div>;
}

export default function NewSubjectPage() {
  const router = useRouter();
  const { address, connect } = useWallet();
  const [stage, setStage] = useState(0);
  const [txPhase, setTxPhase] = useState<TxPhase>("idle");
  const [txError, setTxError] = useState<string|undefined>();
  const [form, setForm] = useState({ title:"", description:"", entity:"", obs_start:"", obs_end:"", min_players:"2", max_players:"4", stake_gen:"1", constitution_json:DEFAULT_CONSTITUTION });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => setForm(f=>({...f,[k]:e.target.value}));

  async function handleCreate() {
    if (!address||!CONTRACT_ADDRESS) return;
    setTxPhase("sign"); setTxError(undefined);
    try {
      const constitution = JSON.parse(form.constitution_json);
      const client = new CipherContractClient(CONTRACT_ADDRESS, address);
      setTxPhase("transmit");
      await client.createSubject({ title:form.title, description:form.description, entity:form.entity, obs_start:form.obs_start, obs_end:form.obs_end, min_players:Number(form.min_players), max_players:Number(form.max_players), stake_wei:String(BigInt(Math.floor(parseFloat(form.stake_gen)*1e18))), constitution_json:JSON.stringify(constitution) });
      setTxPhase("accepted");
      setTimeout(()=>router.push("/"),1400);
    } catch(e: unknown) { setTxPhase("failed"); setTxError(errorMessage(e, "Transaction failed.")); }
  }

  if (!address) return (
    <div style={{ padding:"80px 72px", display:"flex", flexDirection:"column", alignItems:"flex-start", gap:24 }}>
      <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" stroke="var(--trace)" strokeWidth="1.5" strokeDasharray="5 3"/><circle cx="24" cy="24" r="10" fill="none" stroke="var(--muted)" strokeWidth="1"/></svg>
      <p style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:700, color:"var(--muted)" }}>Connect wallet to create a circuit.</p>
      <button onClick={connect} style={{ fontFamily:"var(--font-mono)", fontSize:12, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"12px 28px", background:"var(--confirmed)", color:"var(--void)", border:"none", cursor:"pointer" }}>Connect Wallet</button>
    </div>
  );

  return (
    <div style={{ padding:"32px 52px", maxWidth:680 }}>
      <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.1em", marginBottom:32 }}>
        OBSERVATORY → <span style={{ color:"var(--confirmed)" }}>NEW CIRCUIT</span>
      </p>
      <h1 style={{ fontFamily:"var(--font-display)", fontSize:24, fontWeight:800, letterSpacing:"-0.02em", marginBottom:8, color:"var(--text)" }}>Initialise Subject</h1>
      <p style={{ fontFamily:"var(--font-body)", fontSize:14, color:"var(--sub)", marginBottom:48 }}>Define the event, set the evidence policy, and deploy your circuit on GenLayer.</p>

      {/* Stage track */}
      <div style={{ display:"flex", alignItems:"center", marginBottom:48 }}>
        {STAGES.map((s,i)=>(
          <React.Fragment key={i}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <div style={{ width:32,height:32,borderRadius:"50%", border:`${i<=stage?2:1}px solid ${i<stage?"var(--confirmed)":i===stage?"var(--confirmed)":"var(--border)"}`, background:i<stage?"var(--confirmed)":i===stage?"rgba(0,255,179,0.08)":"var(--deep)", display:"flex",alignItems:"center",justifyContent:"center" }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:i<stage?"var(--void)":i===stage?"var(--confirmed)":"var(--muted)", fontWeight:700 }}>{i<stage?"✓":i+1}</span>
              </div>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:8, letterSpacing:"0.1em", textTransform:"uppercase", color:i===stage?"var(--confirmed)":"var(--muted)", whiteSpace:"nowrap" }}>{s}</span>
            </div>
            {i<STAGES.length-1&&<div style={{ flex:1, height:1, background:i<stage?"var(--confirmed)":"var(--trace)", margin:"0 6px 20px" }}/>}
          </React.Fragment>
        ))}
      </div>

      {stage===0&&(
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
          <Field label="Subject Title" hint="5–200 chars"><input value={form.title} onChange={set("title")} onFocus={focus} onBlur={blur} placeholder="e.g. Will AAPL close above $220 on Dec 31, 2025?" style={IS}/></Field>
          <Field label="Primary Entity" hint="ticker, team, project…"><input value={form.entity} onChange={set("entity")} onFocus={focus} onBlur={blur} placeholder="e.g. AAPL" style={IS}/></Field>
          <Field label="Description" hint="What specifically is being predicted?"><textarea value={form.description} onChange={set("description")} onFocus={focus} onBlur={blur} rows={4} placeholder="Detailed description of the prediction and how it will be verified…" style={{ ...IS, resize:"vertical" }}/></Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Field label="Observation Start"><input type="date" value={form.obs_start} onChange={set("obs_start")} style={IS}/></Field>
            <Field label="Observation End"><input type="date" value={form.obs_end} onChange={set("obs_end")} style={IS}/></Field>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
            <Field label="Min Players"><select value={form.min_players} onChange={set("min_players")} style={IS}>{[2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}</select></Field>
            <Field label="Max Players"><select value={form.max_players} onChange={set("max_players")} style={IS}>{[2,3,4,5,6].map(n=><option key={n} value={n}>{n}</option>)}</select></Field>
            <Field label="Stake / Player (GEN)"><input type="number" step="0.001" min="0.001" value={form.stake_gen} onChange={set("stake_gen")} style={IS}/></Field>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <button onClick={()=>setStage(1)} disabled={!form.title||!form.entity||!form.obs_start||!form.obs_end} style={{ fontFamily:"var(--font-mono)", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"12px 28px", background:"var(--confirmed)", color:"var(--void)", border:"none", cursor:"pointer", opacity:(!form.title||!form.entity)?0.5:1 }}>
              Evidence Policy →
            </button>
          </div>
        </div>
      )}

      {stage===1&&(
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
          <div style={{ padding:"16px 20px", background:"var(--deep)", border:"1px solid var(--border)", borderLeft:"2px solid var(--partial)" }}>
            <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--partial)", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:8 }}>Constitution</p>
            <p style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--sub)", lineHeight:1.65 }}>The constitution is sealed before the first player joins. It governs how GenLayer adjudicates — source tiers, partial confirmation policy, and insufficient evidence handling.</p>
          </div>
          <Field label="Constitution JSON" hint="Stored on-chain — immutable after first join"><textarea value={form.constitution_json} onChange={set("constitution_json")} onFocus={focus} onBlur={blur} rows={14} style={{ ...IS, fontFamily:"var(--font-mono)", fontSize:12, resize:"vertical" }}/></Field>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <button onClick={()=>setStage(0)} style={{ fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", padding:"12px 24px", border:"1px solid var(--border)", color:"var(--sub)", background:"transparent", cursor:"pointer" }}>← Back</button>
            <button onClick={()=>setStage(2)} style={{ fontFamily:"var(--font-mono)", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"12px 28px", background:"var(--confirmed)", color:"var(--void)", border:"none", cursor:"pointer" }}>Review & Deploy →</button>
          </div>
        </div>
      )}

      {stage===2&&(
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
          <div style={{ padding:"24px", background:"var(--deep)", border:"1px solid var(--border)", borderTop:"2px solid var(--confirmed)" }}>
            <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--confirmed)", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:16 }}>Circuit Summary</p>
            <dl style={{ display:"grid", gridTemplateColumns:"140px 1fr", gap:"10px 20px" }}>
              {[["Title",form.title],["Entity",form.entity],["Observation",`${form.obs_start} → ${form.obs_end}`],["Players",`${form.min_players} – ${form.max_players}`],["Stake",`${form.stake_gen} GEN per player`],["Max Pot",`${(parseFloat(form.stake_gen)*Number(form.max_players)).toFixed(3)} GEN`]].map(([k,v])=>(
                <React.Fragment key={k}>
                  <dt style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.12em", textTransform:"uppercase" }}>{k}</dt>
                  <dd style={{ fontFamily:"var(--font-body)", fontSize:13, color:"var(--text)" }}>{v}</dd>
                </React.Fragment>
              ))}
            </dl>
          </div>
          <TxSpinner phase={txPhase} error={txError}/>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <button onClick={()=>setStage(1)} style={{ fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", padding:"12px 24px", border:"1px solid var(--border)", color:"var(--sub)", background:"transparent", cursor:"pointer" }}>← Back</button>
            {(txPhase==="idle"||txPhase==="failed")&&<button onClick={handleCreate} style={{ fontFamily:"var(--font-mono)", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"12px 32px", background:"var(--confirmed)", color:"var(--void)", border:"none", cursor:"pointer" }}>Deploy Circuit →</button>}
          </div>
        </div>
      )}
    </div>
  );
}
