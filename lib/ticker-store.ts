import { create } from "zustand";

export type RawTicker = {
  symbol: string;
  price: number;
  open: number;
  volume: number;
  quoteVolume: number;
};

interface TickerStore {
  rows: Record<string, RawTicker>;
  update: (row: RawTicker) => void;
}

export const useTickerStore = create<TickerStore>((set) => ({
  rows: {},
  update: (row) => set((s) => ({ rows: { ...s.rows, [row.symbol]: row } })),
}));
