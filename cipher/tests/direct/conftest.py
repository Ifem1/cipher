import json
import hashlib

CONTRACT_PATH = "contracts/cipher.py"
STAKE = 10**18  # 1 GEN

CONSTITUTION = '{"source_policy":"Reuters,AP,BBC","appeal_threshold":3}'

LATTICE_3 = {
    "nodes": [
        {"id": "n1", "type": "TERMINAL", "weight": 50, "claim": "Apple stock closes above $200"},
        {"id": "n2", "type": "TERMINAL", "weight": 30, "claim": "Volume exceeds 10M shares"},
        {"id": "n3", "type": "CONJUNCTIVE", "weight": 20},
    ],
    "edges": [
        {"from": "n1", "to": "n3"},
        {"from": "n2", "to": "n3"},
    ]
}

LATTICE_3_JSON = json.dumps(LATTICE_3)


def make_commitment(lattice_json: str, salt: str) -> str:
    payload = (lattice_json + salt).encode()
    return "0x" + hashlib.sha256(payload).hexdigest()
