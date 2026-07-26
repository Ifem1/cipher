"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ensureStudioNet, requestAccounts } from "@/lib/genlayer/chain";
import { errorMessage } from "@/lib/errors";

interface WalletState {
  address: string | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState>({
  address: null,
  connecting: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-reconnect if already connected
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((raw) => {
          const accounts = raw as string[];
          if (accounts.length > 0) setAddress(accounts[0].toLowerCase());
        })
        .catch(() => {});

      const handleAccountsChanged = (...args: unknown[]) => {
        const accounts = args[0] as string[];
        setAddress(accounts.length > 0 ? accounts[0].toLowerCase() : null);
      };

      window.ethereum.on?.("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      await ensureStudioNet();
      const accounts = await requestAccounts();
      if (accounts.length === 0) throw new Error("No accounts returned.");
      setAddress(accounts[0].toLowerCase());
    } catch (e: unknown) {
      setError(errorMessage(e, "Connection failed."));
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  return (
    <WalletContext.Provider value={{ address, connecting, error, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
