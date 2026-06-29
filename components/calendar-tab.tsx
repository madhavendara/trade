"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Check, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useDashboardStore } from "@/lib/store";
import { SYMBOLS } from "@/lib/binance";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────

const MONTHS   = 12;
const DAYS     = 31;
const GAP      = 3;
const LEFT_W   = 60;
const TOP_H    = 28;
const MIN_CELL = 40;

const LEGEND_COLORS = [
  "#b91c1c", "#f87171", "#fca5a5",
  "#374151",
  "#86efac", "#22c55e", "#15803d",
];

const CURRENT_YEAR = new Date().getFullYear();

// ── Color scale ───────────────────────────────────────────────────

function pctColor(pct: number | null): string {
  if (pct === null) return "#1e2433";
  if (pct >  3)    return "#15803d";
  if (pct >  1)    return "#22c55e";
  if (pct >  0)    return "#86efac";
  if (pct === 0)   return "#374151";
  if (pct > -1)    return "#fca5a5";
  if (pct > -3)    return "#f87171";
  return "#b91c1c";
}

// ── Types ─────────────────────────────────────────────────────────

type Cell      = { date: string; pct: number | null; close: number | null };
type MonthRow  = { label: string; month: number; days: (Cell | null)[] };
type HoveredDay = { date: string; pct: number; close: number; rect: DOMRect };

// ── Grid builder — full Jan–Dec of a given year ───────────────────

