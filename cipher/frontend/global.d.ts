interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
  selectedAddress?: string;
  isMetaMask?: boolean;
}

interface Window {
  ethereum?: EthereumProvider;
}
