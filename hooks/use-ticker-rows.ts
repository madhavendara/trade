"use client";

import { useEffect, useRef, useState } from "react";
import { useTickerStore } from "@/lib/ticker-store";
import { SYMBOLS } from "@/lib/binance";

export type TickerRow = {
  symbol: string;
  price: number;
  open: number;
  changePct: number;
  volume: number;
  quoteVolume: number;
  flash: "up" | "down" | null;
};

export function useTickerRows() {
  const storeRows = useTickerStore((s) => s.rows);
  const [flashMap, setFlashMap] = useState<Record<string, "up" | "down" | null>>({});
  const prevPricesRef = useRef<Record<string, number>>({});
  const flashTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const newFlashes: Record<string, "up" | "down"> = {};

    for (const [sym, row] of Object.entries(storeRows)) {
      const prev = prevPricesRef.current[sym];
      if (prev !== undefined && row.price !== prev) {
        newFlashes[sym] = row.price > prev ? "up" : "down";
      }
      prevPricesRef.current[sym] = row.price;
    }

    if (Object.keys(newFlashes).length === 0) return;

    setFlashMap((fm) => ({ ...fm, ...newFlashes }));

    for (const sym of Object.keys(newFlashes)) {
      if (flashTimersRef.current[sym]) clearTimeout(flashTimersRef.current[sym]);
      flashTimersRef.current[sym] = setTimeout(() => {
        setFlashMap((fm) => ({ ...fm, [sym]: null }));
      }, 650);
    }
  }, [storeRows]);

  useEffect(() => {
    const timers = flashTimersRef.current;
    return () => { Object.values(timers).forEach(clearTimeout); };
  }, []);

  const ordered = SYMBOLS.map((s) => {
    const row = storeRows[s];
    if (!row) return null;
    return {
      ...row,
      changePct: ((row.price - row.open) / row.open) * 100,
      flash: flashMap[s] ?? null,
    } as TickerRow;
  }).filter(Boolean) as TickerRow[];

  return { ordered };
}
