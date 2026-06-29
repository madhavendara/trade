import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SYMBOLS } from "./binance";

export type SymbolFilters = {
  status: string[];
  quoteAssets: string[];
  permissions: string[];
  trend: string[];
  volumeTier: string[];
  watchlistOnly: boolean;
};

const DEFAULT_FILTERS: SymbolFilters = {
  status: [],
  quoteAssets: [],
  permissions: [],
  trend: [],
  volumeTier: [],
  watchlistOnly: false,
};

type FilterGroup = Exclude<keyof SymbolFilters, "watchlistOnly">;

export type ActivitySide = "all" | "buy" | "sell";
export const ACTIVITY_MIN_SIZES = [0, 0.001, 0.01, 0.1] as const;
export type ActivityMinSize = (typeof ACTIVITY_MIN_SIZES)[number];
export const ACTIVITY_BOOK_DEPTHS = [10, 20, 50] as const;
export type ActivityBookDepth = (typeof ACTIVITY_BOOK_DEPTHS)[number];

interface DashboardStore {
  selectedSymbol: string;
  watchlist: string[];
  intervalsByTab: Record<string, string>;
  filters: SymbolFilters;
  activitySide: ActivitySide;
  activityMinSize: ActivityMinSize;
  activityBookDepth: ActivityBookDepth;
  mobileFilterOpen: boolean;
  setSelectedSymbol: (symbol: string) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  setTabInterval: (tab: string, interval: string) => void;
  toggleFilter: (group: FilterGroup, value: string) => void;
  setWatchlistOnly: (v: boolean) => void;
  clearFilters: () => void;
  setActivitySide: (side: ActivitySide) => void;
  setActivityMinSize: (size: ActivityMinSize) => void;
  setActivityBookDepth: (depth: ActivityBookDepth) => void;
  setMobileFilterOpen: (open: boolean) => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      selectedSymbol: SYMBOLS[0],
      watchlist: [...SYMBOLS.slice(0, 3)],
      intervalsByTab: { overview: "1m" },
      filters: DEFAULT_FILTERS,
      activitySide: "all",
      activityMinSize: 0,
      activityBookDepth: 20,
      mobileFilterOpen: false,
      setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
      addToWatchlist: (symbol) =>
        set((s) => ({
          watchlist: s.watchlist.includes(symbol)
            ? s.watchlist
            : [...s.watchlist, symbol],
        })),
      removeFromWatchlist: (symbol) =>
        set((s) => ({ watchlist: s.watchlist.filter((w) => w !== symbol) })),
      setTabInterval: (tab, interval) =>
        set((s) => ({
          intervalsByTab: { ...s.intervalsByTab, [tab]: interval },
        })),
      toggleFilter: (group, value) =>
        set((s) => {
          const current = s.filters[group];
          const next = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
          return { filters: { ...s.filters, [group]: next } };
        }),
      setWatchlistOnly: (v) =>
        set((s) => ({ filters: { ...s.filters, watchlistOnly: v } })),
      clearFilters: () => set({ filters: DEFAULT_FILTERS }),
      setActivitySide: (side) => set({ activitySide: side }),
      setActivityMinSize: (size) => set({ activityMinSize: size }),
      setActivityBookDepth: (depth) => set({ activityBookDepth: depth }),
      setMobileFilterOpen: (open) => set({ mobileFilterOpen: open }),
    }),
    {
      name: "dashboard-store",
      partialize: (s) => ({ watchlist: s.watchlist }),
    }
  )
);
