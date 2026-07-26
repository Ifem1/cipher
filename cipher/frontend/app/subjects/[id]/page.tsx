"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CipherContractClient, Subject, PlayerInfo } from "@/lib/genlayer/contract";
import { TxSpinner } from "@/components/ui/TxSpinner";
import { TxPhase } from "@/lib/genlayer/status";
import { useWallet } from "@/lib/wallet/WalletContext";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const PLAYER_COLORS = ["var(--p1)","var(--p2)","var(--p3)","var(--p4)","var(--p5)","var(--p6)"];
const STATUS_COLORS: Record<string,string> = {
  OPEN:"var(--confirmed)",COMMITTED:"var(--p4)",OBSERVATION_ACTIVE:"var(--p6)",
  REVEAL_WINDOW:"var(--partial)",FULLY_REVEALED:"var(--partial)",
  RESOLUTION_AVAILABLE:"var(--p2)",RESOLUTION_PENDING:"var(--p2)",PROVISIONAL_SCORES:"var(--p2)",
  APPEAL_WINDOW:"var(--warning)",FINALIZED:"var(--p6)",CLAIMABLE:"var(--confirmed)",
  CLOSED:"var(--muted)",CANCELLED:"var(--contradicted)",REFUNDED:"var(--muted)",
};

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

  async function load() {
    if (!CONTRACT_ADDRESS) return;
    try {
      const client = new CipherContractClient(CONTRACT_ADDRESS, address ?? undefined);
      const [sub, pl] = await Promise.all([client.getSubject(id), client.getPlayerList(id)]);
      setSubject(sub); setPlayers(pl);
      if (address) { const info = await client.getPlayerInfo(id, address).catch(() => null); setMyInfo(info); }
    } catch (e: any) { setError(e?.message ?? "Failed to load"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [id, address]);

  async function tx(fn: (c: CipherContractClient) => Promise<unknown>) {
    if (!address) return;
    setTxPhase("sign"); setTxError(undefined);
    try {
      setTxPhase("transmit");
      await fn(new CipherContractClient(CONTRACT_ADDRESS, address));
      setTxPhase("accepted");
      await load();
    } catch (e: any) { setTxPhase("failed"); setTxError(e?.message); }
  }

  if (loading) return (
    <div style={{ padding: "60px 72px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <svg width="50" height="16"><circle cx="8" cy="8" r="6" fill="none" stroke="var(--trace)" strokeWidth="1.5"/><line x1="14" y1="8" x2="36" y2="8" stroke="var(--trace)" strokeWidth="1" strokeDasharray="4 3"/><circle cx="42" cy="8" r="6" fill="none" stroke="var(--confirmed)" strokeWidth="1.5"/></svg>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", letterSpacing:"0.12em" }}>LOADING CIRCUIT…</span>
      </div>
    </div>
  );

  if (error || !subject) return (
    <div style={{ padding:"60px 72px" }}>
      <p style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--contradicted)" }}>FAULT: {error ?? "Subject not found"}</p>
    </div>
  );

  const stakeGEN = (Number(subject.stake_per_player)/1e18).toFixed(4);
  const potGEN   = (Number(subject.gross_pot)/1e18).toFixed(4);
  const isPlayer = myInfo?.joined ?? false;
  const canJoin  = address && !isPlayer && (subject.status==="OPEN" || subject.status==="COMMITTED");
  const canWithdraw = address && isPlayer && !myInfo?.withdrawn &&
    (subject.status==="CLAIMABLE"||subject.status==="REFUNDED") && Number(myInfo?.payout??"0")>0;
  const statusCol = STATUS_COLORS[subject.status] ?? "var(--muted)";

  return (
    <div style={{ padding:"48px 72px", maxWidth:960 }}>
      <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.1em", marginBottom:32 }}>
        <Link href="/" style={{ color:"var(--sub)" }}>OBSERVATORY</Link>
        <span style={{ color:"var(--trace)" }}> → </span>
        CIRCUIT #{id}
      </p>

      {/* Title */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:32, marginBottom:40 }}>
        <div style={{ flex:1 }}>
          {subject.entity && <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.12em", marginBottom:10 }}>{subject.entity}</p>}
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(22px,3vw,36px)", fontWeight:800, lineHeight:1.15, letterSpacing:"-0.01em", color:"var(--text)" }}>
            {subject.title}
          </h1>
        </div>
        <div style={{ flexShrink:0, padding:"8px 16px", border:`1px solid ${statusCol}`, fontFamily:"var(--font-mono)", fontSize:9, letterSpacing:"0.12em", color:statusCol, whiteSpace:"nowrap" }}>
          {subject.status.replace(/_/g," ")}
        </div>
      </div>

      {subject.description && (
        <p style={{ fontFamily:"var(--font-body)", fontSize:15, color:"var(--sub)", lineHeight:1.7, marginBottom:40, maxWidth:680 }}>{subject.description}</p>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:2, marginBottom:40 }}>
        {[["PLAYERS",`${subject.player_count}/${subject.max_players}`],["STAKE",`${stakeGEN} GEN`],["POT",`${potGEN} GEN`],["WINDOW",`${subject.obs_start} → ${subject.obs_end}`]].map(([l,v])=>(
          <div key={l} style={{ padding:"16px 20px", background:"var(--deep)", border:"1px solid var(--border)", borderTop:"2px solid var(--trace)" }}>
            <p style={{ fontFamily:"var(--font-mono)", fontSize:8, color:"var(--muted)", letterSpacing:"0.15em", marginBottom:6 }}>{l}</p>
            <p style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--text)" }}>{v}</p>
          </div>
        ))}
      </div>

      {/* Players */}
      <div style={{ marginBottom:40 }}>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:14 }}>Participants</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {players.map((addr,i)=>{
            const isMe = addr.toLowerCase()===address?.toLowerCase();
            const col = PLAYER_COLORS[i%6];
            return (
              <div key={addr} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:"var(--deep)", border:`1px solid ${col}22` }}>
                <div style={{ width:8,height:8,borderRadius:"50%",border:`1.5px solid ${col}`,background:isMe?col:"transparent" }}/>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:isMe?"var(--text)":"var(--sub)" }}>
                  {addr.slice(0,8)}…{addr.slice(-4)}{isMe&&" (you)"}
                </span>
              </div>
            );
          })}
          {players.length===0 && <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)" }}>No participants yet.</p>}
        </div>
      </div>

      {txPhase!=="idle" && <div style={{ marginBottom:24 }}><TxSpinner phase={txPhase} error={txError}/></div>}

      {/* Actions */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {canJoin && <button onClick={()=>tx(c=>c.joinCircuit(id,subject.stake_per_player))} style={{ fontFamily:"var(--font-mono)",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",padding:"12px 28px",background:"var(--confirmed)",color:"var(--void)",border:"none",cursor:"pointer" }}>Join — {stakeGEN} GEN</button>}
        {isPlayer&&(subject.status==="COMMITTED"||subject.status==="OBSERVATION_ACTIVE")&&<Link href={`/subjects/${id}/build`} style={{ fontFamily:"var(--font-mono)",fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",padding:"12px 24px",border:"1px solid var(--confirmed)",color:"var(--confirmed)",display:"inline-block" }}>Build Lattice →</Link>}
        {(subject.status==="REVEAL_WINDOW"||subject.status==="OBSERVATION_ACTIVE")&&<button onClick={()=>tx(c=>c.requestResolution(id))} style={{ fontFamily:"var(--font-mono)",fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",padding:"12px 24px",border:"1px solid var(--border)",color:"var(--sub)",background:"transparent",cursor:"pointer" }}>Request Resolution</button>}
        {(subject.status==="PROVISIONAL_SCORES"||subject.status==="APPEAL_WINDOW")&&address&&<button onClick={()=>tx(c=>c.finalizeSubject(id))} style={{ fontFamily:"var(--font-mono)",fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",padding:"12px 24px",border:"1px solid var(--border)",color:"var(--sub)",background:"transparent",cursor:"pointer" }}>Finalize & Settle</button>}
        {canWithdraw&&<button onClick={()=>tx(c=>c.withdraw(id))} style={{ fontFamily:"var(--font-mono)",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",padding:"12px 28px",background:"var(--confirmed)",color:"var(--void)",border:"none",cursor:"pointer" }}>Withdraw {(Number(myInfo?.payout??"0")/1e18).toFixed(4)} GEN</button>}
        {subject.status==="PROVISIONAL_SCORES"&&<Link href={`/subjects/${id}/resolution`} style={{ fontFamily:"var(--font-mono)",fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",padding:"12px 24px",border:"1px solid var(--border)",color:"var(--sub)",display:"inline-block" }}>Resolution Theatre →</Link>}
        {subject.status==="CLAIMABLE"&&<Link href={`/subjects/${id}/certificate`} style={{ fontFamily:"var(--font-mono)",fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",padding:"12px 24px",border:"1px solid var(--border)",color:"var(--sub)",display:"inline-block" }}>Score Certificate →</Link>}
      </div>

      {!address&&<p style={{ fontFamily:"var(--font-mono)",fontSize:10,color:"var(--muted)",marginTop:20 }}>Connect your wallet to participate.</p>}
    </div>
  );
}
