"use client";

import { cva } from "class-variance-authority";
import { useTickerRows } from "@/hooks/use-ticker-rows";
import { useDashboardStore } from "@/lib/store";
import { StatStrip } from "./stat-strip";
import { PriceChart } from "./price-chart";
import { TopGainers, TopLosers } from "./top-movers";
import { SymbolBrowser } from "./symbol-browser";

// ── CVA ──────────────────────────────────────────────────────

const outerBase   = cva("flex flex-col gap-4 min-[1200px]:h-full");
const panelRow    = cva("flex flex-col min-[1200px]:flex-row gap-4 min-h-0");
const browserWrap = cva("flex flex-col h-[440px] min-[1200px]:h-auto min-[1200px]:flex-1 min-[1200px]:min-h-0");
const chartWrap   = cva("overflow-hidden min-[1200px]:flex-1 min-[1200px]:min-w-0");
const moversRow   = cva("grid grid-cols-1 min-[1200px]:grid-cols-2 gap-4");

// ─────────────────────────────────────────────────────────────

export function OverviewTab() {
  const { ordered } = useTickerRows();
  const { selectedSymbol } = useDashboardStore();

  return (
    <div className={outerBase()}>
      <StatStrip ordered={ordered} />

      {/* Symbol browser + Chart — side-by-side ≥1200px, stacked below */}
      <div className={panelRow()}>
        <div className={browserWrap()}>
          <SymbolBrowser />
        </div>
        <div className={chartWrap()}>
          <PriceChart symbol={selectedSymbol} />
        </div>
      </div>

      {/* Gainers and Losers as separate cards */}
      <div className={moversRow()}>
        <TopGainers />
        <TopLosers />
      </div>
    </div>
  );
}
