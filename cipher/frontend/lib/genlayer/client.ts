import { createClient } from "genlayer-js";
import { CIPHER_CHAIN } from "./chain";

export function createCipherClient(address?: string) {
  const config: Record<string, unknown> = { chain: CIPHER_CHAIN };
  if (address) config.account = address as `0x${string}`;
  return createClient(config);
}

export type CipherClient = ReturnType<typeof createCipherClient>;
