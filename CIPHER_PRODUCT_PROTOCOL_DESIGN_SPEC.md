# CIPHER

## Product, Protocol, Contract and Experience Specification

**Category:** Multi-player real-world prediction protocol  
**Protocol:** GenLayer  
**Core primitive:** Each player constructs a dependency-linked claim lattice about a real-world subject. GenLayer resolves each claim node independently and propagates truth through the graph. Payout is proportional to accuracy score.  
**Working tagline:** **Build the logic. Watch reality run it.**  
**Experience concept:** **The Circuit Constellation**  
**Document purpose:** This specification defines CIPHER as a product, adjudication protocol, contract system and complete interface world. It is an original direction with no shared mechanics, aesthetics or naming with Parallax.

---

## 1. Executive summary

CIPHER is a multi-player compound prediction protocol built on GenLayer.

It is not a sportsbook, a binary prediction market, a yes-versus-no wager, or a two-player adversarial duel. Between two and six players each construct an independent claim lattice — a directed graph of interconnected predictions about a real-world subject. Claims are nodes. Dependencies between claims are edges. The graph encodes each player's logical model of how a situation will unfold.

After the observation window closes, a GenLayer Intelligent Contract resolves each leaf claim independently using LLM calls and live public evidence. Resolution propagates forward through the dependency graph: confirmed parents activate their children, contradicted parents collapse theirs. Each player receives an accuracy score between 0 and 100. The pot distributes proportionally to score.

A subject may concern:

- a product launch or cancellation;
- a protocol incident and its recovery;
- a governance proposal and its downstream effects;
- a regulatory decision and its scope;
- a creator release and its reception;
- a technical milestone and its delivery;
- a public company commitment and its fulfilment;
- a geopolitical development and its observable consequences;
- any situation with publicly verifiable outcomes within a bounded time window.

CIPHER asks:

> How much of your logical model of reality survived contact with actual events?

The deterministic layer controls deposits, commitments, graph topology validation, lifecycle transitions, score crediting and withdrawals.

The non-deterministic layer handles:

> For each terminal claim node in this lattice, under the subject's pre-agreed evidence policy, what is the resolution class supported by available public evidence?

GenLayer is the adjudication mechanism that makes per-node resolution decentralized and trustless.

---

## 2. Product thesis

Most prediction products ask one question and accept one answer.

CIPHER does not.

Real-world events unfold through chains of dependent developments. A launch is announced, then delayed, then shipped in reduced scope, then reviewed favourably, then revised. Each step may or may not occur. Each step may depend on the previous one.

People disagree not just about outcomes but about:

- which sub-events are likely;
- which sub-events depend on others;
- which sub-events are the decisive ones;
- how much weight each sub-event deserves;
- whether a conditional claim is meaningful if its parent fails.

A flat binary oracle can answer one of these at a time. It cannot evaluate a logical structure of claims where some only activate if others resolve first.

CIPHER turns that logical structure into a competitive prediction instrument.

Players do not compete against each other's model. They each compete against reality. The winner is whoever modelled reality most accurately — not whoever happened to pick the right side of a coin toss. A player can be 80% right and receive 80% of their proportional share. Accuracy earns. Inaccuracy penalises. Zero accuracy forfeits.

---

## 3. Core object: claim lattice

A claim lattice is a player's encoded model of a future.

Each lattice contains:

- a position title;
- a brief thesis;
- three to seven claim nodes;
- 100 weight points distributed across the nodes;
- directed dependency edges between nodes;
- a commitment salt;
- a schema version.

The lattice is a directed acyclic graph. It must have no cycles. Every node must be reachable from the root resolution pass. Leaf nodes with no parents are terminal and always submitted for resolution. Non-terminal nodes activate or collapse based on their dependency rule and the resolution of their parents.

### 3.1 Node types

**Terminal**  
Has no parent dependency. Always submitted for LLM resolution regardless of other nodes. Weight is always active.

**Conditional**  
Requires exactly one parent. Activates and contributes weight only if its parent node resolves as CONFIRMED or SUBSTANTIALLY_CONFIRMED. Collapses to zero weight if parent resolves as CONTRADICTED or UNRESOLVABLE.

**Inverse**  
Requires exactly one parent. Activates only if its parent resolves as CONTRADICTED. Collapses if parent resolves as CONFIRMED.

**Conjunctive**  
Requires two or more parent nodes. Activates only if all parents resolve as CONFIRMED or SUBSTANTIALLY_CONFIRMED.

**Disjunctive**  
Requires two or more parent nodes. Activates if any parent resolves as CONFIRMED or SUBSTANTIALLY_CONFIRMED.

### 3.2 Weight propagation on collapse

When a node collapses, its weight does not disappear. It redistributes pro-rata among the surviving active nodes in the same lattice. This ensures the total weight always sums to 100 across the evaluated nodes and the final score remains on the 0–100 scale.

### 3.3 Per-node resolution multipliers

Each node receives a resolution multiplier based on its assessment:

| Assessment class | Multiplier |
|---|---|
| `CONFIRMED` | 1.00 |
| `SUBSTANTIALLY_CONFIRMED` | 0.80 |
| `PARTIALLY_CONFIRMED` | 0.40 |
| `CONTRADICTED` | 0.00 |
| `UNRESOLVABLE` | weight redistributed |
| `OUTSIDE_TIME_WINDOW` | weight redistributed |
| `INVALID_NODE` | weight redistributed |

### 3.4 Final score formula

```
active_nodes = all nodes not collapsed by dependency failure
redistributed_weight(node) = node.weight × (100 / sum_of_active_weights)
node_score(node) = redistributed_weight(node) × resolution_multiplier(node)
cipher_score = sum of node_score across all active_nodes
```

Score range: 0 to 100.

### 3.5 Example lattice

**Subject:** Will OpenAI release GPT-5 before September 2026?

**Player lattice — Confident launch:**

```
Node A [Terminal]         wt:30   "OpenAI announces GPT-5 publicly before Sep 2026"
Node B [Conditional → A] wt:20   "The release includes a public API"
Node C [Conditional → A] wt:15   "A benchmark leaderboard ranking is published"
Node D [Terminal]         wt:25   "Sam Altman posts about the release on X"
Node E [Conjunctive → A,D] wt:10 "Altman explicitly names GPT-5 in his post"
```

