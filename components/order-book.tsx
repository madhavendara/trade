"use client";

import { useMemo, useState } from "react";
import { cva } from "class-variance-authority";
import { useBinanceStream } from "@/hooks/use-binance-stream";
import { depthStream, type DepthMessage } from "@/lib/binance";

// ── CVA ──────────────────────────────────────────────────────

const cardBase   = cva("flex flex-col flex-1 min-h-0 bg-[#1c1c1d] rounded-[4px]");
const headerBase = cva("shrink-0 px-5 py-3");
const titleText  = cva("text-[18px] font-medium text-white");
const spreadLabel = cva("ml-2 text-[14px] font-normal text-[#87858c]");
const colHeader  = cva("shrink-0 flex items-center justify-between border-t border-[#3a3a3a] px-5 py-2 text-[14px] font-medium");
const listBase   = cva("flex-1 relative overflow-hidden");
const scrollInner = cva("absolute inset-0 flex flex-col gap-[2px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#454447_transparent]");
const emptyMsg   = cva("py-8 text-center text-[14px] text-[#87858c]");

const badgeVariants = cva(
  "flex w-[55px] items-center justify-center rounded-[23px] border px-2 py-1 text-[14px] font-medium",
  {
    variants: {
      side: {
        bid: "border-[#34c759] text-[#34c759]",
        ask: "border-[#ff383c] text-[#ff383c]",
      },
    },
  }
);

// ─────────────────────────────────────────────────────────────

type Level = { price: number; qty: number; side: "bid" | "ask" };

function buildLevels(raw: [string, string][], side: "bid" | "ask", limit: number): Level[] {
  return raw
    .slice(0, limit)
    .map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q), side }))
    .filter((e) => e.qty > 0);
}

export function OrderBook({ symbol, depth = 20 }: { symbol: string; depth?: number }) {
  const [bids, setBids] = useState<Level[]>([]);
  const [asks, setAsks] = useState<Level[]>([]);

  const streams = useMemo(() => [depthStream(symbol, 20, 1000)], [symbol]);

  useBinanceStream<DepthMessage>(streams, (msg) => {
    if (!msg.bids || !msg.asks) return;
    setBids(buildLevels(msg.bids, "bid", depth));
    setAsks(buildLevels(msg.asks, "ask", depth));
  }, "depth-stream");

  const bestAsk = asks.reduce((a, b) => (!a || b.price < a.price ? b : a), null as Level | null);
  const bestBid = bids.reduce((a, b) => (!a || b.price > a.price ? b : a), null as Level | null);
  const spread  = bestAsk && bestBid ? bestAsk.price - bestBid.price : null;

  // Single merged list sorted by price descending (asks high → low, bids high → low)
  const rows = useMemo(
    () => [...asks, ...bids].sort((a, b) => b.price - a.price),
    [asks, bids],
  );

  const fmt = (n: number, d = 4) =>
    n.toLocaleString(undefined, { maximumFractionDigits: d });

  return (
    <div className={cardBase()}>
      <div className={headerBase()}>
        <span className={titleText()}>
          Order Book
          {spread !== null && (
            <span className={spreadLabel()}>spread {fmt(spread)}</span>
          )}
        </span>
      </div>

      <div className={colHeader()}>
        <span className="text-white">Price</span>
        <span className="text-[#87858c]">Qty</span>
        <span className="text-[#87858c]">Type</span>
      </div>

      <div className={listBase()}>
        <div className={scrollInner()}>
          {rows.length === 0 && <div className={emptyMsg()}>Connecting…</div>}
          {rows.map((level, i) => {
            const isBid = level.side === "bid";
            const color = isBid ? "#12be69" : "#ff383c";
            return (
              <div key={i} className="flex shrink-0 items-center justify-between bg-[#2e2e2f] px-5 py-2 text-[14px]">
                <span className="font-bold tabular-nums" style={{ color }}>
                  {fmt(level.price)}
                </span>
                <span className="w-[82px] text-center font-bold tabular-nums" style={{ color }}>
                  {level.qty.toFixed(4)}
                </span>
                <span className={badgeVariants({ side: level.side })}>
                  {isBid ? "Bid" : "Ask"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
