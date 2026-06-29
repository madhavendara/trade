"use client";

import { useState } from "react";
import { cva } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import {
  FilterSidebar,
  SidebarSection,
  SidebarToggleGroup,
  SidebarCheckRow,
} from "@/components/filter-sidebar";
import { useSymbolData } from "@/hooks/use-symbol-data";
import { useDashboardStore, type SymbolFilters } from "@/lib/store";

// ── CVA ──────────────────────────────────────────────────────

const clearRow  = cva("flex items-center justify-end px-4 pt-3");
const clearBtn  = cva("gap-1 text-[14px] text-[#87858c] hover:text-white");
const showMore  = cva("px-5 py-2 text-[14px] text-violet-400 hover:text-violet-300 transition-colors");
const showLess  = cva("px-5 py-2 text-[14px] text-[#87858c] hover:text-white transition-colors");
const skelRow   = cva("flex items-center gap-3 px-5 py-[9px]");
const skelBox   = cva("h-4 w-4 rounded-[4px] bg-[#2a2a2b] animate-pulse");
const skelLine  = cva("h-3 flex-1 rounded bg-[#2a2a2b] animate-pulse");
const skelBadge = cva("h-4 w-7 rounded-[4px] bg-[#2a2a2b] animate-pulse");

// ─────────────────────────────────────────────────────────────

const QUOTE_TOP = 6;

const STATUS_LABELS: Record<string, string> = {
  TRADING: "Trading", BREAK: "Break", HALT: "Halt", AUCTION_MATCH: "Auction",
};
const PERMISSION_LABELS: Record<string, string> = {
  SPOT: "Spot", MARGIN: "Margin", LEVERAGED: "Leveraged",
};

type FilterGroup = Exclude<keyof SymbolFilters, "watchlistOnly">;

export function SymbolSidebar() {
  const { facetCounts, isLoading } = useSymbolData();
  const { filters, watchlist, toggleFilter, setWatchlistOnly, clearFilters } = useDashboardStore();

  const hasActive =
    filters.watchlistOnly ||
    filters.status.length > 0 ||
    filters.quoteAssets.length > 0 ||
    filters.permissions.length > 0 ||
    filters.trend.length > 0 ||
    filters.volumeTier.length > 0;

  const header = hasActive ? (
    <div className={clearRow()}>
      <Button variant="ghost" size="sm" onClick={clearFilters} className={clearBtn()}>
        Clear
      </Button>
    </div>
  ) : undefined;

  return (
    <FilterSidebar header={header}>
      <SidebarSection label="Watchlist">
        <SidebarToggleGroup
          options={[
            { value: "all" as const,     label: "All"     },
            { value: "watched" as const, label: "Watched" },
          ]}
          value={filters.watchlistOnly ? "watched" : "all"}
          onChange={(v) => setWatchlistOnly(v === "watched")}
        />
        <SidebarCheckRow
          label="In watchlist"
          count={watchlist.length}
          checked={filters.watchlistOnly}
          onToggle={() => setWatchlistOnly(!filters.watchlistOnly)}
        />
      </SidebarSection>

      <SidebarSection label="Status">
        {isLoading ? <SkeletonRows /> : Object.entries(facetCounts.status)
          .sort((a, b) => b[1] - a[1])
          .map(([val, count]) => (
            <SidebarCheckRow
              key={val}
              label={STATUS_LABELS[val] ?? val}
              count={count}
              checked={filters.status.includes(val)}
              onToggle={() => toggleFilter("status", val)}
            />
          ))}
      </SidebarSection>

      <SidebarSection label="Market Type">
        {isLoading ? <SkeletonRows /> : Object.entries(facetCounts.permissions)
          .filter(([k]) => ["SPOT", "MARGIN", "LEVERAGED"].includes(k))
          .sort((a, b) => b[1] - a[1])
          .map(([val, count]) => (
            <SidebarCheckRow
              key={val}
              label={PERMISSION_LABELS[val] ?? val}
              count={count}
              checked={filters.permissions.includes(val)}
              onToggle={() => toggleFilter("permissions", val)}
            />
          ))}
      </SidebarSection>

      <SidebarSection label="Quote Asset" defaultOpen={false}>
        {isLoading ? <SkeletonRows /> : (
          <QuoteAssetRows
            counts={facetCounts.quoteAssets}
            selected={filters.quoteAssets}
            onToggle={(v) => toggleFilter("quoteAssets", v)}
          />
        )}
      </SidebarSection>

      <SidebarSection label="Trend" defaultOpen={false}>
        {(["Gainers", "Losers", "Flat"] as const).map((t) => (
          <SidebarCheckRow
            key={t}
            label={t}
            count={isLoading ? undefined : (facetCounts.trend[t] ?? 0)}
            checked={filters.trend.includes(t)}
            onToggle={() => toggleFilter("trend", t)}
          />
        ))}
      </SidebarSection>

      <SidebarSection label="Volume Tier" defaultOpen={false}>
        {([["High", ">$10M"], ["Mid", "$1M–$10M"], ["Low", "<$1M"]] as const).map(([tier, sub]) => (
          <SidebarCheckRow
            key={tier}
            label={tier}
            sublabel={sub}
            count={isLoading ? undefined : (facetCounts.volumeTier[tier] ?? 0)}
            checked={filters.volumeTier.includes(tier)}
            onToggle={() => toggleFilter("volumeTier", tier)}
          />
        ))}
      </SidebarSection>
    </FilterSidebar>
  );
}

// ── Symbol-specific sub-components ───────────────────────────

function QuoteAssetRows({ counts, selected, onToggle }: {
  counts: Record<string, number>; selected: string[]; onToggle: (v: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const visible = expanded ? sorted : sorted.slice(0, QUOTE_TOP);
  const hidden = sorted.length - QUOTE_TOP;

  return (
    <>
      {visible.map(([asset, count]) => (
        <SidebarCheckRow
          key={asset}
          label={asset}
          count={count}
          checked={selected.includes(asset)}
          onToggle={() => onToggle(asset)}
        />
      ))}
      {!expanded && hidden > 0 && (
        <button className={showMore()} onClick={() => setExpanded(true)}>+ {hidden} more</button>
      )}
      {expanded && (
        <button className={showLess()} onClick={() => setExpanded(false)}>Show less</button>
      )}
    </>
  );
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className={skelRow()}>
          <div className={skelBox()} />
          <div className={skelLine()} />
          <div className={skelBadge()} />
        </div>
      ))}
    </>
  );
}
