import { NodeType } from "../genlayer/status";

export interface LatticeNode {
  id: string;
  type: NodeType;
  weight: number;
  claim?: string;
  label?: string;
  x?: number;
  y?: number;
}

export interface LatticeEdge {
  from: string;
  to: string;
}

export interface Lattice {
  nodes: LatticeNode[];
  edges: LatticeEdge[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Validate a lattice before committing. */
export function validateLattice(lattice: Lattice): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (lattice.nodes.length < 3) errors.push("Minimum 3 nodes required.");
  if (lattice.nodes.length > 7) errors.push("Maximum 7 nodes allowed.");

  const ids = lattice.nodes.map((n) => n.id);
  if (ids.length !== new Set(ids).size) errors.push("Duplicate node IDs found.");

  const weightSum = lattice.nodes.reduce((s, n) => s + n.weight, 0);
  if (weightSum !== 100) errors.push(`Weights must sum to 100 (currently ${weightSum}).`);

  const idSet = new Set(ids);
  for (const edge of lattice.edges) {
    if (!idSet.has(edge.from)) errors.push(`Edge references unknown node: ${edge.from}`);
    if (!idSet.has(edge.to)) errors.push(`Edge references unknown node: ${edge.to}`);
  }

  // Parent counts per node
  const parentCounts: Record<string, number> = {};
  for (const id of ids) parentCounts[id] = 0;
  for (const edge of lattice.edges) parentCounts[edge.to]++;

  for (const node of lattice.nodes) {
    const count = parentCounts[node.id];
    if (node.type === "TERMINAL") {
      if (count !== 0) errors.push(`TERMINAL node ${node.id} must have no parents.`);
      if (!node.claim) errors.push(`TERMINAL node ${node.id} needs a claim text.`);
    } else if (node.type === "INVERSE") {
      if (count !== 1) errors.push(`INVERSE node ${node.id} needs exactly 1 parent.`);
    } else if (node.type === "CONJUNCTIVE" || node.type === "DISJUNCTIVE") {
      if (count < 2) errors.push(`${node.type} node ${node.id} needs ≥ 2 parents.`);
    } else if (node.type === "CONDITIONAL") {
      if (count < 1) errors.push(`CONDITIONAL node ${node.id} needs ≥ 1 parent.`);
    }
  }

  // Cycle detection
  if (hasCycle(lattice)) errors.push("Cycle detected in lattice graph.");

  return { valid: errors.length === 0, errors, warnings };
}

function hasCycle(lattice: Lattice): boolean {
  const children: Record<string, string[]> = {};
  for (const node of lattice.nodes) children[node.id] = [];
  for (const edge of lattice.edges) children[edge.from].push(edge.to);

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(id: string): boolean {
    visited.add(id);
    inStack.add(id);
    for (const child of children[id] || []) {
      if (!visited.has(child) && dfs(child)) return true;
      if (inStack.has(child)) return true;
    }
    inStack.delete(id);
    return false;
  }

  for (const node of lattice.nodes) {
    if (!visited.has(node.id) && dfs(node.id)) return true;
  }
  return false;
}

/** Generate a SHA-256 commitment hash from lattice JSON + salt. */
export async function computeCommitment(latticeJson: string, salt: string): Promise<string> {
  const payload = new TextEncoder().encode(latticeJson + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", payload);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return "0x" + hex;
}

/** Generate a cryptographically random salt. */
export function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Serialize lattice to canonical JSON (sorted keys). */
export function canonicalize(lattice: Lattice): string {
  return JSON.stringify({
    nodes: lattice.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      weight: n.weight,
      ...(n.claim ? { claim: n.claim } : {}),
    })),
    edges: lattice.edges.map((e) => ({ from: e.from, to: e.to })),
  });
}

/** Topological sort for propagation visualization. */
export function topoSort(lattice: Lattice): string[] {
  const inDegree: Record<string, number> = {};
  const children: Record<string, string[]> = {};
  for (const node of lattice.nodes) {
    inDegree[node.id] = 0;
    children[node.id] = [];
  }
  for (const edge of lattice.edges) {
    inDegree[edge.to]++;
    children[edge.from].push(edge.to);
  }

  const queue = Object.entries(inDegree)
    .filter(([, d]) => d === 0)
    .map(([id]) => id);
  const order: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const child of children[id]) {
      inDegree[child]--;
      if (inDegree[child] === 0) queue.push(child);
    }
  }

  return order;
}