If A is CONTRADICTED: B, C, E collapse. Weights of B, C, E redistribute to D. D effectively carries 100 points.
If A is CONFIRMED and D is CONTRADICTED: E collapses. A, B, C are scored normally against 90 redistributed points.

---

## 4. Product modes

### 4.1 Open circuit — MVP

Each player independently constructs their lattice about the same subject. No constraints on what claims they build. No player sees another's lattice before the reveal. The subject defines only the observation entity, time window and evidence policy.

This is the flagship mode because it requires:

- per-node LLM claim resolution;
- dependency graph propagation;
- per-node evidence gathering;
- partial confirmation handling;
- collapsed weight redistribution;
- proportional multi-player settlement.

### 4.2 Anchor circuit — later

The subject includes one mandatory anchor node that all players must include in their lattice. The anchor is resolved first. Players then diverge on what they believe follows from the anchor outcome. Shared starting point, divergent consequence modelling.

### 4.3 Relay circuit — later

Resolution output from one subject feeds into the node conditions of a subsequent subject. Truth propagates across time windows.

### 4.4 Null circuit — later

Three or more players. The contract also generates a neutral null hypothesis lattice representing the most conservative reading of the evidence. Players compete against the null as a baseline. Beating the null earns a multiplier bonus.

### 4.5 Synthesis circuit — later

After all lattices are revealed, the contract synthesises a consensus model from confirmed nodes across all players. Players whose lattices most resemble the consensus receive a collaboration bonus distributed from a separate pool.

The MVP must implement open circuits completely rather than all modes superficially.

---

## 5. User roles

### Proposer

Creates the subject, defines the evidence policy, sets the observation window and time limits, deposits the creation bond. The proposer does not build a lattice in the MVP; they host the circuit.

### Player

Joins the circuit by depositing stake, builds and commits a claim lattice, reveals after the observation window, receives a score and proportional payout.

### Observer

Views public subjects, active circuits, resolved nodes and final score distributions. Cannot stake.

### App operator

Maintains frontend configuration and moderation metadata. Cannot alter node resolutions, change scores or redirect escrowed funds.

### GenLayer validators

Independently evaluate each proposed non-deterministic node resolution and whether it follows the evidence policy and subject constitution.

---

## 6. Subject lifecycle

```
OPEN
  → COMMITTED
  → OBSERVATION_ACTIVE
  → REVEAL_WINDOW
  → FULLY_REVEALED
  → RESOLUTION_AVAILABLE
  → RESOLUTION_PENDING
  → PROVISIONAL_SCORES
  → APPEAL_WINDOW
  → FINALIZED
  → CLAIMABLE
  → CLOSED
```

Recovery or terminal states:

```
CANCELLED
EXPIRED_NO_PLAYERS
EXPIRED_MINIMUM_NOT_MET
REVEAL_DEFAULT
VOIDED
INSUFFICIENT_EVIDENCE
REFUNDED
```

### Lifecycle rules

- A subject cannot accept players before adjudicability review passes.
- Proposer cannot change subject terms after a player joins.
- Each player's lattice is invisible to all others before the reveal window.
- A player who fails to reveal within the grace period is subject to the fixed reveal default policy.
- Resolution cannot begin before the observation window closes.
- Provisional scores are not final scores.
- Funds become withdrawable only after finality or a deterministic refund condition.
- No method may finalize a subject twice.
- No player may withdraw more than their credited balance.

---

## 7. Subject constitution

Every subject includes a compact evidence and resolution constitution fixed before the first player joins.

It contains:

- subject title;
- subject description;
- primary entity identifiers;
- observation start;
- observation end;
- evidence cut-off;
- resolution-not-before time;
- permitted source classes;
- prohibited source classes;
- minimum primary-source expectation per node;
- treatment of archived content;
- treatment of edited or deleted pages;
- treatment of rumours and unattributed reports;
- partial-confirmation policy;
- insufficient-evidence policy;
- minimum player count;
- maximum player count;
- reveal grace period;
- appeal window;
- maximum appeal count;
- minimum score threshold for payout eligibility;
- contract version.

Constitution presets:

- official-publication-dominant;
- primary-source-plus-independent;
- multi-source-public-record;
- on-chain-and-official;
- repository-and-release-artefact;
- governing-body-and-official-result.

A preset is only a frontend shortcut. The stored constitution is always explicit.

---

## 8. Adjudicability review

Before a player can lock funds, GenLayer reviews whether each claim node in the proposed subject template is independently resolvable. This review operates on the subject definition and any template claims the proposer provides; players build their own lattices freely within the approved subject scope.

The review checks:

1. subject and entity clarity;
2. bounded and verifiable time window;
3. external observability of outcomes;
4. feasibility of per-node evidence gathering;
5. undefined or circular dependency potential;
6. unilateral participant control of any claim;
7. source sufficiency for the evidence policy;
8. prohibited content;
9. output representability as a node resolution class.

### Review output

```json
{
  "adjudicable": true,
  "classification": "PASS",
  "issues": [],
  "warnings": [
    {
      "code": "THIN_SOURCE_EXPECTED",
      "message": "Node type C may have limited primary-source coverage. Ensure independent confirmation is listed as acceptable."
    }
  ],
  "review_summary": "Subject is resolvable. One warning on source depth for social claims."
}
```

### Review classifications

- `PASS`
- `NEEDS_REVISION`
- `REJECTED_PROHIBITED`
- `REJECTED_UNCONTROLLABLE_EVIDENCE`
- `REJECTED_PARTICIPANT_CONTROL`
- `REJECTED_CIRCULAR_DEPENDENCY`
- `REJECTED_INTERNAL_CONTRADICTION`
- `ERROR_TRANSIENT`
- `ERROR_EXTERNAL`
- `ERROR_LLM`

A failed review must never silently allow a subject into OPEN state.

---

## 9. Sealed lattice and commit-reveal

CIPHER uses sealed lattices to prevent reactive copying between players.

### Commitment payload

The client canonicalizes:

