"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStreamRegistry } from "@/lib/stream-registry";
import { useDashboardStore } from "@/lib/store";
import { useNotificationStore } from "@/lib/notification-store";
import { TICKER_24HR_QUERY } from "@/hooks/use-ticker-24hr";
import { fetchExchangeInfo } from "@/lib/binance";

const TOP_N = 5;

export function NotificationWatcher() {
  const registry = useStreamRegistry((s) => s.registry);
  const watchlist = useDashboardStore((s) => s.watchlist);
  const push = useNotificationStore((s) => s.push);

  // Reuses the existing React Query cache — no extra network requests
  const { data: ticker24hr } = useQuery(TICKER_24HR_QUERY);

  // Separate key so we can drive a 30s refetch without affecting the 1-hour
  // staleTime used by useExchangeInfo elsewhere in the app
  const { data: exchangeInfo } = useQuery({
    queryKey: ["exchange-info-watch"],
    queryFn: fetchExchangeInfo,
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  // ── Stream health ────────────────────────────────────────────
  const prevStreamStatusRef = useRef<Record<string, string>>({});

  useEffect(() => {
    for (const [name, info] of Object.entries(registry)) {
      const prev = prevStreamStatusRef.current[name];
      if (prev === undefined) {
        prevStreamStatusRef.current[name] = info.status;
        continue;
      }
      if (prev === info.status) continue;
      prevStreamStatusRef.current[name] = info.status;

      if (info.status === "reconnecting") {
        push({
          category: "stream",
          severity: "critical",
          title: "Stream disconnected",
          body: `${name} lost connection, reconnecting…`,
        });
      } else if (info.status === "connected" && prev === "reconnecting") {
        push({
          category: "stream",
          severity: "info",
          title: "Stream reconnected",
          body: `${name} is back online`,
        });
      }
    }
  }, [registry, push]);

  // ── Top movers ───────────────────────────────────────────────
  // ticker-24hr refreshes every 30s; the effect only runs on new data, not every WS tick
  const prevGainersRef = useRef<Set<string> | null>(null);
  const prevLosersRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!ticker24hr) return;

    const usdt = [...ticker24hr]
      .filter((t) => t.symbol.endsWith("USDT"))
      .sort((a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent));

    if (usdt.length < TOP_N) return;

    const gainers = new Set(usdt.slice(0, TOP_N).map((t) => t.symbol));
    const losers  = new Set(usdt.slice(-TOP_N).map((t) => t.symbol));

    if (prevGainersRef.current === null) {
      // Seed on first load without firing
      prevGainersRef.current = gainers;
      prevLosersRef.current  = losers;
      return;
    }

    for (const sym of gainers) {
      if (!prevGainersRef.current.has(sym)) {
        const entry = ticker24hr.find((t) => t.symbol === sym);
        const pct = entry ? parseFloat(entry.priceChangePercent) : 0;
        push({
          category: "mover",
          severity: "info",
          symbol: sym,
          title: "Entered Top Gainers",
          body: `${sym} entered Top Gainers (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)`,
        });
      }
    }

    for (const sym of losers) {
      if (!prevLosersRef.current!.has(sym)) {
        const entry = ticker24hr.find((t) => t.symbol === sym);
        const pct = entry ? parseFloat(entry.priceChangePercent) : 0;
        push({
          category: "mover",
          severity: "info",
          symbol: sym,
          title: "Entered Top Losers",
          body: `${sym} entered Top Losers (${pct.toFixed(2)}%)`,
        });
      }
    }

    prevGainersRef.current = gainers;
    prevLosersRef.current  = losers;
  }, [ticker24hr, push]);

  // ── Symbol status transitions ────────────────────────────────
  const prevSymbolStatusRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!exchangeInfo) return;

    for (const sym of watchlist) {
      const info = exchangeInfo.symbols.find((s) => s.symbol === sym);
      if (!info) continue;

      const prev = prevSymbolStatusRef.current[sym];
      if (prev === undefined) {
        prevSymbolStatusRef.current[sym] = info.status;
        continue;
      }
      if (prev === info.status) continue;
      prevSymbolStatusRef.current[sym] = info.status;

      push({
        category: "status",
        severity: info.status === "TRADING" ? "info" : "critical",
        symbol: sym,
        title: "Symbol status changed",
        body: `${sym} transitioned ${prev} → ${info.status}`,
      });
    }
  }, [exchangeInfo, watchlist, push]);

  return null;
}
