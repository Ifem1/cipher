import { createCipherClient, CipherClient } from "./client";

export interface Subject {
  id: string;
  status: string;
  title: string;
  description: string;
  entity: string;
  proposer: string;
  stake_per_player: string;
  min_players: number;
  max_players: number;
  player_count: number;
  gross_pot: string;
  obs_start: string;
  obs_end: string;
}

export interface PlayerInfo {
  joined: boolean;
  committed: boolean;
  revealed: boolean;
  score: number;
  payout: string;
  withdrawn: boolean;
  appeal_filed: boolean;
}

export interface WithdrawableInfo {
  amount: string;
  withdrawn: boolean;
  joined: boolean;
}

export class CipherContractClient {
  private client: CipherClient;
  private addr: `0x${string}`;

  constructor(contractAddress: string, playerAddress?: string) {
    this.addr = contractAddress as `0x${string}`;
    this.client = createCipherClient(playerAddress);
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async read<T>(functionName: string, args: any[] = []): Promise<T> {
    const result = await (this.client.readContract({
      address: this.addr,
      functionName,
      args,
    }) as Promise<unknown>);
    return result as T;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async write(functionName: string, args: any[] = [], value = BigInt(0)): Promise<string> {
    const hash = await (this.client.writeContract({
      address: this.addr,
      functionName,
      args,
      value,
    }) as Promise<string>);
    await (this.client.waitForTransactionReceipt as (o: Record<string, unknown>) => Promise<unknown>)({
      hash,
      status: "ACCEPTED",
      retries: 24,
      interval: 5000,
    });
    return hash;
  }

  // ── Read methods ────────────────────────────────────────────────────────────

  getSubject(subjectId: string) { return this.read<Subject>("get_subject", [subjectId]); }
  getAllSubjects() { return this.read<Subject[]>("get_all_subjects"); }
  getConstitution(subjectId: string) { return this.read<Record<string, unknown>>("get_constitution", [subjectId]); }
  getPlayerList(subjectId: string) { return this.read<string[]>("get_player_list", [subjectId]); }
  getLattice(subjectId: string, playerAddress: string) { return this.read<Record<string, unknown>>("get_lattice", [subjectId, playerAddress]); }
  getResolutionReport(subjectId: string) { return this.read<Record<string, unknown>>("get_resolution_report", [subjectId]); }
  getAdjudicationReport(subjectId: string) { return this.read<Record<string, unknown>>("get_adjudication_report", [subjectId]); }
  getPlayerInfo(subjectId: string, playerAddress: string) { return this.read<PlayerInfo>("get_player_info", [subjectId, playerAddress]); }
  getPayoutDistribution(subjectId: string) { return this.read<Record<string, string>>("get_payout_distribution", [subjectId]); }
  getWithdrawable(subjectId: string, playerAddress: string) { return this.read<WithdrawableInfo>("get_withdrawable", [subjectId, playerAddress]); }
  getContractBalance() { return this.read<string>("get_contract_balance"); }

  // ── Write methods ───────────────────────────────────────────────────────────

  createSubject(params: {
    title: string; description: string; entity: string;
    obs_start: string; obs_end: string;
    min_players: number; max_players: number;
    stake_wei: string; constitution_json: string;
  }) {
    return this.write("create_subject", [
      params.title, params.description, params.entity,
      params.obs_start, params.obs_end,
      params.min_players, params.max_players,
      params.stake_wei, params.constitution_json,
    ]);
  }

  joinCircuit(subjectId: string, stakeWei: string) { return this.write("join_circuit", [subjectId], BigInt(stakeWei)); }
  commitLattice(subjectId: string, commitmentHash: string) { return this.write("commit_lattice", [subjectId, commitmentHash]); }
  revealLattice(subjectId: string, latticeJson: string, salt: string) { return this.write("reveal_lattice", [subjectId, latticeJson, salt]); }
  submitForReview(subjectId: string) { return this.write("submit_for_review", [subjectId]); }
  requestResolution(subjectId: string) { return this.write("request_resolution", [subjectId]); }
  submitAppeal(subjectId: string, bondWei: string) { return this.write("submit_appeal", [subjectId], BigInt(bondWei)); }
  finalizeSubject(subjectId: string) { return this.write("finalize_subject", [subjectId]); }
  withdraw(subjectId: string) { return this.write("withdraw", [subjectId]); }
  cancelSubject(subjectId: string) { return this.write("cancel_subject", [subjectId]); }
  refundUnderfilledSubject(subjectId: string) { return this.write("refund_underfilled_subject", [subjectId]); }
  refundInsufficientEvidence(subjectId: string) { return this.write("refund_insufficient_evidence", [subjectId]); }
}
