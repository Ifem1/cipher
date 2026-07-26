import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const require = createRequire(import.meta.url);
const cliNodeModules = join(process.env.APPDATA || "", "npm", "node_modules", "genlayer", "node_modules");
const { Wallet } = require(join(cliNodeModules, "ethers"));

const contractAddress = process.env.CIPHER_CONTRACT_ADDRESS;
let subjectId = process.env.CIPHER_SUBJECT_ID || "1";
const playerAName = process.env.CIPHER_PLAYER_A_NAME || "cipher-lifecycle-20260726";
const playerBName = process.env.CIPHER_PLAYER_B_NAME || "cipher-lifecycle-b-20260726";
const playerAPassword = process.env.CIPHER_PLAYER_A_PASSWORD;
const playerBPassword = process.env.CIPHER_PLAYER_B_PASSWORD;
const homeDir = process.env.USERPROFILE || process.env.HOME;

if (!contractAddress) throw new Error("CIPHER_CONTRACT_ADDRESS is required");
if (!playerAPassword) throw new Error("CIPHER_PLAYER_A_PASSWORD is required");
if (!playerBPassword) throw new Error("CIPHER_PLAYER_B_PASSWORD is required");

function keystorePath(name) {
  return join(homeDir, ".genlayer", "keystores", `${name}.json`);
}

async function accountFromKeystore(name, password) {
  const encrypted = readFileSync(keystorePath(name), "utf8");
  const wallet = await Wallet.fromEncryptedJson(encrypted, password);
  return createAccount(wallet.privateKey);
}

function makeClient(account) {
  return createClient({ chain: studionet, account });
}

async function read(client, functionName, args = []) {
  return client.readContract({ address: contractAddress, functionName, args });
}

async function write(label, client, functionName, args = [], value = 0n) {
  console.log(`WRITE ${label}: ${functionName}`);
  const hash = await client.writeContract({
    address: contractAddress,
    functionName,
    args,
    value,
  });
  console.log(`TX ${label}: ${hash}`);
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: "ACCEPTED",
    retries: 120,
    interval: 5000,
  });
  const leader = receipt?.consensus_data?.leader_receipt?.[0]?.result;
  console.log(`RECEIPT ${label}: ${receipt?.status_name || receipt?.status} ${JSON.stringify(leader)}`);
  return { hash, receipt };
}

function commitment(latticeJson, salt) {
  return `0x${createHash("sha256").update(latticeJson + salt).digest("hex")}`;
}

const latticeA = JSON.stringify({
  nodes: [
    { id: "n1", type: "TERMINAL", weight: 50, claim: "Paris is the capital city of France." },
    { id: "n2", type: "TERMINAL", weight: 30, claim: "Nigeria is located in Africa." },
    { id: "n3", type: "CONJUNCTIVE", weight: 20 },
  ],
  edges: [
    { from: "n1", to: "n3" },
    { from: "n2", to: "n3" },
  ],
});

const latticeB = JSON.stringify({
  nodes: [
    { id: "m1", type: "TERMINAL", weight: 60, claim: "Tokyo is the capital city of Japan." },
    { id: "m2", type: "TERMINAL", weight: 20, claim: "The Pacific Ocean is larger than the Atlantic Ocean." },
    { id: "m3", type: "DISJUNCTIVE", weight: 20 },
  ],
  edges: [
    { from: "m1", to: "m3" },
    { from: "m2", to: "m3" },
  ],
});

const saltA = "cipher-lifecycle-a-20260726";
const saltB = "cipher-lifecycle-b-20260726";

const playerA = await accountFromKeystore(playerAName, playerAPassword);
const playerB = await accountFromKeystore(playerBName, playerBPassword);
const clientA = makeClient(playerA);
const clientB = makeClient(playerB);

console.log(`CONTRACT: ${contractAddress}`);
console.log(`PLAYER_A: ${playerA.address}`);
console.log(`PLAYER_B: ${playerB.address}`);