- subject ID;
- player address;
- position title;
- normalized thesis;
- ordered nodes with IDs, text and weight;
- dependency edge list;
- node type for each node;
- decisive node flag per node;
- random salt;
- schema version.

### Canonicalization rules

- fixed field order;
- UTF-8 encoding;
- normalized line endings;
- trimmed bounded text;
- integer weight values;
- no floating point;
- stable node order by declared index;
- stable edge list by source node index;
- explicit schema version;
- no hidden optional fields;
- no transformation after signing.

### Reveal

The player submits the full payload and salt. The contract verifies that the commitment hash matches the stored commitment.

### Reveal default policy

The MVP uses:

- fixed reveal grace period after observation window closes;
- score of zero for the non-revealing player;
- zero-score players are payout-ineligible;
- their stake transfers to the eligible players' proportional pool;
- verifiable system-failure refund path only with on-chain evidence;
- no improvised settlement.

---

## 10. Evidence model

CIPHER uses per-node evidence sets. Each terminal claim node receives its own independent evidence investigation. Non-terminal nodes may inherit relevant evidence from their parent's investigation but are also queried independently when active.

### Tier 1 — Primary evidence

- official organisation and team publications;
- official regulator or court documents;
- governing-body announcements;
- public repositories and release artefacts;
- canonical on-chain records;
- formal company filings;
- verified first-party announcements.

### Tier 2 — Independent confirmation

- established news publications;
- recognised industry publications;
- reputable data providers;
- independent archival copies;
- specialist reporting with attributable sources.

### Tier 3 — Contextual evidence

- interviews and press statements;
- public social posts by involved parties;
- community reports;
- secondary commentary.

### Evidence rules

- Tier 3 alone cannot settle a high-weight node.
- Repeated syndication does not equal independent confirmation.
- Publication time and event time must be distinguished.
- Corrections and retractions must be applied.
- Cached snippets are not equivalent to full sources.
- Unavailable and paywalled sources must be flagged.
- Each node's evidence set must be independently auditable.

### Node evidence record fields

- evidence ID;
- URL;
- domain;
- source tier;
- publisher;
- publication time;
- retrieval marker;
- summary (max 400 characters);
- related node ID;
- support direction (SUPPORTS, CONTRADICTS, NEUTRAL);
- access status;
- reliability note.

---

## 11. Node resolution record

At resolution, the non-deterministic process constructs a resolution record for each terminal node.

Node resolution record contains:

- subject ID;
- node ID;
- node text;
- resolution version;
- evidence sufficiency;
- evidence items;
- assessment class;
- confidence level;
- concise rationale (max 600 characters);
- decisive evidence ID if applicable.

### Assessment classes

- `CONFIRMED`
- `SUBSTANTIALLY_CONFIRMED`
- `PARTIALLY_CONFIRMED`
- `CONTRADICTED`
- `UNRESOLVABLE`
- `OUTSIDE_TIME_WINDOW`
- `INVALID_NODE`

### Confidence levels

- `HIGH`
- `MEDIUM`
- `LOW`

LOW confidence does not automatically produce UNRESOLVABLE. It signals reduced certainty in the assessment.

### Full resolution output

After all terminal nodes resolve and propagation completes:

- subject ID;
- resolution version;
- node resolutions (array, one per terminal node);
- propagation result per non-terminal node;
- per-player cipher score;
- payout distribution;
- evidence sufficiency summary;
- confidence summary.

---

## 12. GenLayer equivalence strategy

The full resolution must not use `strict_eq`.

Validators may:

- retrieve different page versions of the same source;
- find different supporting sources;
- phrase rationale differently;
- encounter transient source failures;
- assign nearby confidence ratings.

### Leader responsibilities

For each terminal node:

1. read the immutable subject constitution;
2. identify the node's subject entity and time window;
3. retrieve permitted evidence up to the source cap;
4. prioritise primary sources;
5. detect duplication and corrections;
6. assess the node claim;
7. classify with the correct assessment class;
8. return a per-node resolution record in valid JSON.

Then:

9. propagate assessments through the dependency graph;
10. calculate redistributed weights;
11. calculate per-player cipher scores;
12. propose payout distribution;
13. return the full resolution output.

### Validator responsibilities

Independently check per node:

- correct subject and time window;
- constitution compliance;
- source policy compliance;
- evidence sufficiency;
- immutable node text used;
- reasonable assessment class;
- schema validity;
- rationale consistency.

Then check the full output:

- propagation logic correct;
- weight redistribution arithmetic correct;
- score calculation correct;
- no score exceeds 100;
- payout proportions valid.

### Material equivalence

Accept when validators agree on:

- assessment class per terminal node;
- propagation result per non-terminal node;
- per-player score within ±5;
- evidence sufficiency per node;
- constitution application;
- normalized schema.

Exact prose, URL ordering and non-decisive evidence selection do not need to match.

---

## 13. Appeal design

CIPHER distinguishes application-level re-adjudication from GenLayer protocol finality.

### Valid appeal grounds

- a decisive source was inaccessible or misidentified;
- evidence outside the allowed time window was used;
- a node was assessed contrary to its fixed text;
- a prohibited source was used decisively;
- primary evidence directly contradicting the assessment was omitted;
- assessment contradicts the resolution multiplier applied;
- the dependency propagation applied the wrong rule;
- the wrong entity's evidence was attributed to the subject.

### Invalid grounds

- disagreement without specific evidence;
- adding a new claim to the lattice after reveal;
- changing the constitution;
- using late evidence outside the cut-off;
- repeating a rejected argument;
- objecting to another player's lattice structure.

### Appeal bond

- one appeal per player per subject in the MVP;
- successful appeal returns bond;
- unsuccessful appeal routes bond to the protocol fee pool;
- technical failure returns bond;
- no bond transfer before final adjudication.

---

## 14. Escrow and settlement

### MVP value model

- equal native GEN stakes per player;
- optional creation bond from proposer;
- one appeal bond per player;
- protocol fee in basis points deducted before distribution;
- pull withdrawals;
- explicit refunds;
- no ERC-20 support;
- no leverage;
- no liquidity pools;
- no observer staking.

### Payout formula

