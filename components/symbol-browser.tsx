"use client";

import { useMemo, useRef } from "react";
import { cva } from "class-variance-authority";
import { Plus, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSymbolData, type EnrichedSymbol } from "@/hooks/use-symbol-data";
import { useDashboardStore, type SymbolFilters } from "@/lib/store";

// ── CVA ──────────────────────────────────────────────────────

const cardBase      = cva("flex flex-col flex-1");
const headerBase    = cva("shrink-0 pb-2");
const titleRow      = cva("flex items-center gap-2 text-[14px]");
const resultBadge   = cva("font-mono text-[14px]");
const topCountNote  = cva("text-[14px] text-muted-foreground");
const contentBase   = cva("flex-1 relative overflow-hidden p-0");
const scrollInner   = cva("absolute inset-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#454447_transparent]");
const colHeader     = cva("shrink-0 grid grid-cols-[1fr_80px_64px_60px_36px] items-center border-b border-border/40 px-3 py-2 text-[14px] text-muted-foreground");
const emptyMsg      = cva("py-8 text-center text-[14px] text-muted-foreground");
const symbolCell    = cva("flex flex-col min-w-0");
const symbolName    = cva("truncate font-medium leading-tight text-[14px]");
const badgeList     = cva("flex items-center gap-1 mt-0.5");
const priceCell     = cva("text-right tabular-nums text-[14px] text-muted-foreground");
const volCell       = cva("text-right text-[14px] text-muted-foreground");

const rowVariants   = cva(
  "grid grid-cols-[1fr_80px_64px_60px_36px] cursor-pointer items-center border-b border-border/30 px-3 py-2 font-mono transition-colors hover:bg-white/5",
  {
    variants: {
      selected: { true: "bg-violet-500/10", false: "" },
    },
    defaultVariants: { selected: false },
  }
);

const pctVariants   = cva("text-right tabular-nums text-[14px]", {
  variants: {
    positive: { true: "text-emerald-400", false: "text-red-400" },
  },
});

// ─────────────────────────────────────────────────────────────

const MAX_DISPLAY = 100;

function applyFilters(symbols: EnrichedSymbol[], filters: SymbolFilters, watchlist: string[]): EnrichedSymbol[] {
  return symbols.filter((s) => {
    if (filters.watchlistOnly && !watchlist.includes(s.symbol)) return false;
    if (filters.status.length > 0 && !filters.status.includes(s.status)) return false;
    if (filters.quoteAssets.length > 0 && !filters.quoteAssets.includes(s.quoteAsset)) return false;
    if (filters.permissions.length > 0 && !filters.permissions.some((p) => s.permissions.includes(p))) return false;
    if (filters.trend.length > 0 && !filters.trend.includes(s.trend)) return false;
    if (filters.volumeTier.length > 0 && !filters.volumeTier.includes(s.volumeTier)) return false;
    return true;
  });
}

export function SymbolBrowser() {
  const { enriched, isLoading } = useSymbolData();
  const { filters, watchlist, selectedSymbol, setSelectedSymbol, addToWatchlist, removeFromWatchlist } =
    useDashboardStore();

  const initialSymbol = useRef(selectedSymbol);

  const filtered = useMemo(() => applyFilters(enriched, filters, watchlist), [enriched, filters, watchlist]);
  // Only hoist on first load: pin the initial symbol near the top once, never again.
  // selectedSymbol is intentionally excluded from deps — reordering on every selection
  // is the bug we're fixing.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const visible = useMemo(() => {
    const arr = [...filtered];
    const idx = arr.findIndex((s) => s.symbol === initialSymbol.current);
    if (idx > 1) {
      const [sel] = arr.splice(idx, 1);
      arr.unshift(sel);
    }
    return arr.slice(0, MAX_DISPLAY);
  }, [filtered]);
  const totalCount = filtered.length;
  const fmt = Intl.NumberFormat("en", { notation: "compact" });

  return (
    <Card className={cardBase()}>
      {/* Header — shrink-0 so it never compresses */}
      <CardHeader className={headerBase()}>
        <CardTitle className={titleRow()}>
          Symbols
          <Badge variant="outline" className={resultBadge()}>
            {isLoading ? "…" : `${totalCount.toLocaleString()} results`}
          </Badge>
          {totalCount > MAX_DISPLAY && (
            <span className={topCountNote()}>showing top {MAX_DISPLAY} by volume</span>
          )}
        </CardTitle>
      </CardHeader>

      {/* Column header — shrink-0 */}
      <div className={colHeader()}>
        <span>Symbol</span>
        <span className="text-right">Price</span>
        <span className="text-right">24h %</span>
        <span className="text-right">Vol</span>
        <span />
      </div>

      {/* Scroll area — flex-1 relative, scroll div fills it absolutely */}
      <CardContent className={contentBase()}>
        <div className={scrollInner()}>
          {isLoading && <div className={emptyMsg()}>Loading symbols…</div>}
          {!isLoading && visible.length === 0 && (
            <div className={emptyMsg()}>No symbols match the current filters.</div>
          )}
          {visible.map((s) => {
            const inWatchlist = watchlist.includes(s.symbol);
            return (
              <div
                key={s.symbol}
                onClick={() => setSelectedSymbol(s.symbol)}
                className={rowVariants({ selected: s.symbol === selectedSymbol })}
              >
                <div className={symbolCell()}>
                  <span className={symbolName()}>{s.symbol}</span>
                  <div className={badgeList()}>
                    {s.status !== "TRADING" && <Badge variant="warning" size="sm">{s.status}</Badge>}
                    {s.permissions.includes("LEVERAGED") && <Badge variant="info" size="sm">3L/3S</Badge>}
                    {s.permissions.includes("MARGIN") && !s.permissions.includes("LEVERAGED") && (
                      <Badge variant="muted" size="sm">M</Badge>
                    )}
                  </div>
                </div>
                <span className={priceCell()}>
                  {s.lastPrice < 0.01
                    ? s.lastPrice.toFixed(6)
                    : s.lastPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </span>
                <span className={pctVariants({ positive: s.priceChangePercent >= 0 })}>
                  {s.priceChangePercent >= 0 ? "+" : ""}{s.priceChangePercent.toFixed(2)}%
                </span>
                <span className={volCell()}>${fmt.format(s.quoteVolume)}</span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="justify-self-end"
                  onClick={(e) => {
                    e.stopPropagation();
                    inWatchlist ? removeFromWatchlist(s.symbol) : addToWatchlist(s.symbol);
                  }}
                >
                  {inWatchlist
                    ? <Star className="h-3.5 w-3.5 fill-violet-400 text-violet-400" />
                    : <Plus className="h-3.5 w-3.5 text-muted-foreground" />}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
