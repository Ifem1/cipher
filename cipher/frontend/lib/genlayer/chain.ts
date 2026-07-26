import { studionet } from "genlayer-js/chains";

export const CIPHER_CHAIN = studionet;
export const CIPHER_CHAIN_ID = 61999;
export const CIPHER_RPC = "https://studio.genlayer.com/api";

export const CIPHER_CHAIN_PARAMS = {
  chainId: `0x${CIPHER_CHAIN_ID.toString(16)}`,
  chainName: "StudioNet",
  rpcUrls: [CIPHER_RPC],
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
};

/** Ensure MetaMask is on StudioNet. */
export async function ensureStudioNet(): Promise<void> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No injected wallet found. Install MetaMask.");
  }
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CIPHER_CHAIN_PARAMS.chainId }],
    });
  } catch (e: unknown) {
    const error = e as { code?: number };
    if (error.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [CIPHER_CHAIN_PARAMS],
      });
    } else {
      throw e;
    }
  }
}

/** Request wallet accounts. */
export async function requestAccounts(): Promise<string[]> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No injected wallet found.");
  }
  return window.ethereum.request({ method: "eth_requestAccounts" }) as Promise<string[]>;
}