```
eligible_players = players with cipher_score >= minimum_threshold
score_sum = sum of cipher_score for eligible_players
gross_pot = sum of all player stakes
fee = gross_pot × fee_basis_points / 10000
net_pot = gross_pot - fee
player_payout = (player_score / score_sum) × net_pot
```

Players below minimum threshold receive zero. Their stakes remain in the pot and distribute to eligible players.

### Accounting

Funds must be separately tracked as:

- player stakes per subject;
- creation bonds;
- appeal bonds per player;
- protocol fees;
- withdrawable balances per player;
- withdrawn totals;
- refunds.

### Pull payment

Finalization credits a withdrawable balance. Players withdraw separately.

Required protections:

- balance zeroed before transfer;
- no double withdrawal;
- failed transfer cannot destroy entitlement;
- invariants tested before and after.

### Special outcomes

**Insufficient evidence (any node)**  
If the contract cannot gather minimum required evidence for any terminal node: all stakes refunded. No scoring. No protocol fee.

**All players below threshold**  
If no player reaches the minimum score: all stakes refunded. No scoring.

**Reveal default**  
Defaulting player's stake transfers to the eligible proportional pool.

**Void**  
All stakes refunded. Bonds follow their reason code.

---

## 15. Storage architecture

Use GenLayer storage types only.

Do not persist raw Python dictionaries or lists.

Recommended layout:

- typed scalar maps for subject status, proposer, player count and timestamps;
- typed maps for stakes and balances per player per subject;
- typed maps for lattice commitment hashes;
- typed arrays for player addresses per subject;
- bounded node records with fixed field types;
- typed maps for node resolution records indexed by subject ID and node ID;
- typed maps for per-player cipher scores;
- sized integers for all money, weight and time values.

### StudioNet caution

Run a minimal storage spike before the main contract. Test scalar maps, arrays and any dataclass-in-map patterns. Prefer parallel typed maps if dataclass-in-map writes are unreliable on the target runner. Keep the regression test in the repository.

---

## 16. Contract method surface

### Writes

- `create_subject`
- `submit_subject_for_review`
- `open_subject`
- `join_circuit`
- `commit_lattice`
- `reveal_lattice`
- `request_resolution`
- `submit_appeal`
- `finalize_subject`
- `withdraw`
- `cancel_subject`
- `claim_reveal_default`

### Reads

- `get_subject`
- `get_subject_status`
- `get_constitution`
- `get_player_list`
- `get_lattice_commitment`
- `get_lattice` (only after reveal window)
- `get_node_resolution`
- `get_player_score`
- `get_payout_distribution`
- `get_withdrawable`
- `get_deadlines`
- `get_evidence_digest`
- `get_appeal_status`
- `get_provisional_scores`
- `get_final_scores`

Sealed lattice content must remain unreadable before the reveal window opens.

---

## 17. Error taxonomy

Use predictable prefixes:

- `EXPECTED:`
- `ACCESS:`
- `STATE:`
- `VALIDATION:`
- `FUNDS:`
- `DEADLINE:`
- `COMMITMENT:`
- `LATTICE:`
- `EXTERNAL:`
- `TRANSIENT:`
- `LLM_ERROR:`
- `CONSENSUS_OUTPUT:`
- `PROPAGATION:`

Examples:

```
STATE: subject is not open for players
FUNDS: attached value must equal the declared stake
COMMITMENT: revealed lattice does not match commitment
DEADLINE: observation window has not closed
VALIDATION: node weights do not total 100
LATTICE: dependency graph contains a cycle
LATTICE: node references unknown parent ID
EXTERNAL: minimum evidence could not be retrieved for node A
PROPAGATION: redistributed weights do not sum to 100
CONSENSUS_OUTPUT: unknown assessment class in node resolution
```

---

## 18. Safety and prohibited subjects

Reject or moderate:

- death or injury wagers involving private individuals;
- self-harm predictions;
- crime incentive structures;
- private medical outcomes;
- doxxing;
- sexual content involving minors;
- participant-controlled outcomes;
- harassment;
- illegal evidence requirements;
- thin-market manipulation;
- confidential employer information;
- extortion;
- outcomes that reward causing harm.

### Jurisdiction

The MVP is a StudioNet demonstration unless legal review supports a production launch.

---

# PART II — EXPERIENCE SYSTEM

## 19. Design thesis

CIPHER is not designed as a website.

It is designed as a **living circuit board that responds to reality**.

The user does not browse pages. The user constructs logic, seals it, and watches reality run current through it.

Every claim is a node. Every dependency is a trace. Every resolution is a node that either illuminates or goes dark. The final state of a subject is a circuit diagram of what reality confirmed and what it contradicted.

This is the primary visual and interaction law.

### The interface must feel like

- a particle physics control panel;
- a logic gate simulator;
- a neural signal map;
- a cosmic web visualiser;
- a quantum circuit schematic;
- bioluminescent traces on a deep space substrate.

### The interface must not feel like

- a sportsbook;
- a casino;
- a trading terminal;
- a dashboard with cards;
- a document editor;
- an optical instrument;
- a courtroom;
- a social feed;
- any prior GenLayer project.

---

## 20. Naming the design system

The visual system is called:

# NODE SYSTEM

Internal component prefix:

```
NS
```

The design language revolves around:

- nodes;
- traces;
- activation;
- propagation;
- collapse;
- lattice;
- weight;
- signal;
- constellation;
- circuit.

---

## 21. Absolute visual rules

### Never use

- titanium, steel or graphite colour palettes;
- electric lime or deep cobalt as primary accents;
- optical bench layouts;
- rotary dial navigation;
- film strips or film frames;
- lens assemblies or aperture shapes;
- conviction weight metaphors;
- shutter animations;
- calibration ring UI elements;
- generic card grids;
- glassmorphism;
- neon cyberpunk aesthetic;
- default blue primary buttons;
- green winner banners;
- confetti or trophy icons;
- casino symbols;
- AI sparkles;
- fake terminal logs;
- parchment or aged paper.

### Always prefer

