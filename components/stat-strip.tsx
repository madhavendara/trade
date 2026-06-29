"use client";

import { useMemo } from "react";
import { cva } from "class-variance-authority";
import { TrendingUp, TrendingDown, BarChart3, Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { TickerRow } from "@/hooks/use-ticker-rows";
import { useStreamRegistry } from "@/lib/stream-registry";
import type { ReactNode } from "react";

// ── CVA ──────────────────────────────────────────────────────

const grid       = cva("grid grid-cols-2 gap-3 min-[800px]:grid-cols-4");
const cardBody   = cva("p-4");
const cardTop    = cva("flex items-center justify-between");
const labelText  = cva("text-xs text-muted-foreground");

const valueText  = cva("mt-1.5 font-mono text-lg font-semibold leading-tight", {
  variants: {
    trend: {
      positive: "text-emerald-400",
      negative: "text-red-400",
      accent:   "text-violet-400",
      default:  "",
    },
  },
  defaultVariants: { trend: "default" },
});

// ─────────────────────────────────────────────────────────────

interface StatStripProps {
  ordered: TickerRow[];
}

export function StatStrip({ ordered }: StatStripProps) {
  const registry = useStreamRegistry((s) => s.registry);
  const activeStreams = Object.values(registry).filter((s) => s.status === "connected").length;

  const stats = useMemo(() => {
    if (ordered.length === 0) return null;
    const totalVolume   = ordered.reduce((sum, r) => sum + r.quoteVolume, 0);
    const avgChange     = ordered.reduce((sum, r) => sum + r.changePct, 0) / ordered.length;
    const mostVolatile  = ordered.reduce((best, r) =>
      Math.abs(r.changePct) > Math.abs(best.changePct) ? r : best
    );
    return { totalVolume, avgChange, mostVolatile };
  }, [ordered]);

  const fmt = Intl.NumberFormat("en", { notation: "compact" });

  return (
    <div className={grid()}>
      <StatCard
        label="24h Volume"
        value={stats ? `$${fmt.format(stats.totalVolume)}` : "—"}
        icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        label="Avg 24h Change"
        value={stats ? `${stats.avgChange >= 0 ? "+" : ""}${stats.avgChange.toFixed(2)}%` : "—"}
        trend={stats ? (stats.avgChange >= 0 ? "positive" : "negative") : "default"}
        icon={
          stats && stats.avgChange >= 0
            ? <TrendingUp className="h-4 w-4 text-emerald-400" />
            : <TrendingDown className="h-4 w-4 text-red-400" />
        }
      />
      <StatCard
        label="Most Volatile"
        value={
          stats
            ? `${stats.mostVolatile.symbol} ${stats.mostVolatile.changePct >= 0 ? "+" : ""}${stats.mostVolatile.changePct.toFixed(2)}%`
            : "—"
        }
        trend={stats ? (stats.mostVolatile.changePct >= 0 ? "positive" : "negative") : "default"}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        label="Active Streams"
        value={`${activeStreams} / ${Object.keys(registry).length || "—"}`}
        trend="accent"
        icon={<Radio className="h-4 w-4 text-violet-400" />}
      />
    </div>
  );
}

function StatCard({ label, value, icon, trend = "default" }: {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: "positive" | "negative" | "accent" | "default";
}) {
  return (
    <Card>
      <CardContent className={cardBody()}>
        <div className={cardTop()}>
          <span className={labelText()}>{label}</span>
          {icon}
        </div>
        <div className={valueText({ trend })}>{value}</div>
      </CardContent>
    </Card>
  );
}