function buildYearGrid(
  klines: { openTime: number; open: number; close: number }[],
  year: number,
): MonthRow[] {
  const map = new Map<string, { pct: number; close: number }>();
  for (const k of klines) {
    const ds = new Date(k.openTime).toISOString().split("T")[0];
    map.set(ds, { pct: ((k.close - k.open) / k.open) * 100, close: k.close });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: MONTHS }, (_, mo) => {
    const label = new Date(Date.UTC(year, mo, 1)).toLocaleString("default", {
      month: "short", timeZone: "UTC",
    });
    const daysInMonth = new Date(Date.UTC(year, mo + 1, 0)).getUTCDate();

    const days: (Cell | null)[] = Array.from({ length: DAYS }, (_, i) => {
      const day = i + 1;
      if (day > daysInMonth) return null;
      const ds = `${year}-${String(mo + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const cellDate = new Date(ds + "T00:00:00Z");
      const inPast = cellDate <= today;
      const d = map.get(ds);
      return { date: ds, pct: inPast && d ? d.pct : null, close: inPast && d ? d.close : null };
    });

    return { label, month: mo, days };
  });
}

// ── Symbol combobox ───────────────────────────────────────────────

function SymbolSelect({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = (SYMBOLS as readonly string[]).filter((s) =>
    s.includes(search.toUpperCase()),
  );

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-[15px] font-medium text-gray-900 hover:bg-gray-100 transition-colors border border-gray-200"
      >
        {value}
        <ChevronsUpDown className="h-4 w-4 text-gray-500" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol…"
              className="w-full rounded bg-gray-50 px-2.5 py-1.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-[15px] text-gray-400">No results</p>
            ) : (
              filtered.map((s) => (
                <button
                  key={s}
                  onClick={() => { onChange(s); setOpen(false); setSearch(""); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-[15px] transition-colors hover:bg-gray-50",
                    s === value ? "text-gray-900 font-medium" : "text-gray-600",
                  )}
                >
                  <Check className={cn("h-3.5 w-3.5 shrink-0 text-gray-900", s === value ? "opacity-100" : "opacity-0")} />
                  {s}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── CalendarTab ───────────────────────────────────────────────────

export function CalendarTab() {
  const { selectedSymbol } = useDashboardStore();
  const [symbol, setSymbol] = useState(selectedSymbol);
  const [year, setYear]     = useState(CURRENT_YEAR);
  const [hovered, setHovered] = useState<HoveredDay | null>(null);

  // Width measurement
  const outerRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(0);
  const [leftW, setLeftW] = useState(LEFT_W);

  // Horizontal drag-to-scroll
  const scrollRef = useRef<HTMLDivElement>(null);
  const hDrag = useRef({ active: false, startX: 0, scrollLeft: 0 });

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => setCw(e[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [arrowW, setArrowW] = useState(40);

  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 800;
      setLeftW(mobile ? 30 : LEFT_W);
      setArrowW(mobile ? 25 : 40);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function onHDragStart(e: React.MouseEvent) {
    if (!scrollRef.current) return;
    hDrag.current = { active: true, startX: e.clientX, scrollLeft: scrollRef.current.scrollLeft };
    scrollRef.current.style.cursor = "grabbing";
  }
  function onHDragMove(e: React.MouseEvent) {
    if (!hDrag.current.active || !scrollRef.current) return;
    scrollRef.current.scrollLeft = hDrag.current.scrollLeft - (e.clientX - hDrag.current.startX);
  }
  function onHDragEnd() {
    hDrag.current.active = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  }

  // Fetch full year of daily klines
  const { data: klines, isLoading } = useQuery({
    queryKey: ["calendar-year", symbol, year],
    queryFn: async () => {
      const startTime = Date.UTC(year, 0, 1);
      const endTime   = Date.UTC(year, 11, 31, 23, 59, 59, 999);
      const res = await fetch(
        `https://api.binance.com/api/v3/klines` +
        `?symbol=${symbol}&interval=1d&startTime=${startTime}&endTime=${endTime}&limit=366`,
      );
      if (!res.ok) throw new Error("Klines fetch failed");
      const raw: unknown[] = await res.json();
      return raw.map((k) => ({
        openTime: (k as number[])[0],
        open:     parseFloat((k as string[])[1]),
        close:    parseFloat((k as string[])[4]),
      }));
    },
    staleTime: year < CURRENT_YEAR ? Infinity : 5 * 60 * 1000,
  });

  const rows = klines ? buildYearGrid(klines, year) : [];

  // Cell sizing
  const avail        = cw - leftW;
  const naturalW     = avail > 0 ? (avail - (DAYS - 1) * GAP) / DAYS : 0;
  const needsHScroll = naturalW > 0 && naturalW < MIN_CELL;
  const cellW        = needsHScroll ? MIN_CELL : naturalW;
  const totalGridW   = DAYS * cellW + (DAYS - 1) * GAP;

  // Lazy intraday hover fetch
  const { data: intradayData, isLoading: intradayLoading } = useQuery<{ t: number; v: number }[]>({
    queryKey: ["intraday", symbol, hovered?.date ?? null],
    queryFn: async () => {
      const start = new Date(hovered!.date + "T00:00:00Z").getTime();
      const end   = start + 86_400_000;
      const res   = await fetch(
        `https://api.binance.com/api/v3/klines` +
        `?symbol=${symbol}&interval=1h&startTime=${start}&endTime=${end}&limit=24`,
      );
      if (!res.ok) throw new Error("Intraday fetch failed");
      const raw: unknown[] = await res.json();
      return raw.map((k) => ({ t: (k as number[])[0], v: parseFloat((k as string[])[4]) }));
    },
    enabled:   !!hovered,
    staleTime: 3_600_000,
  });

  return (
    <div className="flex flex-col">
      <Card>
        {/* ── Header ── */}
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            {/* Left: symbol selector */}
            <SymbolSelect value={symbol} onChange={setSymbol} />

            {/* Right: legend (desktop only) + divider + year nav */}
            <div className="flex items-center gap-3">
              {/* Legend — desktop only */}
              <div className="hidden min-[800px]:flex items-center gap-1.5 text-[15px] text-[#87858c]">
                <span>Less</span>
                {LEGEND_COLORS.map((c) => (
                  <div key={c} className="shrink-0 rounded-sm" style={{ width: 11, height: 11, backgroundColor: c }} />
                ))}
                <span>More</span>
              </div>

              {/* Divider — desktop only */}
              <div className="hidden min-[800px]:block h-4 w-px bg-[#2e2e2f]" />

              {/* Year navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setYear((y) => y - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded text-[#87858c] hover:bg-[#2e2e2f] hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <span className="min-w-[52px] text-center text-[20px] font-medium text-white">
                  {year}
                </span>
                <button
                  onClick={() => setYear((y) => y + 1)}
                  disabled={year >= CURRENT_YEAR}
                  className="flex h-8 w-8 items-center justify-center rounded text-[#87858c] hover:bg-[#2e2e2f] hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Legend — mobile only, second line */}
          <div className="flex min-[800px]:hidden items-center gap-1.5 mt-2 text-[15px] text-[#87858c]">
            <span>Less</span>
            {LEGEND_COLORS.map((c) => (
              <div key={c} className="shrink-0 rounded-sm" style={{ width: 11, height: 11, backgroundColor: c }} />
            ))}
            <span>More</span>
          </div>
        </CardHeader>

        {/* ── Grid ── */}
        <CardContent className="pt-0">
          <div ref={outerRef}>
            {isLoading || cellW <= 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-[#87858c]">
                Loading…
              </div>
            ) : (
              <div className="flex">
                {/* Fixed month labels */}
                <div className="shrink-0 flex flex-col" style={{ width: leftW }}>
                  <div style={{ height: TOP_H }} />
                  {rows.map((row) => (
                    <div
                      key={row.month}
                      className="flex items-center text-[14px] leading-none text-[#87858c]"
                      style={{ height: cellW, marginTop: GAP }}
                    >
                      {row.label}
                    </div>
                  ))}
                </div>

                {/* Scrollable day columns */}
                <div
                  ref={scrollRef}
                  className="flex-1 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  style={{ cursor: needsHScroll ? "grab" : "default" }}
                  onMouseDown={needsHScroll ? onHDragStart : undefined}
                  onMouseMove={needsHScroll ? onHDragMove : undefined}
                  onMouseUp={needsHScroll ? onHDragEnd : undefined}
                  onMouseLeave={needsHScroll ? onHDragEnd : undefined}
                >
                  <div style={{ width: needsHScroll ? totalGridW : "100%", minWidth: needsHScroll ? totalGridW : undefined }}>
                    {/* Day-number header */}
                    <div className="flex items-center" style={{ gap: GAP, height: TOP_H }}>
                      {Array.from({ length: DAYS }, (_, i) => (
                        <div
                          key={i}
                          className="shrink-0 text-center text-[14px] text-[#87858c]"
                          style={{ width: cellW }}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* Month rows */}
                    <div className="flex flex-col" style={{ gap: GAP }}>
                      {rows.map((row) => (
                        <div key={row.month} className="flex" style={{ gap: GAP }}>
                          {row.days.map((cell, di) => (
                            <div
                              key={di}
                              className="shrink-0 rounded-sm"
                              style={{
                                width:  cellW,
                                height: cellW,
                                backgroundColor: cell === null ? "transparent" : pctColor(cell.pct),
                              }}
                              onMouseEnter={cell !== null && cell.pct !== null ? (e) => {
                                setHovered({ date: cell.date, pct: cell.pct!, close: cell.close!, rect: e.currentTarget.getBoundingClientRect() });
                              } : undefined}
                              onMouseLeave={cell !== null && cell.pct !== null ? () => setHovered(null) : undefined}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right arrow — shrink-0 sibling, same structure as month labels */}
                {needsHScroll && (
                  <div
                    className="shrink-0 flex items-center justify-center"
                    style={{ width: arrowW, background: "linear-gradient(to right, transparent 0%, #1c1c1d 30%)" }}
                  >
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded text-white/60 hover:text-white transition-colors"
                      onClick={() => { if (scrollRef.current) scrollRef.current.scrollLeft += cellW * 5; }}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isLoading && cellW > 0 && (
              <p className="mt-3 text-[10px] text-[#87858c]">
                Hover a day for that day's intraday move
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {hovered && (
        <IntradayTooltip
          day={hovered}
          data={intradayData ?? []}
          loading={intradayLoading}
          symbol={symbol}
        />
      )}
    </div>
  );
}

// ── Intraday tooltip ──────────────────────────────────────────────

const TOOLTIP_W = 320;
const CHART_H   = 140;

function IntradayTooltip({
  day, data, loading, symbol,
}: {
  day: HoveredDay;
  data: { t: number; v: number }[];
  loading: boolean;
  symbol: string;
}) {
  const r     = day.rect;
  const isPos = day.pct >= 0;
  const trendColor = isPos ? "hsl(var(--up))" : "hsl(var(--down))";
  const chartConfig = { v: { label: "Close", color: trendColor } } satisfies ChartConfig;

  const vw   = typeof window !== "undefined" ? window.innerWidth : 1280;
  const left = Math.max(8, Math.min(r.left + r.width / 2 - TOOLTIP_W / 2, vw - TOOLTIP_W - 8));
  const totalH = CHART_H + 52;
  const above  = r.top - 12 >= totalH;
  const top    = above ? r.top - 12 : r.bottom + 8;
  const latest = data[data.length - 1];

  const fmtDate = new Date(day.date + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });

  return (
    <div
      className="pointer-events-none fixed z-50 overflow-hidden rounded-lg border border-[#2e2e2f] bg-[#1c1c1d] shadow-2xl"
      style={{ left, top, transform: above ? "translateY(-100%)" : undefined, width: TOOLTIP_W }}
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <span className="font-mono text-[13px] text-foreground">{symbol}</span>
        {latest && (
          <span className="font-mono text-[13px]" style={{ color: trendColor }}>
            {latest.v.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        )}
      </div>
      <div className="px-3 pb-2 text-[11px] text-[#87858c]">
        {fmtDate}{" "}
        <span style={{ color: trendColor }}>{isPos ? "+" : ""}{day.pct.toFixed(2)}%</span>
      </div>
      <div style={{ height: CHART_H }}>
        {loading ? (
          <div className="flex h-full items-center justify-center text-[12px] text-[#87858c]">Loading…</div>
        ) : data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="intradayFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--color-v)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-v)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t"
                tickFormatter={(t: number) => new Date(t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                stroke="hsl(var(--muted-foreground))" fontSize={10} minTickGap={44}
              />
              <YAxis domain={["auto", "auto"]} stroke="hsl(var(--muted-foreground))" fontSize={10} width={62}
                tickFormatter={(v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              />
              <ChartTooltip content={
                <ChartTooltipContent
                  labelFormatter={(t) => new Date(t as number).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  formatter={(v) => [Number(v).toFixed(4), "Close"]}
                />
              } />
              <Area type="monotone" dataKey="v" stroke="var(--color-v)" fill="url(#intradayFill)"
                strokeWidth={1.5} dot={false} isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-[12px] text-[#87858c]">No data</div>
        )}
      </div>
    </div>
  );
}
