"use client";

import { useEffect } from "react";
import { cva } from "class-variance-authority";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import { useKlines } from "@/hooks/use-klines";
import { useKlineStore, klineKey, type ChartPoint } from "@/lib/kline-store";

// ── CVA ──────────────────────────────────────────────────────

const cardBase     = cva("flex flex-col min-w-0");
const headerRow    = cva("flex flex-row items-center justify-between shrink-0");
const titleMono    = cva("font-mono text-[14px]");
const latestPrice  = cva("font-mono text-[14px]");
const contentBase  = cva("h-72");
const loadingMsg   = cva("flex h-full items-center justify-center text-[14px] text-muted-foreground");

// ─────────────────────────────────────────────────────────────

const INTERVAL = "1m";
const EMPTY_POINTS: ChartPoint[] = [];

export function PriceChart({ symbol }: { symbol: string }) {
  const { data: klines, isLoading } = useKlines(symbol, INTERVAL, 100);
  const key = klineKey(symbol, INTERVAL);
  const points = useKlineStore((s) => s.points[key] ?? EMPTY_POINTS);
  const setPoints = useKlineStore((s) => s.setPoints);

  // Seed the store with REST historical data on first load
  useEffect(() => {
    if (klines) {
      setPoints(key, klines.map((k) => ({ time: k.openTime, close: k.close })));
    }
  }, [klines, key, setPoints]);

  const latest = points[points.length - 1];
  const first  = points[0];
  const isUp   = latest && first ? latest.close >= first.close : true;
  const trendColor = isUp ? "hsl(var(--up))" : "hsl(var(--down))";

  const chartConfig = {
    close: { label: "Close", color: trendColor },
  } satisfies ChartConfig;

  return (
    <Card className={cardBase()}>
      <CardHeader className={headerRow()}>
        <CardTitle className={titleMono()}>{symbol}</CardTitle>
        {latest && (
          <span className={latestPrice()} style={{ color: trendColor }}>
            {latest.close.toLocaleString(undefined, { maximumFractionDigits: 4 })}
          </span>
        )}
      </CardHeader>
      <CardContent className={contentBase()}>
        {isLoading ? (
          <div className={loadingMsg()}>Loading candles...</div>
        ) : (
          <ChartContainer config={chartConfig}>
            <AreaChart data={points}>
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--color-close)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-close)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tickFormatter={(t: number) =>
                  new Date(t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                }
                stroke="hsl(var(--muted-foreground))"
                fontSize={14}
                minTickGap={40}
              />
              <YAxis
                domain={["auto", "auto"]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={14}
                width={70}
                tickFormatter={(v: number) =>
                  v.toLocaleString(undefined, { maximumFractionDigits: 2 })
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(t) => new Date(t as number).toLocaleTimeString()}
                    formatter={(v) => [Number(v).toFixed(4), "close"]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke="var(--color-close)"
                fill="url(#priceFill)"
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
