"use client";

import { cva } from "class-variance-authority";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TickerRow } from "@/hooks/use-ticker-rows";
import { SYMBOLS } from "@/lib/binance";

// ── CVA ──────────────────────────────────────────────────────

const titleRow    = cva("flex items-center justify-between text-base");
const streamBadge = cva("font-mono");
const emptyCell   = cva("py-8 text-center text-muted-foreground");
const symbolCol   = cva("font-medium");
const priceCol    = cva("text-right tabular-nums");
const volCol      = cva("text-right text-muted-foreground");
const colRight    = cva("text-right");

const rowVariants = cva("cursor-pointer font-mono text-sm transition-colors", {
  variants: {
    selected: { true: "bg-violet-500/10", false: "" },
  },
  defaultVariants: { selected: false },
});

const flashVariants = cva("inline-block rounded px-1", {
  variants: {
    flash: { up: "animate-flash-up", down: "animate-flash-down", none: "" },
  },
  defaultVariants: { flash: "none" },
});

const pctVariants = cva("text-right tabular-nums", {
  variants: {
    positive: { true: "text-emerald-400", false: "text-red-400" },
  },
});

// ─────────────────────────────────────────────────────────────

interface TickerTableProps {
  rows: Record<string, TickerRow>;
  ordered: TickerRow[];
  selected: string;
  onSelect: (symbol: string) => void;
}

export function TickerTable({ rows, ordered, selected, onSelect }: TickerTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={titleRow()}>
          <span>Live market</span>
          <Badge variant="outline" className={streamBadge()}>
            {ordered.length}/{SYMBOLS.length} streaming
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead className={colRight()}>Price</TableHead>
              <TableHead className={colRight()}>24h %</TableHead>
              <TableHead className={colRight()}>Volume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className={emptyCell()}>
                  Connecting to stream...
                </TableCell>
              </TableRow>
            )}
            {ordered.map((row) => (
              <TableRow
                key={row.symbol}
                onClick={() => onSelect(row.symbol)}
                className={rowVariants({ selected: row.symbol === selected })}
              >
                <TableCell className={symbolCol()}>{row.symbol}</TableCell>
                <TableCell className={priceCol()}>
                  <span className={flashVariants({ flash: row.flash ?? "none" })}>
                    {row.price.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </span>
                </TableCell>
                <TableCell className={pctVariants({ positive: row.changePct >= 0 })}>
                  {row.changePct >= 0 ? "+" : ""}{row.changePct.toFixed(2)}%
                </TableCell>
                <TableCell className={volCol()}>
                  {Intl.NumberFormat("en", { notation: "compact" }).format(row.volume)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
