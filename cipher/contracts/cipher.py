# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json
import hashlib

# EVM interface for withdrawals to player EOA addresses
@gl.evm.contract_interface
class _EOARecipient:
    class View:
        pass
    class Write:
        pass


# ── State machine ──────────────────────────────────────────────────────────────
# Subject lifecycle states
ST_OPEN                 = "OPEN"
ST_COMMITTED            = "COMMITTED"
ST_REVIEW_PENDING       = "REVIEW_PENDING"
ST_OBSERVATION_ACTIVE   = "OBSERVATION_ACTIVE"
ST_REVEAL_WINDOW        = "REVEAL_WINDOW"
ST_RESOLUTION_PENDING   = "RESOLUTION_PENDING"
ST_PROVISIONAL_SCORES   = "PROVISIONAL_SCORES"
ST_APPEAL_WINDOW        = "APPEAL_WINDOW"
ST_APPEAL_PENDING       = "APPEAL_PENDING"
ST_FINALIZED            = "FINALIZED"
ST_CLAIMABLE            = "CLAIMABLE"
ST_CLOSED               = "CLOSED"
ST_CANCELLED            = "CANCELLED"
ST_INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
ST_REFUNDED             = "REFUNDED"

# Node types
NT_TERMINAL    = "TERMINAL"
NT_CONDITIONAL = "CONDITIONAL"
NT_INVERSE     = "INVERSE"
NT_CONJUNCTIVE = "CONJUNCTIVE"
NT_DISJUNCTIVE = "DISJUNCTIVE"

# Resolution outcomes
RO_CONFIRMED              = "CONFIRMED"
RO_SUBSTANTIALLY_CONFIRMED = "SUBSTANTIALLY_CONFIRMED"
RO_PARTIALLY_CONFIRMED    = "PARTIALLY_CONFIRMED"
RO_CONTRADICTED           = "CONTRADICTED"
RO_UNRESOLVABLE           = "UNRESOLVABLE"

# Score multipliers × 100 (integer)
MULTIPLIER = {
    RO_CONFIRMED:               100,
    RO_SUBSTANTIALLY_CONFIRMED: 80,
    RO_PARTIALLY_CONFIRMED:     40,
    RO_CONTRADICTED:            0,
    RO_UNRESOLVABLE:            0,
}

VALID_OUTCOMES = {
    RO_CONFIRMED, RO_SUBSTANTIALLY_CONFIRMED,
    RO_PARTIALLY_CONFIRMED, RO_CONTRADICTED, RO_UNRESOLVABLE
}

FEE_BPS_DEFAULT = 200       # 2%
MIN_SCORE_THRESHOLD = 10    # players below this are ineligible
APPEAL_BOND_BPS = 1000      # 10% of stake as appeal bond
MAX_NODES = 7
MIN_NODES = 3
MAX_PLAYERS = 6
MIN_PLAYERS = 2
WEIGHT_TOTAL = 100