- circular node forms;
- directed edge traces with signal direction;
- constellation-style spatial layouts;
- deep space void backgrounds;
- bioluminescent accent colors on dark substrates;
- particle propagation effects (subtle, mechanical);
- score readouts as circuit output metrics;
- minimal flat surfaces with node overlays;
- radial orbital navigation;
- signal-path language for state changes;
- edge-mounted micro labels;
- grid-aligned node placement.

---

## 22. Colour system

The interface uses a deep void substrate with bioluminescent circuit accents.

### Core substrate

| Token | Name | Hex | Use |
|---|---|---|---|
| `--void` | Void Black | `#030309` | Primary page field |
| `--deep` | Deep Space | `#080814` | Secondary surfaces |
| `--surface` | Circuit Surface | `#0D0D1F` | Raised surfaces |
| `--raised` | Node Platform | `#12122A` | Interactive components |
| `--trace` | Inactive Trace | `#1E1E3A` | Inactive edges |
| `--border` | Circuit Border | `#2A2A50` | Borders and dividers |
| `--text` | Signal White | `#E8E8FF` | Primary text |
| `--sub` | Dim Signal | `#8888CC` | Secondary text |
| `--muted` | Dead Signal | `#4A4A80` | Placeholder, hints |

### State colours

| Token | Name | Hex | Use |
|---|---|---|---|
| `--confirmed` | Confirmed Mint | `#00FFB3` | Confirmed node |
| `--partial` | Partial Amber | `#FFB800` | Partially confirmed |
| `--contradicted` | Fault Red | `#FF2D55` | Contradicted node |
| `--unresolvable` | Muted Violet | `#4A4A80` | Unresolvable node |
| `--pending` | Pending Trace | `#2A2A50` | Awaiting resolution |
| `--warning` | Warning Signal | `#FF8C00` | Warnings |

### Player accent colours

Up to six players. Colours never repeat within a subject.

| Player | Name | Hex |
|---|---|---|
| P1 | Circuit Mint | `#00FFB3` |
| P2 | Activation Orange | `#FF5C00` |
| P3 | Deep Violet | `#B400FF` |
| P4 | Signal Yellow | `#FFD600` |
| P5 | Plasma Pink | `#FF006E` |
| P6 | Sky Cyan | `#00B4FF` |

### Colour behaviour

Colour is not static decoration.

When a player's lattice is in focus:

- that player's accent colour activates on their nodes and traces;
- other players' lattices recede to 20% opacity;
- the score readout highlights in the active player colour;
- node labels adopt the player's accent.

When a node resolves as CONFIRMED:

- the node illuminates in `--confirmed`;
- outgoing traces brighten;
- children activate in sequence.

When a node is CONTRADICTED:

- the node dims to `--contradicted`;
- outgoing traces extinguish;
- children collapse (visual fade).

When all nodes resolve:

- the full circuit diagram is visible for all players simultaneously;
- each player's remaining lit traces show their accuracy pattern;
- no single winner banner appears;
- the score distribution is the final visual.

### Prohibited colour behaviour

- no full-screen saturated backgrounds;
- no gradient fills on surfaces;
- no player colour as generic success or failure;
- no red for the lowest-scoring player specifically;
- no bright colour on every interactive element.

---

## 23. Typography

Typography should feel like precision scientific instrumentation.

### Display

Use:

- `Syne` (primary display face — geometric, technical, distinct);
- `Space Grotesk` (secondary option).

Use variable weight for dramatic display headings.

### Body

Use:

- `DM Sans`;
- `Inter` as fallback.

### Technical labels and code

Use:

- `Space Mono`.

### Numeric readouts

Use:

- custom monospace tabular rendering for scores and weights;
- `Space Mono` with fixed-width digit alignment;
- no decorative seven-segment treatment for body text.

Score values, weight totals and countdown timers may use a restrained segmented treatment.

### Scale

```
Display XL:       96–128 px desktop
Display L:        56–80 px
Section:          36–52 px
Subsection:       24–32 px
Body L:           17–20 px
Body:             14–16 px
Node label:       11–13 px
Micro label:      9–11 px
Score readout:    28–48 px
Weight readout:   20–32 px
```

### Type rules

- node labels align to grid intersections;
- headings may be tightly tracked;
- body text remains readable at 16px minimum;
- no decorative italics in functional UI;
- scores must remain tabular where comparison matters;
- player names use their accent colour on dark surfaces only.

---

## 24. Spatial system

### Base grid

Use an 8-pixel system.

Primary spacing:

```
4, 8, 12, 16, 24, 32, 48, 64, 96, 128
```

### Circuit grid

The node placement system uses a 64px grid within the circuit canvas. Nodes snap to grid intersections. Traces route along grid lines with 8px perpendicular offsets for parallel traces.

### Screen composition

Desktop uses a circuit canvas, not a conventional container.

Recommended maximum working width:

```
1680 px
```

Content does not always need to be centred. The circuit lattice determines composition.

### Surface hierarchy

There are no generic cards.

Use:

- circuit canvases;
- node housings (circular);
- trace channels;
- signal rails;
- data panels;
- score readout plates;
- evidence feed strips;
- orbital navigation rings.

---

## 25. Shape language

### Dominant shapes

- circles (node housings);
- directed lines with arrowheads (traces);
- small arc segments (weight indicators around nodes);
- thin rectangles (data panels);
- concentric rings (loading and score states);
- dot clusters (player markers);
- radial arrangements (orbital navigation).

### Corners

- 0–2 px for data panels and rectangular elements;
- 999 px only for circular node housings;
- no generic 16–24 px rounded card system.

### Borders

- 1 px at low opacity for surfaces;
- 2 px for active node edges;
- animated trace direction for active signals;
- no glowing outlines.

### Node states (visual)

| State | Visual treatment |
|---|---|
| Sealed | Dark circle, dashed border, no interior |
| Revealed | Lit interior, player accent, solid border |
| Pending resolution | Slow pulse (if motion enabled) or concentric ring |
| Confirmed | Bright mint fill, white label, trace illuminated |
| Partially confirmed | Amber fill, partial ring |
| Contradicted | Red fill at 30% opacity, trace extinguished |
| Unresolvable | Muted violet, dotted border |
| Collapsed | Hollow, grey, child traces removed |

---

## 26. Motion system

Motion must feel like current flowing through a circuit.

### Allowed motion families

