"use client";

import { cva } from "class-variance-authority";
import { Plus, Check, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTopMovers } from "@/hooks/use-top-movers";
import { useDashboardStore } from "@/lib/store";
import type { Ticker24hr } from "@/lib/binance";

// ── CVA ──────────────────────────────────────────────────────

const titleRow   = cva("flex items-center gap-2 text-[14px]");
const contentPad = cva("p-0");
const emptyMsg   = cva("py-8 text-center text-[14px] text-muted-foreground");
const listBody   = cva("divide-y divide-border/30");
const listRow    = cva("flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors");
const symbolText = cva("font-mono text-[14px] font-medium flex-1");
const priceText  = cva("font-mono text-[14px] text-muted-foreground w-28 text-right");

const pctVariants = cva("font-mono text-[14px]", {
  variants: {
    positive: { true: "text-emerald-400", false: "text-red-400" },
  },
});

// ─────────────────────────────────────────────────────────────

export function TopGainers() {
  const { data, isLoading } = useTopMovers();
  const { watchlist, addToWatchlist, setSelectedSymbol } = useDashboardStore();
  return (
    <Card>
      <CardHeader>
        <CardTitle className={titleRow()}>
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          Top Gainers
        </CardTitle>
      </CardHeader>
      <CardContent className={contentPad()}>
        <MoverList
          items={data?.gainers ?? []}
          isLoading={isLoading}
          positive
          watchlist={watchlist}
          onWatch={addToWatchlist}
          onSelect={setSelectedSymbol}
        />
      </CardContent>
    </Card>
  );
}

export function TopLosers() {
  const { data, isLoading } = useTopMovers();
  const { watchlist, addToWatchlist, setSelectedSymbol } = useDashboardStore();
  return (
    <Card>
      <CardHeader>
        <CardTitle className={titleRow()}>
          <TrendingDown className="h-4 w-4 text-red-400" />
          Top Losers
        </CardTitle>
      </CardHeader>
      <CardContent className={contentPad()}>
        <MoverList
          items={data?.losers ?? []}
          isLoading={isLoading}
          positive={false}
          watchlist={watchlist}
          onWatch={addToWatchlist}
          onSelect={setSelectedSymbol}
        />
      </CardContent>
    </Card>
  );
}

function MoverList({ items, isLoading, positive, watchlist, onWatch, onSelect }: {
  items: Ticker24hr[];
  isLoading: boolean;
  positive: boolean;
  watchlist: string[];
  onWatch: (s: string) => void;
  onSelect: (s: string) => void;
}) {
  if (isLoading) return <div className={emptyMsg()}>Loading...</div>;
  return (
    <div className={listBody()}>
      {items.map((t) => {
        const pct = parseFloat(t.priceChangePercent);
        const inList = watchlist.includes(t.symbol);
        return (
          <div key={t.symbol} className={listRow()} onClick={() => onSelect(t.symbol)}>
            <span className={symbolText()}>{t.symbol}</span>
            <span className={pctVariants({ positive: pct >= 0 })}>
              {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
            </span>
            <span className={priceText()}>
              ${parseFloat(t.lastPrice).toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </span>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onWatch(t.symbol); }}
            >
              {inList
                ? <Check className="h-3.5 w-3.5 text-violet-400" />
                : <Plus className="h-3.5 w-3.5" />}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
