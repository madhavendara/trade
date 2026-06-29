import { create } from "zustand";

export type ChartPoint = { time: number; close: number };

interface KlineStore {
  points: Record<string, ChartPoint[]>;
  setPoints: (key: string, pts: ChartPoint[]) => void;
  pushPoint: (key: string, pt: ChartPoint, maxLen?: number) => void;
}

export const useKlineStore = create<KlineStore>((set) => ({
  points: {},
  setPoints: (key, pts) =>
    set((s) => ({ points: { ...s.points, [key]: pts } })),
  pushPoint: (key, pt, maxLen = 100) =>
    set((s) => {
      const prev = s.points[key] ?? [];
      const last = prev[prev.length - 1];
      const next =
        last?.time === pt.time
          ? [...prev.slice(0, -1), pt]
          : [...prev.slice(-(maxLen - 1)), pt];
      return { points: { ...s.points, [key]: next } };
    }),
}));

export function klineKey(symbol: string, interval: string) {
  return `${symbol}-${interval}`;
}