if (process.env.CIPHER_CREATE_SUBJECT === "1") {
  const createResult = await write("createSubject", clientA, "create_subject", [
    "CIPHER Full Lifecycle Test",
    "End-to-end StudioNet lifecycle smoke test using two funded accounts.",
    "CIPHER",
    "2026-07-26",
    "2026-08-02",
    2,
    2,
    "1000000000000000",
    JSON.stringify({ source_policy: "official", appeal_threshold: 3 }),
  ]);
  const readable = createResult.receipt?.consensus_data?.leader_receipt?.[0]?.result?.payload?.readable;
  if (typeof readable === "string") {
    subjectId = JSON.parse(readable);
  }
}

console.log(`SUBJECT: ${subjectId}`);
const before = await read(clientA, "get_subject", [subjectId]);
console.log(`READ before: ${JSON.stringify(before)}`);

const stakeWei = BigInt(before.stake_per_player);
const writes = {};

writes.joinA = await write("joinA", clientA, "join_circuit", [subjectId], stakeWei);
console.log(`READ after joinA: ${JSON.stringify(await read(clientA, "get_subject", [subjectId]))}`);

writes.joinB = await write("joinB", clientB, "join_circuit", [subjectId], stakeWei);
console.log(`READ after joinB: ${JSON.stringify(await read(clientA, "get_subject", [subjectId]))}`);
console.log(`READ players: ${JSON.stringify(await read(clientA, "get_player_list", [subjectId]))}`);

writes.commitA = await write("commitA", clientA, "commit_lattice", [subjectId, commitment(latticeA, saltA)]);
writes.commitB = await write("commitB", clientB, "commit_lattice", [subjectId, commitment(latticeB, saltB)]);
console.log(`READ infoA after commits: ${JSON.stringify(await read(clientA, "get_player_info", [subjectId, playerA.address]))}`);
console.log(`READ infoB after commits: ${JSON.stringify(await read(clientA, "get_player_info", [subjectId, playerB.address]))}`);

writes.revealA = await write("revealA", clientA, "reveal_lattice", [subjectId, latticeA, saltA]);
writes.revealB = await write("revealB", clientB, "reveal_lattice", [subjectId, latticeB, saltB]);
console.log(`READ after reveals: ${JSON.stringify(await read(clientA, "get_subject", [subjectId]))}`);
console.log(`READ latticeA: ${JSON.stringify(await read(clientA, "get_lattice", [subjectId, playerA.address]))}`);
console.log(`READ latticeB: ${JSON.stringify(await read(clientA, "get_lattice", [subjectId, playerB.address]))}`);

writes.resolution = await write("resolution", clientA, "request_resolution", [subjectId]);
console.log(`READ resolution report: ${JSON.stringify(await read(clientA, "get_resolution_report", [subjectId]))}`);
console.log(`READ infoA after resolution: ${JSON.stringify(await read(clientA, "get_player_info", [subjectId, playerA.address]))}`);
console.log(`READ infoB after resolution: ${JSON.stringify(await read(clientA, "get_player_info", [subjectId, playerB.address]))}`);

writes.finalize = await write("finalize", clientA, "finalize_subject", [subjectId]);
console.log(`READ after finalize: ${JSON.stringify(await read(clientA, "get_subject", [subjectId]))}`);
console.log(`READ payouts: ${JSON.stringify(await read(clientA, "get_payout_distribution", [subjectId]))}`);
console.log(`READ withdrawableA: ${JSON.stringify(await read(clientA, "get_withdrawable", [subjectId, playerA.address]))}`);
console.log(`READ withdrawableB: ${JSON.stringify(await read(clientA, "get_withdrawable", [subjectId, playerB.address]))}`);

writes.withdrawA = await write("withdrawA", clientA, "withdraw", [subjectId]);
writes.withdrawB = await write("withdrawB", clientB, "withdraw", [subjectId]);
console.log(`READ final subject: ${JSON.stringify(await read(clientA, "get_subject", [subjectId]))}`);
console.log(`READ final withdrawableA: ${JSON.stringify(await read(clientA, "get_withdrawable", [subjectId, playerA.address]))}`);
console.log(`READ final withdrawableB: ${JSON.stringify(await read(clientA, "get_withdrawable", [subjectId, playerB.address]))}`);
console.log(`SUMMARY_TXS: ${JSON.stringify(Object.fromEntries(Object.entries(writes).map(([key, value]) => [key, value.hash])))}`);
