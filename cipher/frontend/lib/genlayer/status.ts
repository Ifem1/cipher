export type TxPhase =
  | "idle"
  | "sign"
  | "transmit"
  | "propagate"
  | "accepted"
  | "failed";

export interface TxStatus {
  phase: TxPhase;
  hash?: string;
  error?: string;
}

export const TX_PHASE_LABEL: Record<TxPhase, string> = {
  idle: "Ready",
  sign: "Sign in wallet…",
  transmit: "Transmitting…",
  propagate: "Awaiting consensus…",
  accepted: "Accepted",
  failed: "Failed",
};

export type SubjectStatus =
  | "OPEN"
  | "COMMITTED"
  | "REVIEW_PENDING"
  | "OBSERVATION_ACTIVE"
  | "REVEAL_WINDOW"
  | "RESOLUTION_PENDING"
  | "PROVISIONAL_SCORES"
  | "APPEAL_WINDOW"
  | "APPEAL_PENDING"
  | "FINALIZED"
  | "CLAIMABLE"
  | "CLOSED"
  | "CANCELLED"
  | "INSUFFICIENT_EVIDENCE"
  | "REFUNDED";

export type NodeType =
  | "TERMINAL"
  | "CONDITIONAL"
  | "INVERSE"
  | "CONJUNCTIVE"
  | "DISJUNCTIVE";

export type NodeOutcome =
  | "CONFIRMED"
  | "SUBSTANTIALLY_CONFIRMED"
  | "PARTIALLY_CONFIRMED"
  | "CONTRADICTED"
  | "UNRESOLVABLE"
  | "PENDING";

export const OUTCOME_MULTIPLIER: Record<string, number> = {
  CONFIRMED: 1.0,
  SUBSTANTIALLY_CONFIRMED: 0.8,
  PARTIALLY_CONFIRMED: 0.4,
  CONTRADICTED: 0.0,
  UNRESOLVABLE: 0,
};

export const OUTCOME_COLOR: Record<string, string> = {
  CONFIRMED: "var(--confirmed)",
  SUBSTANTIALLY_CONFIRMED: "var(--partial)",
  PARTIALLY_CONFIRMED: "var(--partial)",
  CONTRADICTED: "var(--contradicted)",
  UNRESOLVABLE: "var(--muted)",
  PENDING: "var(--border)",
};