- signal propagation along traces;
- node activation (pulse then steady);
- node collapse (brightness drain);
- weight redistribution (arc fill shift);
- score accumulation (number count-up);
- orbital navigation rotation;
- lattice reveal (nodes materialise in dependency order);
- circuit seal (crystallisation lock animation).

### Motion rules

- no idle pulsing on resolved nodes;
- no floating elements;
- no random particle systems;
- no endless animations after resolution;
- no generic fade-up reveals.

### Timing

```
Node activation:      200–350 ms
Trace propagation:    300–500 ms per hop
Node collapse:        180–280 ms
Weight shift:         400–600 ms
Score count-up:       600–1200 ms
Lattice reveal:       80 ms per node, in dependency order
Circuit seal:         900–1400 ms total
Orbital rotation:     400–600 ms
```

### Easing

Use custom cubic bezier curves that simulate:

- electrical surge (fast rise, held);
- resistive decay (slow fade);
- snap lock (overshoot 2–3% then settle);
- current propagation (sequential delay per trace hop).

### Reduced motion

Reduced-motion mode replaces:

- propagation animation with immediate final state;
- node activation with instant fill;
- orbital rotation with direct state change;
- count-up with instant final value.

The product must be fully understandable without motion.

---

## 27. Sound system

Sound is optional and disabled by default.

Permitted sounds:

- soft node activation click;
- trace propagation hum (short);
- node collapse signal drop;
- circuit seal confirmation tone;
- score finalisation tone.

Do not use:

- casino sounds;
- notification chimes;
- dramatic cinematic booms;
- speech;
- repetitive loops.

Provide a visible mute control.

---

## 28. Navigation: orbital radial selector

There is no conventional top navbar on desktop.

Use an orbital ring fixed to the left edge of the viewport.

The orbital contains five section stops arranged in a circular arc:

- discover;
- create;
- active;
- history;
- profile.

### Interaction

- click a section to travel to it;
- keyboard arrow keys move between sections;
- the active section is indicated by a bright accent node on the orbital;
- inactive sections are dim trace nodes;
- hover reveals the section label;
- the ring does not scroll with the page.

### Mobile

Use a compact indexed horizontal rail with five stops at the bottom of the viewport. Preserve node visual language — each stop is a small circle, active stop uses accent colour. No hamburger menu.

---

## 29. Observatory (home / discover)

The observatory is a live view of all active subjects as floating circuit boards in deep space.

### Layout

Each active subject is a compact circuit board tile showing:

- subject title;
- player count and available slots;
- observation window timer;
- number of nodes across all committed lattices;
- visual overlay of committed (but unsealed) lattice shapes;
- entry stake;
- evidence policy icon.

### Sorting and filtering

Use a signal rail at the top of the observatory:

- newest subjects;
- closing soon;
- most players;
- awaiting minimum players;
- resolution pending;
- recently resolved.

Filters use indexed slot controls, not pill buttons.

### Subject detail

Clicking a subject expands it into the circuit inspection view without leaving the observatory. The rest of the boards dim but remain visible.

---

## 30. Subject creation experience

The user assembles a subject configuration instrument.

### Stage 1 — Subject definition

Fields:

- subject title;
- primary entity;
- subject description;
- observation start and end;
- evidence cut-off;
- minimum and maximum players;
- stake amount.

These values appear as engraved data labels on a dark configuration panel.

### Stage 2 — Evidence policy

The user inserts source class filters into indexed slots on an evidence cassette. Each slot corresponds to a source tier and type: primary, independent, contextual, archive, on-chain, repository, regulator, governing body.

Use slot toggles, not dropdowns.

### Stage 3 — Constitution calibration

Each policy field uses a binary toggle or indexed dial. Partial confirmation policy, insufficient evidence policy, minimum primary source expectation and appeal rules are configured here.

### Stage 4 — Adjudicability review

The subject is submitted to GenLayer for review. Show a calibration sequence: each criterion animates through its check. Issues appear as misaligned node warnings on the relevant field.

### Stage 5 — Open and bond

The proposer seals the subject with a creation bond. The circuit board appears in the observatory as awaiting players.

---

## 31. Circuit builder (player lattice construction)

After joining a subject, the player builds their claim lattice on a personal circuit canvas.

### Canvas

A dark grid canvas. The player places nodes by clicking grid intersections.

Node placement controls:

- click to add a terminal node;
- drag from a node to another to create a dependency edge;
- right-click a node to set its type (conditional, inverse, conjunctive, disjunctive);
- click a node to edit its claim text;
- drag a node to reposition it.

### Weight allocation

Each node shows a surrounding arc indicating its weight. Total must equal 100.

Weight controls:

- click the arc to type a numeric weight;
- drag the arc endpoint to adjust weight visually;
- a weight balance meter shows remaining unallocated points;
- the balance must read exactly zero before commitment is allowed.

### Graph validation

Real-time validation:

- cycle detection (highlight circular dependency in warning colour);
- weight total (show running total, flag if not 100);
- minimum and maximum node count;
- invalid node text (too long, empty).

Validation issues appear as node state warnings, not modal popups.

### Commit

When the lattice is valid, the commit action seals it. A crystallisation animation locks the circuit canvas. The recovery package exports automatically.

---

## 32. Active circuit room

The circuit room is the product's signature scene. It shows all players' lattices overlaid on a shared canvas.

### Before reveal

Each player's committed lattice appears as an encrypted shape — visible graph topology (number and arrangement of nodes, dependency edges) but with sealed node text.

### After reveal

Node text materialises. Each player's lattice is visible in their accent colour. Players can toggle between individual lattice views and the full overlay.

### During resolution

Nodes resolve sequentially:

1. terminal nodes first;
2. propagation through dependent nodes in dependency order;
3. each resolved node adopts its state colour;
4. traces animate current direction toward children when parent confirms;
5. traces extinguish when parent is contradicted.

### Score display

A live score rail at the side of the canvas shows each player's accumulating cipher score as nodes resolve. No ranking label until finality.

### Layout

```
LEFT PANEL           CENTRE CANVAS         RIGHT PANEL
Player list          Circuit overlay        Score accumulator
Subject info         Node details           Evidence feed
Timeline             Propagation state      Appeal controls
```

