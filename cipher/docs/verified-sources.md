# CIPHER — Verified GenLayer API Sources

Verified from: `https://docs.genlayer.com/full-documentation.txt` and local glsim source.

## Contract Header
```python
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
```

## Storage Types
- `TreeMap[K, V]` — persistent key-value map
- `u256` — 256-bit unsigned integer; arithmetic: `u256(int(x) + int(y))`
- `Address` — address type; `Address(hex_str)`; `.as_hex` for string
- `@allow_storage @dataclass` — custom storable struct
- Composite key for TreeMap: `f"{id}:{addr}"` as `str`

## Decorators
- `@gl.public.view` — read-only, no state mutation
- `@gl.public.write` — state-mutating write
- `@gl.public.write.payable` — write that accepts GEN value

## Message Context
- `gl.message.sender_address` — caller Address
- `gl.message.value` — u256 GEN sent (only in payable methods)
- `gl.message.contract_address` — this contract's address

## Value / GEN Transfer
```python
# Receive GEN in a method:
@gl.public.write.payable
def deposit(self) -> None:
    v = gl.message.value
    # v is u256 in wei

# Read own balance:
bal = self.balance  # u256

# Send GEN to EOA or EVM address (withdrawal):
@gl.evm.contract_interface
class _EOARecipient:
    class View: pass
    class Write: pass

_EOARecipient(Address(recipient_hex)).emit_transfer(value=u256(amount))

# Send GEN to another IC:
other = gl.get_contract_at(recipient_address)
other.emit_transfer(value=u256(amount), on='finalized')
```

## Non-Deterministic
```python
# Web fetch:
html = gl.nondet.web.render(url, mode="text")

# LLM call:
result_str = gl.nondet.exec_prompt(prompt, response_format="json")

# Custom equivalence:
def leader_fn():
    return {"result": ...}

def validator_fn(leader_result):
    if not isinstance(leader_result, glvm.Return):
        return False
    return validate(leader_result.value)

glvm.run_nondet_unsafe(leader_fn, validator_fn)

# Strict equivalence wrapper:
gl.eq_principle.strict_eq(leader_fn)
```

## Error / Revert
```python
raise Exception("LATTICE: weight sum must be 100")
# Prefix convention: LATTICE:, CIPHER:, LLM_ERROR:, CONSENSUS_OUTPUT:
```

## GenLayerJS (v1.1.8)
```typescript
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
// Chain ID: 61999, RPC: https://studio.genlayer.com/api

const client = createClient({ chain: studionet, account: address });

// Read:
const result = await client.readContract({ address, functionName, args: [] });

// Write (with GEN value):
const hash = await client.writeContract({
  address, functionName, args: [...],
  value: BigInt("1000000000000000000"), // 1 GEN in wei
});

// Receipt:
const receipt = await client.waitForTransactionReceipt({
  hash, status: "ACCEPTED" as any, retries: 24, interval: 5000,
});
```

## MetaMask / Injected Wallet
```typescript
await window.ethereum.request({
  method: "wallet_addEthereumChain",
  params: [{ chainId: "0xF23F", chainName: "StudioNet",
    rpcUrls: ["https://studio.genlayer.com/api"],
    nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 } }],
});
const [address] = await window.ethereum.request({ method: "eth_requestAccounts" });
```
