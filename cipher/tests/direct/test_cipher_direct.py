"""Direct (no-LLM) tests for CIPHER contract deterministic logic."""
import json
import pytest
from conftest import CONSTITUTION, LATTICE_3, LATTICE_3_JSON, STAKE, CONTRACT_PATH, make_commitment


# ── Subject creation ───────────────────────────────────────────────────────────

def test_create_subject_returns_id(direct_deploy, direct_vm, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = direct_alice
    sid = contract.create_subject(
        "Apple Stock Prediction",
        "Predict Apple stock performance for Q4",
        "AAPL", "2025-10-01", "2025-12-31",
        2, 3, str(STAKE), CONSTITUTION
    )
    assert sid == "1"


def test_second_subject_increments_id(direct_deploy, direct_vm, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = direct_alice
    contract.create_subject(
        "Apple Stock Prediction", "Predict Apple stock performance for Q4",
        "AAPL", "2025-10-01", "2025-12-31", 2, 3, str(STAKE), CONSTITUTION
    )
    sid2 = contract.create_subject(
        "Tesla Stock Prediction", "Predict Tesla stock performance for Q4",
        "TSLA", "2025-10-01", "2025-12-31", 2, 3, str(STAKE), CONSTITUTION
    )
    assert sid2 == "2"


def test_get_subject_returns_data(direct_deploy, direct_vm, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = direct_alice
    sid = contract.create_subject(
        "Apple Stock Prediction", "Predict Apple stock performance for Q4",
        "AAPL", "2025-10-01", "2025-12-31", 2, 3, str(STAKE), CONSTITUTION
    )
    sub = contract.get_subject(sid)
    assert sub["status"] == "OPEN"
    assert sub["title"] == "Apple Stock Prediction"
    assert sub["min_players"] == 2
    assert sub["max_players"] == 3


def test_rejects_short_title(direct_deploy, direct_vm, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("title"):
        contract.create_subject(
            "Hi", "Long enough description here",
            "AAPL", "2025-10-01", "2025-12-31", 2, 3, str(STAKE), CONSTITUTION
        )


def test_rejects_invalid_constitution_json(direct_deploy, direct_vm, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("constitution"):
        contract.create_subject(
            "Valid Title Here", "Long enough description here",
            "AAPL", "2025-10-01", "2025-12-31", 2, 3, str(STAKE), "not json"
        )


# ── Join circuit ───────────────────────────────────────────────────────────────

def _create_subject(contract, vm, sender, min_p=2, max_p=3):
    vm.sender = sender
    return contract.create_subject(
        "Apple Stock Prediction", "Predict Apple stock performance for Q4",
        "AAPL", "2025-10-01", "2025-12-31",
        min_p, max_p, str(STAKE), CONSTITUTION
    )


def test_join_increments_player_count(direct_deploy, direct_vm, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT_PATH)
    sid = _create_subject(contract, direct_vm, direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = STAKE
    contract.join_circuit(sid)

    sub = contract.get_subject(sid)
    assert sub["player_count"] == 1


def test_max_players_advance_to_committed(direct_deploy, direct_vm, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT_PATH)
    sid = _create_subject(contract, direct_vm, direct_alice, min_p=2, max_p=2)

    for sender in [direct_alice, direct_bob]:
        direct_vm.sender = sender
        direct_vm.value = STAKE
        contract.join_circuit(sid)

    sub = contract.get_subject(sid)
    assert sub["status"] == "COMMITTED"
    assert sub["player_count"] == 2


def test_join_rejects_wrong_stake(direct_deploy, direct_vm, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT_PATH)
    sid = _create_subject(contract, direct_vm, direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = STAKE // 2
    with direct_vm.expect_revert("exactly"):
        contract.join_circuit(sid)


def test_join_rejects_double_join(direct_deploy, direct_vm, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT_PATH)
    sid = _create_subject(contract, direct_vm, direct_alice)

    direct_vm.sender = direct_bob
    direct_vm.value = STAKE
    contract.join_circuit(sid)
    direct_vm.value = STAKE
    with direct_vm.expect_revert("already"):
        contract.join_circuit(sid)


def test_join_rejects_full_circuit(direct_deploy, direct_vm, direct_alice, direct_bob, direct_charlie):
    contract = direct_deploy(CONTRACT_PATH)
    sid = _create_subject(contract, direct_vm, direct_alice, min_p=2, max_p=2)

    for sender in [direct_alice, direct_bob]:
        direct_vm.sender = sender
        direct_vm.value = STAKE
        contract.join_circuit(sid)

    direct_vm.sender = direct_charlie
    direct_vm.value = STAKE
    with direct_vm.expect_revert("full"):
        contract.join_circuit(sid)


# ── Commit / Reveal ────────────────────────────────────────────────────────────

def _setup_committed(direct_deploy, direct_vm, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT_PATH)
    sid = _create_subject(contract, direct_vm, direct_alice, min_p=2, max_p=2)
    for sender in [direct_alice, direct_bob]:
        direct_vm.sender = sender
        direct_vm.value = STAKE
        contract.join_circuit(sid)
    direct_vm.value = 0
    return contract, sid


def test_commit_stores_hash(direct_deploy, direct_vm, direct_alice, direct_bob):
    contract, sid = _setup_committed(direct_deploy, direct_vm, direct_alice, direct_bob)
    salt = "mysalt123"
    commitment = make_commitment(LATTICE_3_JSON, salt)

    direct_vm.sender = direct_alice
    contract.commit_lattice(sid, commitment)

    alice_hex = "0x" + direct_alice.hex()
    info = contract.get_player_info(sid, alice_hex)
    assert info["committed"] is True


def test_reveal_validates_hash(direct_deploy, direct_vm, direct_alice, direct_bob):
    contract, sid = _setup_committed(direct_deploy, direct_vm, direct_alice, direct_bob)
    salt = "mysalt123"
    commitment = make_commitment(LATTICE_3_JSON, salt)

    direct_vm.sender = direct_alice
    contract.commit_lattice(sid, commitment)
    contract.reveal_lattice(sid, LATTICE_3_JSON, salt)

    alice_hex = "0x" + direct_alice.hex()
    info = contract.get_player_info(sid, alice_hex)
    assert info["revealed"] is True


def test_reveal_rejects_hash_mismatch(direct_deploy, direct_vm, direct_alice, direct_bob):
    contract, sid = _setup_committed(direct_deploy, direct_vm, direct_alice, direct_bob)
    salt = "mysalt123"
    commitment = make_commitment(LATTICE_3_JSON, salt)

    direct_vm.sender = direct_alice
    contract.commit_lattice(sid, commitment)

    with direct_vm.expect_revert("mismatch"):
        contract.reveal_lattice(sid, LATTICE_3_JSON, "wrong_salt")


def test_reveal_rejects_bad_weight_sum(direct_deploy, direct_vm, direct_alice, direct_bob):
    contract, sid = _setup_committed(direct_deploy, direct_vm, direct_alice, direct_bob)
    bad_lattice = json.dumps({
        "nodes": [
            {"id": "n1", "type": "TERMINAL", "weight": 50, "claim": "x"},
            {"id": "n2", "type": "TERMINAL", "weight": 40, "claim": "y"},
            {"id": "n3", "type": "CONJUNCTIVE", "weight": 20},
        ],
        "edges": [{"from": "n1", "to": "n3"}, {"from": "n2", "to": "n3"}]
    })
    salt = "mysalt"
    commitment = make_commitment(bad_lattice, salt)

    direct_vm.sender = direct_alice
    contract.commit_lattice(sid, commitment)

    with direct_vm.expect_revert("weight"):
        contract.reveal_lattice(sid, bad_lattice, salt)


def test_reveal_rejects_cycle(direct_deploy, direct_vm, direct_alice, direct_bob):
    contract, sid = _setup_committed(direct_deploy, direct_vm, direct_alice, direct_bob)
    cycle_lattice = json.dumps({
        "nodes": [
            {"id": "n1", "type": "TERMINAL", "weight": 33, "claim": "x"},
            {"id": "n2", "type": "CONDITIONAL", "weight": 33},
            {"id": "n3", "type": "CONDITIONAL", "weight": 34},
        ],
        "edges": [
            {"from": "n1", "to": "n2"},
            {"from": "n2", "to": "n3"},
            {"from": "n3", "to": "n2"},
        ]
    })
    salt = "mysalt"
    commitment = make_commitment(cycle_lattice, salt)

    direct_vm.sender = direct_alice
    contract.commit_lattice(sid, commitment)

    with direct_vm.expect_revert("cycle"):
        contract.reveal_lattice(sid, cycle_lattice, salt)


# ── Propagation (unit test internal helper) ────────────────────────────────────

def test_propagation_all_confirmed(direct_deploy, direct_vm):
    contract = direct_deploy(CONTRACT_PATH)
    lattice = {
        "nodes": [
            {"id": "n1", "type": "TERMINAL", "weight": 60, "claim": "x"},
            {"id": "n2", "type": "TERMINAL", "weight": 40, "claim": "y"},
        ],
        "edges": []
    }
    resolutions = {"n1": {"outcome": "CONFIRMED"}, "n2": {"outcome": "CONFIRMED"}}
    score = contract._propagate_and_score(lattice, resolutions)
    assert score == 100


def test_propagation_one_contradicted(direct_deploy, direct_vm):
    contract = direct_deploy(CONTRACT_PATH)
    lattice = {
        "nodes": [
            {"id": "n1", "type": "TERMINAL", "weight": 60, "claim": "x"},
            {"id": "n2", "type": "TERMINAL", "weight": 40, "claim": "y"},
        ],
        "edges": []
    }
    resolutions = {"n1": {"outcome": "CONFIRMED"}, "n2": {"outcome": "CONTRADICTED"}}
    score = contract._propagate_and_score(lattice, resolutions)
    assert score == 60


def test_propagation_unresolvable_redistributes(direct_deploy, direct_vm):
    contract = direct_deploy(CONTRACT_PATH)
    lattice = {
        "nodes": [
            {"id": "n1", "type": "TERMINAL", "weight": 50, "claim": "x"},
            {"id": "n2", "type": "TERMINAL", "weight": 50, "claim": "y"},
        ],
        "edges": []
    }
    resolutions = {"n1": {"outcome": "CONFIRMED"}, "n2": {"outcome": "UNRESOLVABLE"}}
    score = contract._propagate_and_score(lattice, resolutions)
    assert score == 100  # n2 unresolvable redistributes to n1


def test_propagation_conjunctive_collapse(direct_deploy, direct_vm):
    contract = direct_deploy(CONTRACT_PATH)
    lattice = {
        "nodes": [
            {"id": "n1", "type": "TERMINAL", "weight": 33, "claim": "x"},
            {"id": "n2", "type": "TERMINAL", "weight": 33, "claim": "y"},
            {"id": "n3", "type": "CONJUNCTIVE", "weight": 34},
        ],
        "edges": [{"from": "n1", "to": "n3"}, {"from": "n2", "to": "n3"}]
    }
    resolutions = {"n1": {"outcome": "CONFIRMED"}, "n2": {"outcome": "CONTRADICTED"}}
    score = contract._propagate_and_score(lattice, resolutions)
    assert score == 33  # n1 confirmed (33), n2 and n3 contradicted (0)


def test_propagation_disjunctive_any_parent(direct_deploy, direct_vm):
    contract = direct_deploy(CONTRACT_PATH)
    lattice = {
        "nodes": [
            {"id": "n1", "type": "TERMINAL", "weight": 33, "claim": "x"},
            {"id": "n2", "type": "TERMINAL", "weight": 33, "claim": "y"},
            {"id": "n3", "type": "DISJUNCTIVE", "weight": 34},
        ],
        "edges": [{"from": "n1", "to": "n3"}, {"from": "n2", "to": "n3"}]
    }
    resolutions = {"n1": {"outcome": "CONFIRMED"}, "n2": {"outcome": "CONTRADICTED"}}
    score = contract._propagate_and_score(lattice, resolutions)
    assert score == 67  # n1+n3 confirmed (33+34=67), n2 contradicted (0)


# ── Cancel / refund ────────────────────────────────────────────────────────────

def test_proposer_can_cancel(direct_deploy, direct_vm, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)
    sid = _create_subject(contract, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    contract.cancel_subject(sid)
    sub = contract.get_subject(sid)
    assert sub["status"] == "REFUNDED"


def test_non_proposer_cannot_cancel(direct_deploy, direct_vm, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT_PATH)
    sid = _create_subject(contract, direct_vm, direct_alice)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("proposer"):
        contract.cancel_subject(sid)


# ── Read views ─────────────────────────────────────────────────────────────────

def test_get_player_list(direct_deploy, direct_vm, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT_PATH)
    sid = _create_subject(contract, direct_vm, direct_alice, min_p=2, max_p=3)
    for sender in [direct_alice, direct_bob]:
        direct_vm.sender = sender
        direct_vm.value = STAKE
        contract.join_circuit(sid)
    direct_vm.value = 0
    players = contract.get_player_list(sid)
    assert len(players) == 2


def test_get_all_subjects(direct_deploy, direct_vm, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = direct_alice
    contract.create_subject(
        "Apple Stock Prediction", "Predict Apple stock performance for Q4",
        "AAPL", "2025-10-01", "2025-12-31", 2, 3, str(STAKE), CONSTITUTION
    )
    contract.create_subject(
        "Tesla Stock Prediction", "Predict Tesla stock performance for Q4",
        "TSLA", "2025-10-01", "2025-12-31", 2, 3, str(STAKE), CONSTITUTION
    )
    subjects = contract.get_all_subjects()
    assert len(subjects) == 2


def test_get_constitution(direct_deploy, direct_vm, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)
    sid = _create_subject(contract, direct_vm, direct_alice)
    constitution = contract.get_constitution(sid)
    assert isinstance(constitution, dict)
    assert "source_policy" in constitution


def test_get_withdrawable_initial(direct_deploy, direct_vm, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT_PATH)
    sid = _create_subject(contract, direct_vm, direct_alice, min_p=2, max_p=2)
    for sender in [direct_alice, direct_bob]:
        direct_vm.sender = sender
        direct_vm.value = STAKE
        contract.join_circuit(sid)
    direct_vm.value = 0
    alice_hex = "0x" + direct_alice.hex()
    info = contract.get_withdrawable(sid, alice_hex)
    assert info["joined"] is True
    assert info["withdrawn"] is False
