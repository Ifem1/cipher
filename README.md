# CIPHER

**Multi-player compound prediction protocol on GenLayer.**

Players construct dependency-linked claim lattices about real-world events. GenLayer resolves each node against live public evidence via LLM + web access. Accuracy earns. Inaccuracy penalises.

**Live deployment:** [cipher-six-eta.vercel.app](https://cipher-six-eta.vercel.app)

---

## What is CIPHER?

CIPHER is not a prediction market. It is a **logic-accuracy protocol**.

Instead of placing a simple yes/no bet, players build a directed acyclic graph (lattice) of interconnected claims — terminal facts, conditional chains, conjunctive dependencies, disjunctive branches. Each lattice node carries a weight. All weights must sum to exactly 100.

When the observation window closes, GenLayer resolves every terminal node independently against live public data. Confirmed parents activate children. Contradicted parents collapse them. A player's final score is the proportion of their graph that reality confirmed — proportional payouts, no winner-takes-all.

---

## Architecture

```
cipher/
├── contracts/
│   └── cipher.py          # GenLayer Intelligent Contract (Python)
├── frontend/              # Next.js 16 App Router (TypeScript)
│   ├── app/
│   │   ├── page.tsx                         # Observatory / hero
│   │   ├── profile/page.tsx                 # Player fingerprint & history
│   │   └── subjects/
│   │       ├── new/page.tsx                 # 3-stage circuit creation wizard
│   │       └── [id]/
│   │           ├── page.tsx                 # Circuit detail & actions
│   │           ├── build/page.tsx           # Lattice builder (commit-reveal)
│   │           ├── resolution/page.tsx      # Resolution theatre
│   │           └── certificate/page.tsx     # Score certificate (printable)
│   ├── components/
│   │   ├── nav/OrbitalNav.tsx               # Fixed left-rail navigation
│   │   └── ui/WalletButton.tsx              # MetaMask connect/disconnect
│   ├── lib/
│   │   ├── genlayer/
│   │   │   ├── chain.ts                     # StudioNet chain config
│   │   │   ├── contract.ts                  # Typed contract wrappers
│   │   │   └── status.ts                    # Transaction phase state machine
│   │   └── wallet/
│   │       └── WalletContext.tsx            # MetaMask provider + hooks
│   └── styles/
│       ├── tokens.css                       # CIPHER design tokens
│       └── node-system.css                  # Circuit component styles
├── tests/
│   └── direct/
│       └── test_cipher_direct.py            # Unit tests (no network)
└── docs/
    └── verified-sources.md                  # GenLayer API reference notes
```

---

## Contract

The Intelligent Contract is written in Python and deployed on **GenLayer StudioNet** (chain ID `61999`).

### Subject lifecycle states

```
OPEN → COMMITTED → OBSERVATION_ACTIVE → REVEAL_WINDOW
  → RESOLUTION_PENDING → PROVISIONAL_SCORES → APPEAL_WINDOW
  → FINALIZED → CLAIMABLE → CLOSED
  → CANCELLED | REFUNDED | INSUFFICIENT_EVIDENCE
```

### Write methods

| Method | Description |
|---|---|
| `create_subject(...)` | Propose a new subject with title, entity, observation window, player limits, stake, and constitution JSON |
| `join_circuit(subject_id)` | Join an open subject — exact stake value required as `msg.value` |
| `commit_lattice(subject_id, commitment_hash)` | Submit SHA-256 hash of `lattice_json + salt` |
| `reveal_lattice(subject_id, lattice_json, salt)` | Reveal lattice; contract verifies hash match |
| `submit_for_review(subject_id)` | Non-deterministic — LLM evaluates subject adjudicability |
| `request_resolution(subject_id)` | Non-deterministic — LLM resolves each terminal node against live web data, propagates graph, calculates scores |
| `submit_appeal(subject_id)` | Bond required; triggers re-adjudication |
| `finalize_subject(subject_id)` | Settle scores and credit withdrawable balances |
| `withdraw(subject_id)` | Pull-pattern EVM withdrawal to player EOA |
| `cancel_subject(subject_id)` | Proposer only, OPEN state only |

### Read methods

`get_subject` · `get_all_subjects` · `get_constitution` · `get_player_list` · `get_lattice` · `get_resolution_report` · `get_adjudication_report` · `get_player_score` · `get_payout_distribution` · `get_withdrawable` · `get_player_info` · `get_treasury_balance` · `get_contract_balance`

### Node types

| Type | Activation rule |
|---|---|
| `TERMINAL` | Resolved directly by GenLayer against live evidence |
| `CONDITIONAL` | Active if at least one parent is active |
| `CONJUNCTIVE` | Active only if all parents are active |
| `DISJUNCTIVE` | Active if any parent is active (alias for CONDITIONAL) |
| `INVERSE` | Active if parent is inactive |

### Score resolution

Terminal node outcomes and their score multipliers:

| Outcome | Multiplier |
|---|---|
| `CONFIRMED` | 100% |
| `SUBSTANTIALLY_CONFIRMED` | 80% |
| `PARTIALLY_CONFIRMED` | 40% |
| `CONTRADICTED` | 0% |
| `UNRESOLVABLE` | 0% |

Collapsed-node weights redistribute proportionally to surviving active nodes. Players scoring below the minimum threshold (10 points) are ineligible for payout. The net pot (gross minus 2.5% protocol fee) is distributed proportionally by score.

---

## Frontend

Built with **Next.js 16.2.11** App Router, **TypeScript strict mode**, and **genlayer-js 1.1.8**.

### Design system

- **Void substrate** — `#030309` background, zero glassmorphism
- **Bioluminescent accents** — `#00FFB3` (confirmed), `#FF2D55` (contradicted), `#FFB800` (partial)
- **Circuit visual language** — circular nodes, directed trace edges with arrowheads, no rounded cards
- **Orbital navigation** — fixed left rail with circular node stops
- **Typography** — Syne (display), DM Sans (body), Space Mono (mono)

### Commit-reveal scheme

The lattice builder computes `SHA-256(canonical_json + salt)` client-side using `crypto.subtle`. Only the hash is submitted on-chain. No player sees another's lattice structure before the reveal window opens.

---

## Deployed contract

| Property | Value |
|---|---|
| Network | GenLayer StudioNet |
| Chain ID | 61999 |
| RPC | `https://studio.genlayer.com/api` |
| Contract address | `0x52F8cbC2c68F1c937ab81b6Feb45dD103DeEf9ae` |

---

## Local development

### Prerequisites

- Node.js 20+
- Python 3.12+
- MetaMask (or any EIP-1193 injected wallet)
- A StudioNet account with testnet GEN tokens

### Frontend

```bash
cd cipher/frontend
npm install
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_CONTRACT_ADDRESS
npm run dev
```

The dev server starts at `http://localhost:3000`.

### Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed contract address on StudioNet |

### Contract (local tests only)

```bash
cd cipher
pip install pytest
pytest tests/direct/ -v
```

Integration tests against the live StudioNet node require `gltest` from the GenLayer CLI.

---

## Deployment

The frontend is deployed to **Vercel** via the `cipher/frontend` directory. Pushes to `main` trigger an automatic redeploy.

Required Vercel environment variable:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x52F8cbC2c68F1c937ab81b6Feb45dD103DeEf9ae
```

Set this in **Vercel → Project → Settings → Environment Variables** for all environments (Production, Preview, Development).

---

## Protocol mechanics

### How a circuit runs

1. **Propose** — define a subject: title, primary entity, observation window, evidence constitution, player limits, and stake per player.
2. **Review** — GenLayer's LLM evaluates whether the subject is independently resolvable, time-bounded, and unambiguous. Subjects that fail review are cancelled and stake refunded.
3. **Join** — players join by sending exact stake. The circuit locks at `max_players` or advances manually.
4. **Build & commit** — each player constructs their lattice and submits the commitment hash. No lattice is visible to others.
5. **Reveal** — players reveal lattice JSON and salt. The contract verifies hash integrity.
6. **Resolution** — GenLayer resolves each terminal node against live public sources according to the evidence constitution. Non-deterministic; validators must reach consensus.
7. **Propagation** — the contract propagates terminal resolutions through the graph deterministically. Each player's score is computed.
8. **Appeal** — any player may post an appeal bond to trigger re-adjudication.
9. **Finalize** — after the appeal window, payouts are locked. Players withdraw individually.

### Evidence constitution

Every subject carries an immutable evidence constitution stored on-chain. It governs:

- Permitted source tiers (primary, independent, contextual)
- Minimum primary sources per node
- Partial confirmation policy
- Behaviour when evidence is insufficient (`refund_all`)

The constitution is sealed before the first player joins and cannot be modified.

---

## Tech stack

| Layer | Technology |
|---|---|
| Smart contract | Python on GenLayer (Optimistic Democracy consensus) |
| Blockchain | GenLayer StudioNet (EVM-compatible) |
| Frontend framework | Next.js 16 App Router |
| Language | TypeScript (strict) |
| Blockchain client | genlayer-js 1.1.8 |
| Wallet | MetaMask / EIP-1193 injected provider |
| Fonts | Syne · DM Sans · Space Mono (Google Fonts) |
| Hosting | Vercel |

---

## License

MIT
