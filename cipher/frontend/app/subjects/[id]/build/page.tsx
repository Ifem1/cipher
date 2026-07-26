"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircuitCanvas } from "@/components/circuit/CircuitCanvas";
import { WeightBalance } from "@/components/circuit/WeightBalance";
import { TxSpinner } from "@/components/ui/TxSpinner";
import { Lattice, LatticeNode, validateLattice, canonicalize, computeCommitment, generateSalt } from "@/lib/circuit/lattice";
import { NodeType, TxPhase } from "@/lib/genlayer/status";
import { CipherContractClient } from "@/lib/genlayer/contract";
import { useWallet } from "@/lib/wallet/WalletContext";
import Link from "next/link";
import { errorMessage } from "@/lib/errors";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";
const NODE_TYPES: NodeType[] = ["TERMINAL", "CONJUNCTIVE", "DISJUNCTIVE", "CONDITIONAL", "INVERSE"];

interface RevealData {
  canonical: string;
  salt: string;
}

let _nodeCounter = 0;
function freshId() { return `n${++_nodeCounter}`; }

export default function CircuitBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { address } = useWallet();

  const [lattice, setLattice] = useState<Lattice>({ nodes: [], edges: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [txPhase, setTxPhase] = useState<TxPhase>("idle");
  const [txError, setTxError] = useState<string | undefined>();
  const [committed, setCommitted] = useState(false);

  // Load from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem(`cipher:lattice:${id}:${address}`);
    if (!saved) return;
    const timer = window.setTimeout(() => {
      try { setLattice(JSON.parse(saved) as Lattice); } catch {}
    }, 0);
    return () => window.clearTimeout(timer);
  }, [id, address]);

  function saveLattice(l: Lattice) {
    setLattice(l);
    if (address) localStorage.setItem(`cipher:lattice:${id}:${address}`, JSON.stringify(l));
  }

  function addNode(type: NodeType) {
    const col = lattice.nodes.length % 5;
    const row = Math.floor(lattice.nodes.length / 5);
    const node: LatticeNode = {
      id: freshId(),
      type,
      weight: 0,
      x: 2 + col * 2,
      y: 2 + row * 2,
      ...(type === "TERMINAL" ? { claim: "" } : {}),
    };
    saveLattice({ ...lattice, nodes: [...lattice.nodes, node] });
    setSelectedId(node.id);
  }

  function updateNode(updated: LatticeNode) {
    saveLattice({
      ...lattice,
      nodes: lattice.nodes.map((n) => (n.id === updated.id ? updated : n)),
    });
  }

  function removeNode(nodeId: string) {
    saveLattice({
      nodes: lattice.nodes.filter((n) => n.id !== nodeId),
      edges: lattice.edges.filter((e) => e.from !== nodeId && e.to !== nodeId),
    });
    setSelectedId(null);
  }

  function addEdge(from: string, to: string) {
    if (from === to) return;
    if (lattice.edges.some((e) => e.from === from && e.to === to)) return;
    saveLattice({ ...lattice, edges: [...lattice.edges, { from, to }] });
  }

  function checkValidation() {
    const result = validateLattice(lattice);
    setValidation(result);
    return result;
  }

  async function handleCommit() {
    if (!address) return;
    const result = checkValidation();
    if (!result.valid) return;

    setTxPhase("sign");
    setTxError(undefined);

    try {
      const canonical = canonicalize(lattice);
      const salt = generateSalt();
      const commitment = await computeCommitment(canonical, salt);

      // Save recovery package
      const recovery = { lattice: canonical, salt, commitment, subject_id: id, player: address };
      const blob = new Blob([JSON.stringify(recovery, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cipher-recovery-${id}-${address.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      const client = new CipherContractClient(CONTRACT_ADDRESS, address);
      setTxPhase("transmit");
      await client.commitLattice(id, commitment);

      // Store reveal data for later
      localStorage.setItem(`cipher:reveal:${id}:${address}`, JSON.stringify({ canonical, salt, commitment }));

      setTxPhase("accepted");
      setCommitted(true);
    } catch (e: unknown) {
      setTxPhase("failed");
      setTxError(errorMessage(e, "Commit failed."));
    }
  }

  async function handleReveal() {
    if (!address) return;
    const revealData = localStorage.getItem(`cipher:reveal:${id}:${address}`);
    if (!revealData) { setTxError("No reveal data found — use your recovery JSON."); return; }

    const { canonical, salt } = JSON.parse(revealData) as RevealData;
    setTxPhase("sign");
    setTxError(undefined);
    try {
      const client = new CipherContractClient(CONTRACT_ADDRESS, address);
      setTxPhase("transmit");
      await client.revealLattice(id, canonical, salt);
      setTxPhase("accepted");
      setTimeout(() => router.push(`/subjects/${id}`), 1200);
    } catch (e: unknown) {
      setTxPhase("failed");
      setTxError(errorMessage(e, "Reveal failed."));
    }
  }

  const totalWeight = lattice.nodes.reduce((s, n) => s + n.weight, 0);
  const selectedNode = selectedId ? lattice.nodes.find((n) => n.id === selectedId) ?? null : null;

  return (
    <div style={{ padding: "24px 24px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, maxWidth: 1100 }}>
      {/* Left: canvas */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--sub)" }}>
              <Link href={`/subjects/${id}`} style={{ color: "var(--muted)" }}>#{id}</Link>
              {" → "}Circuit Builder
            </p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginTop: 4 }}>Build Your Lattice</h1>
          </div>
        </div>

        <CircuitCanvas
          lattice={lattice}
          selectedNodeId={selectedId}
          onSelectNode={(nid) => {
            setSelectedId(nid);
          }}
        />

        {/* Add node buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {NODE_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => addNode(t)}
              style={{
                fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em",
                padding: "6px 12px", borderRadius: 4,
                border: "1px solid var(--border)", background: "var(--raised)", color: "var(--sub)",
                cursor: "pointer", textTransform: "uppercase",
              }}
            >
              + {t.slice(0, 4)}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Inspector */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <WeightBalance total={totalWeight} />

        {/* Validation */}
        {validation && (
          <div style={{ padding: "12px 16px", background: "var(--raised)", border: `1px solid ${validation.valid ? "var(--confirmed)" : "var(--contradicted)"}`, borderRadius: 8 }}>
            {validation.valid ? (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--confirmed)" }}>✓ Lattice valid</p>
            ) : (
              <ul style={{ listStyle: "none" }}>
                {validation.errors.map((e, i) => (
                  <li key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--contradicted)", marginBottom: 4 }}>× {e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Node editor */}
        {selectedNode && (
          <div style={{ padding: "16px", background: "var(--raised)", border: "1px solid var(--border)", borderRadius: 8 }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--confirmed)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Node — {selectedNode.type}
            </p>

            <label style={labelStyle}>Weight (0–100)</label>
            <input
              type="number" min={0} max={100}
              value={selectedNode.weight}
              onChange={(e) => updateNode({ ...selectedNode, weight: Number(e.target.value) })}
              style={inputSm}
            />

            {selectedNode.type === "TERMINAL" && (
              <>
                <label style={labelStyle}>Claim</label>
                <textarea
                  value={selectedNode.claim ?? ""}
                  onChange={(e) => updateNode({ ...selectedNode, claim: e.target.value })}
                  rows={3}
                  placeholder="What specific claim should be resolved?"
                  style={{ ...inputSm, resize: "vertical" }}
                />
              </>
            )}

            {/* Edge connections */}
            {lattice.nodes.filter((n) => n.id !== selectedNode.id).length > 0 && (
              <>
                <label style={{ ...labelStyle, marginTop: 12 }}>Add edge from</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {lattice.nodes
                    .filter((n) => n.id !== selectedNode.id)
                    .map((n) => (
                      <button
                        key={n.id}
                        onClick={() => addEdge(n.id, selectedNode.id)}
                        style={{ fontFamily: "var(--font-mono)", fontSize: 9, padding: "4px 8px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--sub)", cursor: "pointer" }}
                      >
                        {n.id} ({n.type.slice(0, 3)})
                      </button>
                    ))}
                </div>
              </>
            )}

            <button
              onClick={() => removeNode(selectedNode.id)}
              style={{ marginTop: 12, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--contradicted)", padding: "6px 12px", border: "1px solid var(--contradicted)", borderRadius: 4, background: "transparent", cursor: "pointer", width: "100%" }}
            >
              Remove Node
            </button>
          </div>
        )}

        {/* Commit/Reveal actions */}
        <TxSpinner phase={txPhase} error={txError} />

        {!committed ? (
          <button
            onClick={handleCommit}
            disabled={txPhase === "transmit" || txPhase === "propagate"}
            style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, padding: "12px 20px", borderRadius: 6, background: "var(--confirmed)", color: "var(--void)", border: "none", cursor: "pointer" }}
          >
            Validate & Commit Lattice
          </button>
        ) : (
          <button
            onClick={handleReveal}
            disabled={txPhase === "transmit" || txPhase === "propagate"}
            style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, padding: "12px 20px", borderRadius: 6, background: "var(--partial)", color: "var(--void)", border: "none", cursor: "pointer" }}
          >
            Reveal Lattice
          </button>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-mono)",
  fontSize: 9,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 4,
};

const inputSm: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  color: "var(--text)",
  fontFamily: "var(--font-body)",
  fontSize: 13,
  marginBottom: 10,
};
