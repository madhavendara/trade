import { useMemo } from "react";
import { useExchangeInfo } from "./use-exchange-info";
import { useTicker24hr } from "./use-ticker-24hr";
import type { SymbolInfo, Ticker24hr } from "@/lib/binance";

export type TrendType = "Gainers" | "Losers" | "Flat";
export type VolumeTierType = "High" | "Mid" | "Low";

export type EnrichedSymbol = {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  permissions: string[];
  lastPrice: number;
  priceChangePercent: number;
  quoteVolume: number;
  trend: TrendType;
  volumeTier: VolumeTierType;
};

export type FacetCounts = {
  status: Record<string, number>;
  quoteAssets: Record<string, number>;
  permissions: Record<string, number>;
  trend: Record<TrendType, number>;
  volumeTier: Record<VolumeTierType, number>;
};

function classifyTrend(pct: number): TrendType {
  if (pct > 0.5) return "Gainers";
  if (pct < -0.5) return "Losers";
  return "Flat";
}

function classifyVolumeTier(quoteVolume: number): VolumeTierType {
  if (quoteVolume >= 10_000_000) return "High";
  if (quoteVolume >= 1_000_000) return "Mid";
  return "Low";
}

function enrich(info: SymbolInfo, ticker: Ticker24hr): EnrichedSymbol {
  const pct = parseFloat(ticker.priceChangePercent);
  const vol = parseFloat(ticker.quoteVolume);
  return {
    symbol: info.symbol,
    baseAsset: info.baseAsset,
    quoteAsset: info.quoteAsset,
    status: info.status,
    permissions: info.permissions,
    lastPrice: parseFloat(ticker.lastPrice),
    priceChangePercent: pct,
    quoteVolume: vol,
    trend: classifyTrend(pct),
    volumeTier: classifyVolumeTier(vol),
  };
}

export function useSymbolData() {
  const { data: exchangeInfo, isLoading: eiLoading } = useExchangeInfo();
  const { data: tickers, isLoading: tkLoading } = useTicker24hr();

  const enriched = useMemo<EnrichedSymbol[]>(() => {
    if (!exchangeInfo || !tickers) return [];

    const tickerMap = new Map<string, Ticker24hr>(tickers.map((t) => [t.symbol, t]));

    const result: EnrichedSymbol[] = [];
    for (const info of exchangeInfo.symbols) {
      const ticker = tickerMap.get(info.symbol);
      if (!ticker) continue;
      result.push(enrich(info, ticker));
    }
    // Sort by quoteVolume descending by default
    result.sort((a, b) => b.quoteVolume - a.quoteVolume);
    return result;
  }, [exchangeInfo, tickers]);

  const facetCounts = useMemo<FacetCounts>(() => {
    const status: Record<string, number> = {};
    const quoteAssets: Record<string, number> = {};
    const permissions: Record<string, number> = {};
    const trend: Record<TrendType, number> = { Gainers: 0, Losers: 0, Flat: 0 };
    const volumeTier: Record<VolumeTierType, number> = { High: 0, Mid: 0, Low: 0 };

    for (const s of enriched) {
      status[s.status] = (status[s.status] ?? 0) + 1;
      quoteAssets[s.quoteAsset] = (quoteAssets[s.quoteAsset] ?? 0) + 1;
      for (const p of s.permissions) {
        permissions[p] = (permissions[p] ?? 0) + 1;
      }
      trend[s.trend]++;
      volumeTier[s.volumeTier]++;
    }

    return { status, quoteAssets, permissions, trend, volumeTier };
  }, [enriched]);

  return {
    enriched,
    facetCounts,
    isLoading: eiLoading || tkLoading,
  };
}