Mobile: single panel with tab navigation between player lattice, circuit overlay and score view.

---

## 33. Node inspector

Selecting a node in the circuit room opens the node inspector panel.

Contents:

- node ID and text;
- node type;
- declared weight;
- redistributed weight (if any collapse occurred);
- parent dependencies and their resolution state;
- evidence items gathered for this node;
- assessment class;
- resolution multiplier applied;
- contribution to player's cipher score;
- rationale (after finality).

Evidence items are displayed as compact evidence tiles, not slides. Each tile shows domain, tier, publication time and support direction.

---

## 34. Resolution theatre

The interface explains the GenLayer process without fabricated live reasoning.

### Stage 1 — Observation closed

A signal pulse closes the observation window marker on the timeline rail.

### Stage 2 — Evidence gathered

The evidence feed populates with retrieved items per node.

### Stage 3 — Node resolution begins

Terminal nodes resolve first. Each node flickers then settles into its state colour.

### Stage 4 — Propagation

Current flows forward through confirmed traces. Collapsed children dim in sequence.

### Stage 5 — Scores accumulate

The score rail updates as each node contributes. No celebratory animation until all nodes are settled.

### Stage 6 — Provisional scores

The circuit displays:

```
PROVISIONAL SCORES
```

The appeal timer activates as a visible countdown arc.

### Stage 7 — Final scores

After appeal window or successful finalization:

```
CIRCUIT RESOLVED
```

The final state of the circuit is locked and permanently visible.

### Stage 8 — Payout distribution

A distribution panel shows each player's score, proportional share and GEN amount. No confetti. No trophy. No green banner.

---

## 35. Score certificate

The score certificate is the shareable outcome artefact.

It should resemble a printed circuit analysis report.

### Contents

- subject title;
- all player lattices with node states;
- per-node resolution class and rationale;
- decisive evidence per node;
- cipher scores;
- payout distribution;
- appeal history;
- contract address and transaction reference;
- timestamp;
- resolution digest.

### Export

Provide:

- web view;
- 16:9 social image;
- square social image;
- print layout.

The shareable object must not resemble a betting slip or a leaderboard.

---

## 36. Profile system

Each user receives a circuit fingerprint generated from their public prediction history.

### Inputs

- average cipher score;
- node type usage distribution;
- dependency depth preference;
- partial confirmation rate;
- appeal rate;
- subject category concentration;
- weight allocation pattern.

### Output

A unique circuit diagram generated deterministically from public metrics. The pattern changes as performance metrics change. It is not a biometric identity.

### Profile layout

- circuit fingerprint (top);
- score history chart;
- strongest subject categories;
- node type accuracy breakdown;
- recent subjects as compact tiles;
- weight strategy signature.

---

## 37. History system

History is a scrollable constellation map.

Each completed subject is a star node in the constellation. Nodes are positioned by date on a scrollable timeline axis and by cipher score on the vertical axis.

Constellation features:

- stars connected by thin traces showing subject sequences;
- hover reveals subject title, score and date;
- click to open the score certificate;
- filter by subject category, score range and date range;
- zoom in and out on the timeline.

Mobile: vertical list of compact subject tiles. Each tile shows the circuit summary and score.

---

## 38. Transaction UX

Every write action is shown as a signal sequence.

```
CHARGE
SIGN
TRANSMIT
PROPAGATE
PROVISIONAL
LOCKED
```

### Transaction panel

Show:

- action description;
- wallet state;
- transaction hash;
- current network status;
- receipt link;
- retryability;
- contract state after acceptance.

Never show success immediately after wallet signature.

### Failures

Failure opens a diagnostic panel with:

- error category prefix;
- short explanation;
- receipt link;
- stderr and stdout when available;
- safe retry action;
- preserved lattice state.

---

## 39. Empty, loading and error states

### Empty state

A dark void circuit canvas with three placeholder node outlines.

Copy:

```
No circuits are running.
```

### Loading

A signal pulse moves through a minimal trace path between two nodes.

No skeleton cards.

### Error

A node in the circuit outline illuminates in fault red.

Copy begins with the deterministic error prefix.

### Unavailable evidence node

The node displays:

```
SOURCE UNAVAILABLE
```

Node class: UNRESOLVABLE with explanation.

---

## 40. Iconography

Use line icons derived from circuit and signal diagrams.

Core icons:

- node (circle);
- trace (directed line);
- lattice (connected nodes);
- activation (lightning through node);
- collapse (crossed node);
- weight (arc segment);
- evidence tier indicator;
- appeal signal;
- withdrawal;
- seal lock;
- orbital navigation stop.

Avoid:

- trophy;
- sparkle;
- robot head;
- casino chip;
- generic lightning bolt (use activation-specific form);
- shield unless required for safety context.

---

## 41. Accessibility

- all node placement has keyboard equivalent (arrow keys to position, enter to confirm);
- all weight allocation has numeric input alternative;
- dependency edges have list alternative (parent ID selector);
- focus changes are announced to screen readers;
- player identity uses colour plus player label;
- reduced motion is complete and understandable;
- sound is optional;
- visible focus rings on all interactive elements;
- minimum 4.5:1 text contrast on all surfaces;
- no critical meaning conveyed by colour alone;
- evidence tiles have list alternatives;
- score certificate is accessible as structured text;
- screen reader users can follow the full lifecycle.

---

## 42. Responsive behaviour

### 1440 px and above

Full circuit canvas with side panels. Orbital navigation visible.

### 1024–1439 px

Condensed circuit canvas. Side panels collapse to icon strips with flyout.

### 768–1023 px

Circuit canvas becomes full-width stacked layout. Node inspector below canvas.

### 430–767 px

Single-panel view. Player lattice, circuit overlay and score view available via tab rail. Nodes larger with touch targets minimum 44px.

### 320–429 px

Simplified node list view. Circuit canvas replaced by structured node list. All data remains accessible.

Test at:

```
320
375
430
768
1024
1440
1920
```

---

## 43. Frontend architecture

Recommended stack:

- Next.js App Router;
- TypeScript strict mode;
- Tailwind CSS;
- selective shadcn primitives (never as primary layout);
- GenLayerJS 1.1.8;
- Framer Motion for circuit propagation animations only;
- CSS transforms for node state changes;
- SVG for circuit canvas and trace rendering;
- Canvas for interference fingerprints and complex lattice effects only;
- Vercel deployment.

### Core routes

```
/
/discover
/subjects/new
/subjects/[subjectId]
/subjects/[subjectId]/join
/subjects/[subjectId]/build
/subjects/[subjectId]/commit
/subjects/[subjectId]/reveal
/subjects/[subjectId]/circuit
/subjects/[subjectId]/resolution
/subjects/[subjectId]/appeal
/subjects/[subjectId]/certificate
/portfolio
/profile/[address]
/how-it-works
/safety
```

### Required frontend states

- wallet confirmation required;
- lattice submitted;
- lattice pending;
- lattice accepted;
- resolution pending;
- provisional scores;
- finalized;
- failed;
- retryable failure;
- explorer link available.

---

## 44. Required component system

```
CircuitCanvas
NodeHousing
TraceEdge
TracePath
TraceAnimator
LatticeOverlay
NodeInspector
NodeTypeSelector
WeightArc
WeightBalance
DependencyPanel
EvidenceFeed
EvidenceTile
ScoreRail
ScoreReadout
PropagationSequencer
CircuitSeal
ConstellationMap
ConstellationStar
ScoreCertificate
CipherFingerprint
SignalLoader
SignalRail
OrbitalNav
OrbitalStop
TransactionPanel
DiagnosticPanel
SubjectBoard
SubjectTile
PlayerMarker
EvidenceSlot
ConstitutionPanel
AppealPanel
```

No component may default to a rounded card.

---

## 45. Data and privacy

- settled subject terms are public;
- lattice commitment hashes are public before reveal;
- lattice content becomes public after reveal;
- salts must never be reused;
- no private information may appear in claim text;
- analytics must not capture lattice secrets;
- local persistence of recovery packages must be documented;
- users must be warned about irreversible publication of lattice content.

---

## 46. Testing strategy

### Direct contract tests

Cover:

- subject creation;
- adjudicability review pass and rejection;
- player joining and stake enforcement;
- commitment and reveal;
- graph validation (cycles, weight sum, node count);
- node type activation rules;
- propagation correctness;
- weight redistribution arithmetic;
- score calculation;
- proportional payout formula;
- minimum threshold enforcement;
- reveal default;
- appeal;
- finalization;
- withdrawal;
- storage regression;
- malformed resolution outputs.

### Integration tests

Cover:

- clear node confirmation end to end;
- partial confirmation with redistribution;
- conditional node collapse cascade;
- conjunctive node with one parent failing;
- contradicted terminal with dependent children;
- insufficient evidence on a node;
- near-equal scores across players;
- validator equivalence on scores within ±5;
- StudioNet deployment smoke test;
- receipt inspection.

### Frontend tests

Cover:

- canonical lattice commitment;
- cycle detection in graph builder;
- weight balance validation;
- recovery package;
- transaction state mapping;
- keyboard lattice builder;
- reduced motion;
- responsive circuit canvas;
- node inspector data;
- wrong network handling;
- stale address handling.

---

## 47. MVP scope

Includes:

- open circuit mode;
- two to six players;
- equal native GEN stakes;
- three to seven nodes per lattice;
- 100 weight points;
- five node types;
- adjudicability review;
- source constitution;
- commit-reveal;
- observation window;
- per-node LLM resolution;
- dependency propagation;
- weight redistribution on collapse;
- proportional payout;
- minimum score threshold;
- one appeal per player;
- tie handling (all equal scores);
- void;
- insufficient evidence;
- pull withdrawal;
- public score certificate;
- circuit fingerprint profile;
- constellation history;
- StudioNet deployment;
- direct and integration tests.

Does not include:

- ERC-20 stakes;
- anchor, relay, null or synthesis modes;
- more than six players;
- observer staking;
- AMMs;
- native mobile app;
- private subjects;
- governance token;
- NFTs;
- cross-chain settlement;
- leverage;
- production legal launch.

---

## 48. Success criteria

The project is successful when:

1. a proposer can create a resolvable subject and open it to players;
2. GenLayer can reject ambiguous or participant-controlled subjects;
3. players can independently build valid directed acyclic claim lattices;
4. dependency rules correctly activate and collapse child nodes;
5. weight redistribution on collapse produces correct scores;
6. proportional payout distributes correctly across eligible players;
7. live public evidence is gathered per node under explicit equivalence;
8. insufficient evidence, void and minimum threshold paths are supported;
9. provisional and final score states are distinct;
10. withdrawal succeeds exactly once per eligible player;
11. the circuit canvas feels like a live logic diagram, not a form;
12. the interface does not resemble Parallax, any prior betting product or any prior GenLayer project;
13. contract lint and tests pass;
14. StudioNet deployment is verified;
15. no GenLayerJS method is guessed;
16. limitations are documented honestly.

---

## 49. Product positioning

CIPHER is:

> A multi-player compound prediction protocol where players construct dependency-linked claim lattices about real-world events and GenLayer determines how much of each player's logical model reality confirmed.

CIPHER is not:

- an adversarial two-player duel;
- a winner-takes-all bet;
- an AI casino;
- a truth oracle;
- a sportsbook;
- a trading terminal;
- a deterministic scoring engine;
- a generic dashboard.

---

## 50. Final one-line concept

**CIPHER is where players build logical models of the future, stake on their accuracy, and GenLayer runs reality through the circuit.**

---

## 51. Official implementation references

Use current official sources during implementation:

- GenLayer skills: https://skills.genlayer.com/
- GenLayer documentation: https://docs.genlayer.com/
- Full documentation text: https://docs.genlayer.com/full-documentation.txt
- GenLayerJS API reference: https://sdk.genlayer.com/main/_static/ai/api.txt
- GenLayer project boilerplate: https://github.com/genlayerlabs/genlayer-project-boilerplate
- GenLayer Gym: https://gym.genlayer.foundation
- Intelligent Oracle: https://intelligentoracle.com

Verify APIs at build time. Never invent a method name.