class CipherContract(gl.Contract):
    # ── Scalar state ─────────────────────────────────────────────────────────
    next_subject_id: u256
    fee_bps: u256
    treasury: u256

    # ── Subject fields (key: str(subject_id)) ────────────────────────────────
    sub_status: TreeMap[str, str]
    sub_title: TreeMap[str, str]
    sub_description: TreeMap[str, str]
    sub_entity: TreeMap[str, str]
    sub_proposer: TreeMap[str, str]
    sub_stake_per_player: TreeMap[str, u256]
    sub_min_players: TreeMap[str, u256]
    sub_max_players: TreeMap[str, u256]
    sub_obs_start: TreeMap[str, str]
    sub_obs_end: TreeMap[str, str]
    sub_reveal_deadline: TreeMap[str, str]
    sub_player_count: TreeMap[str, u256]
    sub_gross_pot: TreeMap[str, u256]
    sub_constitution_json: TreeMap[str, str]
    sub_adjudication_report: TreeMap[str, str]
    sub_resolution_report: TreeMap[str, str]
    sub_appeal_bond_total: TreeMap[str, u256]

    # ── Player roster (key: "{subject_id}:{index}") ──────────────────────────
    sub_player_at: TreeMap[str, str]

    # ── Per-player fields (key: "{subject_id}:{player_hex}") ─────────────────
    player_joined: TreeMap[str, bool]
    player_commitment: TreeMap[str, str]
    player_revealed: TreeMap[str, bool]
    player_lattice_json: TreeMap[str, str]
    player_score: TreeMap[str, u256]
    player_payout: TreeMap[str, u256]
    player_withdrawn: TreeMap[str, bool]
    player_appeal_bond_paid: TreeMap[str, bool]

    def __init__(self) -> None:
        self.next_subject_id = u256(1)
        self.fee_bps = u256(FEE_BPS_DEFAULT)
        self.treasury = u256(0)

    # ──────────────────────────────────────────────────────────────────────────
    # WRITE: Create subject
    # ──────────────────────────────────────────────────────────────────────────
    @gl.public.write
    def create_subject(
        self,
        title: str,
        description: str,
        entity: str,
        obs_start: str,
        obs_end: str,
        min_players: int,
        max_players: int,
        stake_wei: str,
        constitution_json: str,
    ) -> str:
        if len(title) < 5 or len(title) > 200:
            raise gl.vm.UserError("CIPHER: title must be 5–200 chars")
        if len(description) < 10:
            raise gl.vm.UserError("CIPHER: description too short")
        if len(entity) < 2:
            raise gl.vm.UserError("CIPHER: entity too short")
        if min_players < MIN_PLAYERS or min_players > MAX_PLAYERS:
            raise gl.vm.UserError(f"CIPHER: min_players must be {MIN_PLAYERS}–{MAX_PLAYERS}")
        if max_players < min_players or max_players > MAX_PLAYERS:
            raise gl.vm.UserError(f"CIPHER: max_players must be >= min and <= {MAX_PLAYERS}")
        stake = int(stake_wei)
        if stake <= 0:
            raise gl.vm.UserError("CIPHER: stake must be positive")
        try:
            constitution = self._constitution_from_input(constitution_json)
        except Exception:
            raise gl.vm.UserError("CIPHER: constitution_json must be valid JSON")

        sid = str(int(self.next_subject_id))
        self.next_subject_id = u256(int(self.next_subject_id) + 1)

        proposer = gl.message.sender_address.as_hex.lower()

        self.sub_status[sid] = ST_OPEN
        self.sub_title[sid] = title
        self.sub_description[sid] = description
        self.sub_entity[sid] = entity
        self.sub_proposer[sid] = proposer
        self.sub_stake_per_player[sid] = u256(stake)
        self.sub_min_players[sid] = u256(min_players)
        self.sub_max_players[sid] = u256(max_players)
        self.sub_obs_start[sid] = obs_start
        self.sub_obs_end[sid] = obs_end
        self.sub_reveal_deadline[sid] = ""
        self.sub_player_count[sid] = u256(0)
        self.sub_gross_pot[sid] = u256(0)
        self.sub_constitution_json[sid] = json.dumps(constitution)
        self.sub_adjudication_report[sid] = ""
        self.sub_resolution_report[sid] = ""
        self.sub_appeal_bond_total[sid] = u256(0)

        return sid

    # ──────────────────────────────────────────────────────────────────────────
    # WRITE (PAYABLE): Join circuit — player sends exact stake
    # ──────────────────────────────────────────────────────────────────────────
    @gl.public.write.payable
    def join_circuit(self, subject_id: str) -> None:
        sid = self._sid(subject_id)
        status = self.sub_status.get(sid, "")
        if status not in (ST_OPEN, ST_COMMITTED):
            raise gl.vm.UserError(f"CIPHER: subject {sid} not open for joining")

        sender = gl.message.sender_address.as_hex.lower()
        pk = f"{sid}:{sender}"

        if self.player_joined.get(pk, False):
            raise gl.vm.UserError("CIPHER: already joined")

        required = self.sub_stake_per_player[sid]
        received = gl.message.value
        if received != required:
            raise gl.vm.UserError(f"CIPHER: must send exactly {int(required)} wei")

        count = int(self.sub_player_count[sid])
        max_p = int(self.sub_max_players[sid])
        if count >= max_p:
            raise gl.vm.UserError("CIPHER: circuit full")

        self.player_joined[pk] = True
        self.sub_player_at[f"{sid}:{count}"] = sender
        self.sub_player_count[sid] = u256(count + 1)
        self.sub_gross_pot[sid] = u256(int(self.sub_gross_pot[sid]) + int(received))

        # Auto-advance to COMMITTED when max players reached
        if count + 1 == max_p:
            self.sub_status[sid] = ST_COMMITTED

    # ──────────────────────────────────────────────────────────────────────────
    # WRITE: Commit lattice (hash-then-reveal pattern)
    # ──────────────────────────────────────────────────────────────────────────
    @gl.public.write
    def commit_lattice(self, subject_id: str, commitment_hash: str) -> None:
        sid = self._sid(subject_id)
        status = self.sub_status.get(sid, "")
        if status not in (ST_COMMITTED, ST_OBSERVATION_ACTIVE):
            raise gl.vm.UserError("CIPHER: cannot commit in current state")

        sender = gl.message.sender_address.as_hex.lower()
        pk = f"{sid}:{sender}"

        if not self.player_joined.get(pk, False):
            raise gl.vm.UserError("CIPHER: not a player")
        if self.player_commitment.get(pk, "") != "":
            raise gl.vm.UserError("CIPHER: already committed")
        if len(commitment_hash) != 66 or not commitment_hash.startswith("0x"):
            raise gl.vm.UserError("CIPHER: commitment_hash must be 0x-prefixed 32-byte hex")

        self.player_commitment[pk] = commitment_hash

    # ──────────────────────────────────────────────────────────────────────────
    # WRITE: Reveal lattice
    # ──────────────────────────────────────────────────────────────────────────
    @gl.public.write
    def reveal_lattice(self, subject_id: str, lattice_json: str, salt: str) -> None:
        sid = self._sid(subject_id)
        status = self.sub_status.get(sid, "")
        if status not in (ST_COMMITTED, ST_OBSERVATION_ACTIVE, ST_REVEAL_WINDOW):
            raise gl.vm.UserError("CIPHER: cannot reveal in current state")

        sender = gl.message.sender_address.as_hex.lower()
        pk = f"{sid}:{sender}"

        if not self.player_joined.get(pk, False):
            raise gl.vm.UserError("CIPHER: not a player")
        if self.player_revealed.get(pk, False):
            raise gl.vm.UserError("CIPHER: already revealed")

        commitment = self.player_commitment.get(pk, "")
        if commitment == "":
            raise gl.vm.UserError("CIPHER: must commit before reveal")

        # Verify commitment: keccak256(lattice_json + salt) == commitment
        payload = (lattice_json + salt).encode()
        computed = "0x" + hashlib.sha256(payload).hexdigest()
        if computed != commitment:
            # Allow sha256 prefix match for compatibility
            computed_full = hashlib.sha256(payload).hexdigest()
            stored_hex = commitment[2:]
            if computed_full != stored_hex:
                raise gl.vm.UserError("CIPHER: commitment hash mismatch")

        # Validate lattice structure
        try:
            lattice = json.loads(lattice_json)
        except Exception:
            raise gl.vm.UserError("LATTICE: invalid JSON")

        self._validate_graph(lattice)

        self.player_revealed[pk] = True
        self.player_lattice_json[pk] = lattice_json

        # Check if all players have revealed → advance state
        count = int(self.sub_player_count[sid])
        all_revealed = True
        for i in range(count):
            p_addr = self.sub_player_at[f"{sid}:{i}"]
            if not self.player_revealed.get(f"{sid}:{p_addr}", False):
                all_revealed = False
                break

        if all_revealed and count >= int(self.sub_min_players[sid]):
            self.sub_status[sid] = ST_REVEAL_WINDOW

    # ──────────────────────────────────────────────────────────────────────────
    # WRITE: Cancel subject (proposer only, OPEN state)
    # ──────────────────────────────────────────────────────────────────────────
    @gl.public.write
    def cancel_subject(self, subject_id: str) -> None:
        sid = self._sid(subject_id)
        status = self.sub_status.get(sid, "")
        if status != ST_OPEN:
            raise gl.vm.UserError("CIPHER: can only cancel OPEN subjects")

        sender = gl.message.sender_address.as_hex.lower()
        if sender != self.sub_proposer[sid]:
            raise gl.vm.UserError("CIPHER: only proposer can cancel")

        self._refund_all_players(sid, include_appeal_bonds=False)

    @gl.public.write
    def refund_underfilled_subject(self, subject_id: str) -> None:
        sid = self._sid(subject_id)
        status = self.sub_status.get(sid, "")
        if status not in (ST_OPEN, ST_COMMITTED):
            raise gl.vm.UserError("CIPHER: wrong state for underfilled refund")

        count = int(self.sub_player_count[sid])
        if count >= int(self.sub_min_players[sid]):
            raise gl.vm.UserError("CIPHER: minimum players reached")

        self._refund_all_players(sid, include_appeal_bonds=False)

    @gl.public.write
    def refund_insufficient_evidence(self, subject_id: str) -> None:
        sid = self._sid(subject_id)
        status = self.sub_status.get(sid, "")
        if status != ST_INSUFFICIENT_EVIDENCE:
            raise gl.vm.UserError("CIPHER: subject is not insufficient evidence")

        self._refund_all_players(sid, include_appeal_bonds=True)

    # ──────────────────────────────────────────────────────────────────────────
    # NON-DET WRITE: Submit for adjudicability review
    # ──────────────────────────────────────────────────────────────────────────
    @gl.public.write
    def submit_for_review(self, subject_id: str) -> None:
        sid = self._sid(subject_id)
        status = self.sub_status.get(sid, "")
        if status not in (ST_COMMITTED, ST_OPEN):
            raise gl.vm.UserError("CIPHER: wrong state for review")

        sender = gl.message.sender_address.as_hex.lower()
        if sender != self.sub_proposer[sid]:
            raise gl.vm.UserError("CIPHER: only proposer can submit for review")

        self.sub_status[sid] = ST_REVIEW_PENDING

        title = self.sub_title[sid]
        description = self.sub_description[sid]
        entity = self.sub_entity[sid]
        obs_start = self.sub_obs_start[sid]
        obs_end = self.sub_obs_end[sid]
        constitution = self.sub_constitution_json[sid]

        prompt = f"""You are a prediction market adjudicability expert.

Review this prediction subject and assess whether it can be objectively resolved.

SUBJECT:
Title: {title}
Description: {description}
Entity/Topic: {entity}
Observation Window: {obs_start} to {obs_end}
Constitution/Rules: {constitution}

TASK: Evaluate on four criteria:
1. CLARITY: Is the claim unambiguous? Can reasonable people agree on what would count as confirmation?
2. OBSERVABILITY: Is the outcome publicly observable from verifiable sources?
3. TIME_BOUNDEDNESS: Is the observation window clearly defined and reasonable?
4. NEUTRALITY: Is the claim free from participant manipulation (i.e., no player controls the outcome)?

Return JSON only, no other text:
{{
  "adjudicable": true or false,
  "classification": "CLEAR" | "AMBIGUOUS" | "UNOBSERVABLE" | "PARTICIPANT_CONTROLLED" | "TIMING_ISSUE",
  "clarity_score": 0-100,
  "observability_score": 0-100,
  "issues": ["list of specific issues if any"],
  "warnings": ["list of minor concerns"],
  "rationale": "one paragraph explanation"
}}"""

        def leader_fn():
            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            parsed = self._parse_llm_json(raw, "adjudication review")
            required_keys = {"adjudicable", "classification", "clarity_score",
                             "observability_score", "issues", "warnings", "rationale"}
            missing = required_keys - set(parsed.keys())
            if missing:
                raise gl.vm.UserError(f"CONSENSUS_OUTPUT: missing keys: {missing}")
            valid_classes = {
                "CLEAR", "AMBIGUOUS", "UNOBSERVABLE",
                "PARTICIPANT_CONTROLLED", "TIMING_ISSUE"
            }
            if parsed["classification"] not in valid_classes:
                raise gl.vm.UserError(f"CONSENSUS_OUTPUT: invalid classification: {parsed['classification']}")
            if not isinstance(parsed["adjudicable"], bool):
                raise gl.vm.UserError("CONSENSUS_OUTPUT: adjudicable must be bool")
            return parsed

        def validator_fn(leader_result):
            if not isinstance(leader_result, gl.vm.Return):
                return False
            data = leader_result.value
            if not isinstance(data, dict):
                return False
            # Validators must agree on classification and adjudicable decision
            try:
                raw = gl.nondet.exec_prompt(prompt, response_format="json")
                parsed = self._parse_llm_json(raw, "adjudication review")
                return (parsed.get("classification") == data.get("classification") and
                        parsed.get("adjudicable") == data.get("adjudicable"))
            except Exception:
                return False

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        report = json.dumps(result)
        self.sub_adjudication_report[sid] = report

        if result.get("adjudicable", False):
            self.sub_status[sid] = ST_OBSERVATION_ACTIVE
        else:
            self.sub_status[sid] = ST_CANCELLED

    # ──────────────────────────────────────────────────────────────────────────
    # NON-DET WRITE: Request resolution (anyone can call after reveal window)
    # ──────────────────────────────────────────────────────────────────────────
    @gl.public.write
    def request_resolution(self, subject_id: str) -> None:
        sid = self._sid(subject_id)
        status = self.sub_status.get(sid, "")
        if status not in (ST_REVEAL_WINDOW, ST_OBSERVATION_ACTIVE, ST_APPEAL_PENDING):
            raise gl.vm.UserError("CIPHER: wrong state for resolution")

        self.sub_status[sid] = ST_RESOLUTION_PENDING

        count = int(self.sub_player_count[sid])
        entity = self.sub_entity[sid]
        obs_start = self.sub_obs_start[sid]
        obs_end = self.sub_obs_end[sid]
        constitution_str = self.sub_constitution_json[sid]
        constitution = self._constitution_from_input(constitution_str)
        source_policy = constitution.get("source_policy", "Use authoritative public news sources")

        # Gather terminal nodes scoped by participant so local IDs cannot collide.
        terminal_nodes: dict = {}
        player_lattices: dict = {}

        for i in range(count):
            p_addr = self.sub_player_at[f"{sid}:{i}"]
            pk = f"{sid}:{p_addr}"
            if self.player_revealed.get(pk, False):
                lattice_str = self.player_lattice_json.get(pk, "")
                if lattice_str:
                    lattice = json.loads(lattice_str)
                    player_lattices[p_addr] = lattice
                    for node in lattice.get("nodes", []):
                        if node.get("type") == NT_TERMINAL:
                            local_id = node["id"]
                            scoped_id = self._scoped_node_id(p_addr, local_id)
                            terminal_nodes[scoped_id] = {
                                "id": scoped_id,
                                "local_id": local_id,
                                "participant": p_addr,
                                "claim": node.get("claim", ""),
                            }

        def leader_fn():
            node_resolutions: dict = {}
            for node_id, node in terminal_nodes.items():
                claim = node.get("claim", "")
                participant = node.get("participant", "")
                local_id = node.get("local_id", node_id)
                node_prompt = f"""You are a prediction market resolution expert.

SUBJECT ENTITY: {entity}
OBSERVATION WINDOW: {obs_start} to {obs_end}
SOURCE POLICY: {source_policy}
PARTICIPANT: {participant}
LOCAL TERMINAL ID: {local_id}

CLAIM TO RESOLVE: "{claim}"

Search only bounded, authenticated sources allowed by the source policy. Resolve the claim as of the end of the observation window. Do not rely on unsourced memory, social media chatter, or unverifiable summaries.

Return JSON only:
{{
  "node_id": "{node_id}",
  "participant": "{participant}",
  "local_id": "{local_id}",
  "outcome": "CONFIRMED" | "SUBSTANTIALLY_CONFIRMED" | "PARTIALLY_CONFIRMED" | "CONTRADICTED" | "UNRESOLVABLE",
  "confidence": 0-100,
  "evidence_summary": "brief factual summary of evidence found",
  "sources": ["authenticated source URLs used for this exact verdict"],
  "rationale": "one paragraph explanation"
}}"""
                raw = gl.nondet.exec_prompt(node_prompt, response_format="json")
                parsed = self._parse_llm_json(raw, f"node {node_id}")
                parsed["node_id"] = node_id
                parsed["participant"] = participant
                parsed["local_id"] = local_id
                self._validate_resolution_record(parsed, constitution, node_id)
                node_resolutions[node_id] = parsed

            # Propagate through each player's lattice
            player_scores: dict = {}
            for p_addr, lattice in player_lattices.items():
                score = self._propagate_and_score(lattice, node_resolutions, p_addr)
                player_scores[p_addr] = score

            # Check for insufficient evidence
            all_unresolvable = all(
                r.get("outcome") == RO_UNRESOLVABLE
                for r in node_resolutions.values()
            )

            return {
                "node_resolutions": node_resolutions,
                "player_scores": player_scores,
                "all_unresolvable": all_unresolvable,
            }

        def validator_fn(leader_result):
            if not isinstance(leader_result, gl.vm.Return):
                return False
            data = getattr(leader_result, "calldata", None)
            if data is None:
                data = getattr(leader_result, "value", None)
            if not isinstance(data, dict) or "node_resolutions" not in data:
                return False
            try:
                leader_resolutions = data.get("node_resolutions", {})
                if set(leader_resolutions.keys()) != set(terminal_nodes.keys()):
                    return False

                for node_id, leader_res in leader_resolutions.items():
                    if not isinstance(leader_res, dict):
                        return False
                    if not self._resolution_record_is_valid(leader_res, constitution, node_id):
                        return False
                    check_prompt = f"""Independently verify this payout-driving verdict.

SUBJECT ENTITY: {entity}
OBSERVATION WINDOW: {obs_start} to {obs_end}
SOURCE POLICY: {source_policy}
PARTICIPANT: {leader_res.get("participant", "")}
LOCAL TERMINAL ID: {leader_res.get("local_id", "")}
CLAIM: "{terminal_nodes[node_id].get("claim", "")}"
PROPOSED OUTCOME: {leader_res.get("outcome", "")}
PROPOSED SOURCES: {json.dumps(leader_res.get("sources", []))}

Use only bounded, authenticated sources allowed by the source policy. Return JSON only:
{{
  "verified": true or false,
  "outcome": "CONFIRMED" | "SUBSTANTIALLY_CONFIRMED" | "PARTIALLY_CONFIRMED" | "CONTRADICTED" | "UNRESOLVABLE",
  "sources": ["authenticated source URLs used"]
}}"""
                    raw = gl.nondet.exec_prompt(check_prompt, response_format="json")
                    checked = self._parse_llm_json(raw, f"validator node {node_id}")
                    if not checked.get("verified", False):
                        return False
                    if checked.get("outcome") != leader_res.get("outcome"):
                        return False
                    if not self._sources_are_authenticated(checked.get("sources", []), constitution):
                        return False

                expected_scores = {}
                for p_addr, lattice in player_lattices.items():
                    expected_scores[p_addr] = self._propagate_and_score(lattice, leader_resolutions, p_addr)

                if data.get("player_scores", {}) != expected_scores:
                    return False

                expected_all_unresolvable = all(
                    r.get("outcome") == RO_UNRESOLVABLE
                    for r in leader_resolutions.values()
                )
                if data.get("all_unresolvable") != expected_all_unresolvable:
                    return False

                return True
            except Exception:
                return False

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        node_resolutions = result.get("node_resolutions", {})
        player_scores = result.get("player_scores", {})

        # Store full resolution report
        self.sub_resolution_report[sid] = json.dumps({
            "node_resolutions": node_resolutions,
            "player_scores": player_scores,
        })

        all_unresolvable = result.get("all_unresolvable", False)
        if all_unresolvable:
            self.sub_status[sid] = ST_INSUFFICIENT_EVIDENCE
            return

        # Persist individual player scores
        for p_addr, score in player_scores.items():
            pk = f"{sid}:{p_addr}"
            self.player_score[pk] = u256(int(score))

        self.sub_status[sid] = ST_PROVISIONAL_SCORES

    # ──────────────────────────────────────────────────────────────────────────
    # WRITE (PAYABLE): Submit appeal
    # ──────────────────────────────────────────────────────────────────────────
    @gl.public.write.payable
    def submit_appeal(self, subject_id: str) -> None:
        sid = self._sid(subject_id)
        status = self.sub_status.get(sid, "")
        if status != ST_PROVISIONAL_SCORES:
            raise gl.vm.UserError("CIPHER: can only appeal PROVISIONAL_SCORES")

        sender = gl.message.sender_address.as_hex.lower()
        pk = f"{sid}:{sender}"

        if not self.player_joined.get(pk, False):
            raise gl.vm.UserError("CIPHER: not a player")
        if self.player_appeal_bond_paid.get(pk, False):
            raise gl.vm.UserError("CIPHER: already appealed")

        stake = int(self.sub_stake_per_player[sid])
        appeal_bond = (stake * APPEAL_BOND_BPS) // 10000
        received = int(gl.message.value)
        if received != appeal_bond:
            raise gl.vm.UserError(f"CIPHER: appeal bond must be exactly {appeal_bond} wei")

        self.player_appeal_bond_paid[pk] = True
        self.sub_appeal_bond_total[sid] = u256(int(self.sub_appeal_bond_total.get(sid, u256(0))) + received)
        self.sub_status[sid] = ST_APPEAL_PENDING

    # ──────────────────────────────────────────────────────────────────────────
    # WRITE: Finalize subject — settle payouts from stored scores
    # ──────────────────────────────────────────────────────────────────────────
    @gl.public.write
    def finalize_subject(self, subject_id: str) -> None:
        sid = self._sid(subject_id)
        status = self.sub_status.get(sid, "")
        if status not in (ST_PROVISIONAL_SCORES, ST_APPEAL_WINDOW):
            raise gl.vm.UserError("CIPHER: wrong state to finalize")

        count = int(self.sub_player_count[sid])
        gross_pot = int(self.sub_gross_pot[sid])
        fee_bps = int(self.fee_bps)

        appeal_bonds = int(self.sub_appeal_bond_total.get(sid, u256(0)))
        fee = (gross_pot * fee_bps) // 10000
        net_pot = gross_pot - fee

        # Accumulate treasury fee and resolved appeal bonds.
        self.treasury = u256(int(self.treasury) + fee + appeal_bonds)
        self.sub_appeal_bond_total[sid] = u256(0)

        # Gather eligible player scores
        scores: dict = {}
        for i in range(count):
            p_addr = self.sub_player_at[f"{sid}:{i}"]
            pk = f"{sid}:{p_addr}"
            score = int(self.player_score.get(pk, u256(0)))
            if score >= MIN_SCORE_THRESHOLD:
                scores[p_addr] = score

        score_sum = sum(scores.values())

        if score_sum == 0:
            # No eligible winners — refund all players
            self._refund_all_players(sid, include_appeal_bonds=True)
            return

        # Distribute proportionally
        total_distributed = 0
        eligible_addrs = list(scores.keys())
        for p_addr in eligible_addrs[:-1]:
            payout = (scores[p_addr] * net_pot) // score_sum
            pk = f"{sid}:{p_addr}"
            self.player_payout[pk] = u256(payout)
            total_distributed += payout

        # Last eligible player gets remainder to avoid rounding dust
        last_addr = eligible_addrs[-1]
        last_pk = f"{sid}:{last_addr}"
        self.player_payout[last_pk] = u256(net_pot - total_distributed)

        # Ineligible players get nothing (score < threshold)
        for i in range(count):
            p_addr = self.sub_player_at[f"{sid}:{i}"]
            if p_addr not in scores:
                pk = f"{sid}:{p_addr}"
                if self.player_payout.get(pk, u256(0)) == u256(0):
                    self.player_payout[pk] = u256(0)

        self.sub_status[sid] = ST_CLAIMABLE

    # ──────────────────────────────────────────────────────────────────────────
    # WRITE: Withdraw — pull pattern, EVM-compatible
    # ──────────────────────────────────────────────────────────────────────────
    @gl.public.write
    def withdraw(self, subject_id: str) -> None:
        sid = self._sid(subject_id)
        status = self.sub_status.get(sid, "")
        if status not in (ST_CLAIMABLE, ST_REFUNDED):
            raise gl.vm.UserError("CIPHER: nothing to withdraw in current state")

        sender = gl.message.sender_address.as_hex.lower()
        pk = f"{sid}:{sender}"

        if not self.player_joined.get(pk, False):
            raise gl.vm.UserError("CIPHER: not a player")
        if self.player_withdrawn.get(pk, False):
            raise gl.vm.UserError("CIPHER: already withdrawn")

        amount = int(self.player_payout.get(pk, u256(0)))
        if amount <= 0:
            raise gl.vm.UserError("CIPHER: no payout to claim")

        # Checks-effects-interactions
        self.player_withdrawn[pk] = True
        self.player_payout[pk] = u256(0)

        # Transfer GEN to player's EOA address
        _EOARecipient(Address(sender)).emit_transfer(value=u256(amount))

    # ──────────────────────────────────────────────────────────────────────────
    # READ VIEWS
    # ──────────────────────────────────────────────────────────────────────────
    @gl.public.view
    def get_subject(self, subject_id: str) -> dict:
        sid = self._sid(subject_id)
        if not self.sub_status.get(sid):
            raise gl.vm.UserError(f"CIPHER: subject {sid} not found")
        return {
            "id": sid,
            "status": self.sub_status[sid],
            "title": self.sub_title.get(sid, ""),
            "description": self.sub_description.get(sid, ""),
            "entity": self.sub_entity.get(sid, ""),
            "proposer": self.sub_proposer.get(sid, ""),
            "stake_per_player": str(int(self.sub_stake_per_player.get(sid, u256(0)))),
            "min_players": int(self.sub_min_players.get(sid, u256(0))),
            "max_players": int(self.sub_max_players.get(sid, u256(0))),
            "player_count": int(self.sub_player_count.get(sid, u256(0))),
            "gross_pot": str(int(self.sub_gross_pot.get(sid, u256(0)))),
            "obs_start": self.sub_obs_start.get(sid, ""),
            "obs_end": self.sub_obs_end.get(sid, ""),
        }

    @gl.public.view
    def get_all_subjects(self) -> list:
        subjects = []
        total = int(self.next_subject_id)
        for i in range(1, total):
            sid = str(i)
            if self.sub_status.get(sid):
                subjects.append(self.get_subject(sid))
        return subjects

    @gl.public.view
    def get_constitution(self, subject_id: str) -> dict:
        sid = self._sid(subject_id)
        raw = self.sub_constitution_json.get(sid, "")
        if not raw:
            raise gl.vm.UserError(f"CIPHER: no constitution for subject {sid}")
        return self._constitution_from_input(raw)

    @gl.public.view
    def get_player_list(self, subject_id: str) -> list:
        sid = self._sid(subject_id)
        count = int(self.sub_player_count.get(sid, u256(0)))
        return [self.sub_player_at[f"{sid}:{i}"] for i in range(count)]

    @gl.public.view
    def get_lattice(self, subject_id: str, player_address: str) -> dict:
        sid = self._sid(subject_id)
        pk = f"{sid}:{self._addr_hex(player_address)}"
        if not self.player_joined.get(pk, False):
            raise gl.vm.UserError("CIPHER: player not in this subject")
        revealed = self.player_revealed.get(pk, False)
        if not revealed:
            return {"revealed": False, "commitment": self.player_commitment.get(pk, "")}
        lattice_str = self.player_lattice_json.get(pk, "")
        return {"revealed": True, "lattice": json.loads(lattice_str) if lattice_str else {}}

    @gl.public.view
    def get_resolution_report(self, subject_id: str) -> dict:
        sid = self._sid(subject_id)
        raw = self.sub_resolution_report.get(sid, "")
        if not raw:
            return {"available": False}
        report = json.loads(raw)
        report["available"] = True
        return report

    @gl.public.view
    def get_adjudication_report(self, subject_id: str) -> dict:
        sid = self._sid(subject_id)
        raw = self.sub_adjudication_report.get(sid, "")
        if not raw:
            return {"available": False}
        report = json.loads(raw)
        report["available"] = True
        return report

    @gl.public.view
    def get_player_score(self, subject_id: str, player_address: str) -> int:
        sid = self._sid(subject_id)
        pk = f"{sid}:{self._addr_hex(player_address)}"
        return int(self.player_score.get(pk, u256(0)))

    @gl.public.view
    def get_payout_distribution(self, subject_id: str) -> dict:
        sid = self._sid(subject_id)
        count = int(self.sub_player_count.get(sid, u256(0)))
        result = {}
        for i in range(count):
            p_addr = self.sub_player_at[f"{sid}:{i}"]
            pk = f"{sid}:{p_addr}"
            result[p_addr] = str(int(self.player_payout.get(pk, u256(0))))
        return result

    @gl.public.view
    def get_withdrawable(self, subject_id: str, player_address: str) -> dict:
        sid = self._sid(subject_id)
        pk = f"{sid}:{self._addr_hex(player_address)}"
        return {
            "amount": str(int(self.player_payout.get(pk, u256(0)))),
            "withdrawn": self.player_withdrawn.get(pk, False),
            "joined": self.player_joined.get(pk, False),
        }

    @gl.public.view
    def get_player_info(self, subject_id: str, player_address: str) -> dict:
        sid = self._sid(subject_id)
        pk = f"{sid}:{self._addr_hex(player_address)}"
        return {
            "joined": self.player_joined.get(pk, False),
            "committed": self.player_commitment.get(pk, "") != "",
            "revealed": self.player_revealed.get(pk, False),
            "score": int(self.player_score.get(pk, u256(0))),
            "payout": str(int(self.player_payout.get(pk, u256(0)))),
            "withdrawn": self.player_withdrawn.get(pk, False),
            "appeal_filed": self.player_appeal_bond_paid.get(pk, False),
        }

    @gl.public.view
    def get_treasury_balance(self) -> str:
        return str(int(self.treasury))

    @gl.public.view
    def get_contract_balance(self) -> str:
        return str(int(self.balance))

    # ──────────────────────────────────────────────────────────────────────────
    # INTERNAL HELPERS
    # ──────────────────────────────────────────────────────────────────────────
    def _sid(self, subject_id) -> str:
        return str(subject_id).strip('"')

    def _addr_hex(self, address) -> str:
        if hasattr(address, "as_hex"):
            return address.as_hex.lower()
        return str(address).lower()

    def _constitution_from_input(self, constitution_input) -> dict:
        if isinstance(constitution_input, dict):
            return constitution_input

        parsed = json.loads(str(constitution_input))
        if isinstance(parsed, str):
            parsed = json.loads(parsed)
        if not isinstance(parsed, dict):
            raise gl.vm.UserError("CIPHER: constitution_json must decode to an object")
        return parsed

    def _parse_llm_json(self, raw: str, context: str) -> dict:
        """Strip markdown fences and extract first JSON object."""
        if isinstance(raw, dict):
            return raw

        text = raw.strip()
        # Strip code fences
        if "```" in text:
            parts = text.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    text = part
                    break
        # Find first {...}
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1:
            raise gl.vm.UserError(f"LLM_ERROR: no JSON object in {context} response")
        text = text[start:end + 1]
        try:
            return json.loads(text)
        except Exception as e:
            raise gl.vm.UserError(f"LLM_ERROR: JSON parse failed in {context}: {e}")

    def _validate_graph(self, lattice: dict) -> None:
        """Validate claim lattice structure. Raises with LATTICE: prefix."""
        nodes = lattice.get("nodes", [])
        edges = lattice.get("edges", [])

        if len(nodes) < MIN_NODES:
            raise gl.vm.UserError(f"LATTICE: minimum {MIN_NODES} nodes required")
        if len(nodes) > MAX_NODES:
            raise gl.vm.UserError(f"LATTICE: maximum {MAX_NODES} nodes allowed")

        # Node IDs unique
        ids = [n["id"] for n in nodes]
        if len(ids) != len(set(ids)):
            raise gl.vm.UserError("LATTICE: duplicate node IDs")

        # Weight sum == 100
        weight_sum = sum(n.get("weight", 0) for n in nodes)
        if weight_sum != WEIGHT_TOTAL:
            raise gl.vm.UserError(f"LATTICE: weights must sum to {WEIGHT_TOTAL}, got {weight_sum}")

        # All edges reference valid nodes
        id_set = set(ids)
        for edge in edges:
            if edge.get("from") not in id_set or edge.get("to") not in id_set:
                raise gl.vm.UserError(f"LATTICE: edge references unknown node")

        # Node type parent-count rules
        node_parents: dict = {nid: [] for nid in id_set}
        for edge in edges:
            node_parents[edge["to"]].append(edge["from"])

        for node in nodes:
            ntype = node.get("type", "")
            nid = node["id"]
            parents = node_parents[nid]
            if ntype == NT_TERMINAL:
                if len(parents) != 0:
                    raise gl.vm.UserError(f"LATTICE: TERMINAL node {nid} must have no parents")
                if not node.get("claim"):
                    raise gl.vm.UserError(f"LATTICE: TERMINAL node {nid} must have a claim")
            elif ntype == NT_CONDITIONAL:
                if len(parents) < 1:
                    raise gl.vm.UserError(f"LATTICE: CONDITIONAL node {nid} needs >= 1 parent")
            elif ntype == NT_INVERSE:
                if len(parents) != 1:
                    raise gl.vm.UserError(f"LATTICE: INVERSE node {nid} needs exactly 1 parent")
            elif ntype in (NT_CONJUNCTIVE, NT_DISJUNCTIVE):
                if len(parents) < 2:
                    raise gl.vm.UserError(f"LATTICE: {ntype} node {nid} needs >= 2 parents")

        # Cycle detection via DFS
        visited = set()
        in_stack = set()

        def dfs(nid: str) -> bool:
            visited.add(nid)
            in_stack.add(nid)
            children = [e["to"] for e in edges if e["from"] == nid]
            for child in children:
                if child not in visited:
                    if dfs(child):
                        return True
                elif child in in_stack:
                    return True
            in_stack.discard(nid)
            return False

        for nid in id_set:
            if nid not in visited:
                if dfs(nid):
                    raise gl.vm.UserError("LATTICE: cycle detected in lattice graph")

    def _scoped_node_id(self, participant: str, local_id: str) -> str:
        return f"{self._addr_hex(participant)}::{local_id}"

    def _sources_are_authenticated(self, sources, constitution: dict) -> bool:
        min_sources = int(constitution.get("min_primary_sources_per_node", 1))
        if not isinstance(sources, list) or len(sources) < min_sources:
            return False
        for source in sources:
            if not isinstance(source, str):
                return False
            normalized = source.strip().lower()
            if not (normalized.startswith("https://") or normalized.startswith("http://")):
                return False
            if len(normalized) < 12:
                return False
        return True

    def _resolution_record_is_valid(self, record: dict, constitution: dict, node_id: str) -> bool:
        if not isinstance(record, dict):
            return False
        if record.get("node_id") != node_id:
            return False
        if record.get("outcome") not in VALID_OUTCOMES:
            return False
        if not isinstance(record.get("participant", ""), str) or record.get("participant", "") == "":
            return False
        if not isinstance(record.get("local_id", ""), str) or record.get("local_id", "") == "":
            return False
        if not self._sources_are_authenticated(record.get("sources", []), constitution):
            return False
        confidence = int(record.get("confidence", 0))
        return confidence >= 0 and confidence <= 100

    def _validate_resolution_record(self, record: dict, constitution: dict, node_id: str) -> None:
        if not self._resolution_record_is_valid(record, constitution, node_id):
            raise gl.vm.UserError(f"CONSENSUS_OUTPUT: invalid resolution evidence for node {node_id}")

    def _refund_all_players(self, sid: str, include_appeal_bonds: bool) -> None:
        count = int(self.sub_player_count[sid])
        stake = int(self.sub_stake_per_player[sid])
        for i in range(count):
            p_addr = self.sub_player_at[f"{sid}:{i}"]
            pk = f"{sid}:{p_addr}"
            refund = stake
            if include_appeal_bonds and self.player_appeal_bond_paid.get(pk, False):
                refund += (stake * APPEAL_BOND_BPS) // 10000
            self.player_payout[pk] = u256(refund)

        if include_appeal_bonds:
            self.sub_appeal_bond_total[sid] = u256(0)
        self.sub_status[sid] = ST_REFUNDED

    def _propagate_and_score(self, lattice: dict, terminal_resolutions: dict, participant: str = "") -> int:
        """
        Propagate resolutions through lattice DAG and return integer score (0–10000).
        Score is weight-proportional; UNRESOLVABLE weights redistribute to resolved nodes.
        """
        nodes = lattice.get("nodes", [])
        edges = lattice.get("edges", [])

        node_map = {n["id"]: n for n in nodes}
        node_parents: dict = {}
        for node in nodes:
            node_parents[node["id"]] = []
        for edge in edges:
            node_parents[edge["to"]].append(edge["from"])

        # Topological sort (Kahn's algorithm)
        in_degree = {nid: len(pars) for nid, pars in node_parents.items()}
        queue = [nid for nid, deg in in_degree.items() if deg == 0]
        topo_order = []
        children_map: dict = {nid: [] for nid in node_map}
        for edge in edges:
            children_map[edge["from"]].append(edge["to"])

        while queue:
            nid = queue.pop(0)
            topo_order.append(nid)
            for child in children_map[nid]:
                in_degree[child] -= 1
                if in_degree[child] == 0:
                    queue.append(child)

        # Per-node outcome resolution
        node_outcome: dict = {}
        for nid in topo_order:
            node = node_map[nid]
            ntype = node.get("type", NT_TERMINAL)
            parents = node_parents[nid]

            if ntype == NT_TERMINAL:
                scoped_id = self._scoped_node_id(participant, nid) if participant else nid
                outcome = terminal_resolutions.get(scoped_id, terminal_resolutions.get(nid, {})).get("outcome", RO_UNRESOLVABLE)
                node_outcome[nid] = outcome

            elif ntype == NT_INVERSE:
                parent_outcome = node_outcome.get(parents[0], RO_UNRESOLVABLE)
                if parent_outcome == RO_CONFIRMED:
                    node_outcome[nid] = RO_CONTRADICTED
                elif parent_outcome == RO_CONTRADICTED:
                    node_outcome[nid] = RO_CONFIRMED
                elif parent_outcome == RO_SUBSTANTIALLY_CONFIRMED:
                    node_outcome[nid] = RO_PARTIALLY_CONFIRMED
                elif parent_outcome == RO_PARTIALLY_CONFIRMED:
                    node_outcome[nid] = RO_SUBSTANTIALLY_CONFIRMED
                else:
                    node_outcome[nid] = RO_UNRESOLVABLE

            elif ntype == NT_CONJUNCTIVE:
                # All parents must be confirmed (some level) for this to activate
                parent_outcomes = [node_outcome.get(p, RO_UNRESOLVABLE) for p in parents]
                if RO_CONTRADICTED in parent_outcomes:
                    node_outcome[nid] = RO_CONTRADICTED
                elif RO_UNRESOLVABLE in parent_outcomes:
                    node_outcome[nid] = RO_UNRESOLVABLE
                elif all(o == RO_CONFIRMED for o in parent_outcomes):
                    node_outcome[nid] = RO_CONFIRMED
                elif all(o in (RO_CONFIRMED, RO_SUBSTANTIALLY_CONFIRMED) for o in parent_outcomes):
                    node_outcome[nid] = RO_SUBSTANTIALLY_CONFIRMED
                else:
                    node_outcome[nid] = RO_PARTIALLY_CONFIRMED

            elif ntype == NT_DISJUNCTIVE:
                # Any confirmed parent activates this node
                parent_outcomes = [node_outcome.get(p, RO_UNRESOLVABLE) for p in parents]
                if RO_CONFIRMED in parent_outcomes:
                    node_outcome[nid] = RO_CONFIRMED
                elif RO_SUBSTANTIALLY_CONFIRMED in parent_outcomes:
                    node_outcome[nid] = RO_SUBSTANTIALLY_CONFIRMED
                elif RO_PARTIALLY_CONFIRMED in parent_outcomes:
                    node_outcome[nid] = RO_PARTIALLY_CONFIRMED
                elif all(o == RO_CONTRADICTED for o in parent_outcomes):
                    node_outcome[nid] = RO_CONTRADICTED
                else:
                    node_outcome[nid] = RO_UNRESOLVABLE

            elif ntype == NT_CONDITIONAL:
                # This node only activates if its parent is confirmed
                parent_outcome = node_outcome.get(parents[0], RO_UNRESOLVABLE) if parents else RO_UNRESOLVABLE
                if parent_outcome in (RO_CONFIRMED, RO_SUBSTANTIALLY_CONFIRMED):
                    node_outcome[nid] = parent_outcome
                else:
                    node_outcome[nid] = RO_UNRESOLVABLE

        # Redistribution: UNRESOLVABLE weights get spread to resolved nodes
        total_weight = sum(n.get("weight", 0) for n in nodes)
        resolvable_weight_sum = sum(
            n.get("weight", 0) for n in nodes
            if node_outcome.get(n["id"]) != RO_UNRESOLVABLE
        )

        score = 0
        for node in nodes:
            nid = node["id"]
            weight = node.get("weight", 0)
            outcome = node_outcome.get(nid, RO_UNRESOLVABLE)
            multiplier = MULTIPLIER.get(outcome, 0)

            if outcome == RO_UNRESOLVABLE:
                # Redistribute this weight proportionally to resolved nodes
                continue

            if resolvable_weight_sum > 0:
                redistributed_weight = weight * total_weight // resolvable_weight_sum
            else:
                redistributed_weight = weight

            score += (redistributed_weight * multiplier) // 100

        return score
