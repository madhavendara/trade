"use client";

import { useEffect, useMemo, useState } from "react";
import { cva } from "class-variance-authority";
import { useBinanceStream } from "@/hooks/use-binance-stream";
import { tradeStream, fetchRecentTrades, type TradeMessage, type RecentTrade } from "@/lib/binance";

// ── CVA ──────────────────────────────────────────────────────

const cardBase      = cva("flex flex-col flex-1 min-h-0 bg-[#1c1c1d] rounded-[4px]");
const headerBase    = cva("shrink-0 px-5 py-3");
const titleText     = cva("text-[18px] font-medium text-white");
const colHeader     = cva("shrink-0 flex items-center justify-between border-t border-[#3a3a3a] px-5 py-2 text-[14px] font-medium");
const contentBase   = cva("flex-1 relative overflow-hidden");
const scrollInner   = cva("absolute inset-0 flex flex-col gap-[2px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#454447_transparent]");
const emptyMsg      = cva("py-8 text-center text-[14px] text-[#87858c]");

const rowBase       = cva("flex shrink-0 items-center justify-between bg-[#2e2e2f] px-5 py-2");

const priceVariants = cva("font-bold text-[14px] tabular-nums", {
  variants: { side: { buy: "text-[#12be69]", sell: "text-[#ff383c]" } },
});

const qtyVariants = cva("font-bold text-[14px] tabular-nums w-[82px] text-center", {
  variants: { side: { buy: "text-[#12be69]", sell: "text-[#ff383c]" } },
});

const badgeVariants = cva(
  "flex w-[55px] items-center justify-center rounded-[23px] border px-2 py-1 text-[14px] font-medium",
  {
    variants: {
      side: {
        buy:  "border-[#34c759] text-[#34c759]",
        sell: "border-[#ff383c] text-[#ff383c]",
      },
    },
  }
);

// ─────────────────────────────────────────────────────────────

type TapeEntry = {
  id: number;
  time: number;
  price: number;
  qty: number;
  side: "buy" | "sell";
};

const MAX_ROWS = 100;

export function TradeTape({
  symbol,
  side = "all",
  minSize = 0,
}: {
  symbol: string;
  side?: "all" | "buy" | "sell";
  minSize?: number;
}) {
  const [tape, setTape] = useState<TapeEntry[]>([]);

  useEffect(() => {
    setTape([]);
    fetchRecentTrades(symbol, 50)
      .then((trades: RecentTrade[]) => {
        const entries: TapeEntry[] = trades.map((t) => ({
          id: t.id,
          time: t.time,
          price: parseFloat(t.price),
          qty: parseFloat(t.qty),
          side: t.isBuyerMaker ? "sell" : "buy",
        }));
        setTape(entries.reverse());
      })
      .catch(() => {});
  }, [symbol]);

  const streams = useMemo(() => [tradeStream(symbol)], [symbol]);

  useBinanceStream<TradeMessage>(streams, (msg) => {
    if (msg.e !== "trade") return;
    const entry: TapeEntry = {
      id: msg.t,
      time: msg.T,
      price: parseFloat(msg.p),
      qty: parseFloat(msg.q),
      side: msg.m ? "sell" : "buy",
    };
    setTape((prev) => [entry, ...prev].slice(0, MAX_ROWS));
  }, "trade-stream");

  const visible = tape.filter((e) => {
    if (side !== "all" && e.side !== side) return false;
    if (e.qty < minSize) return false;
    return true;
  });

  const fmtPrice = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  const fmtQty = (n: number) =>
    n.toFixed(n < 0.001 ? 6 : n < 0.01 ? 5 : 4);

  return (
    <div className={cardBase()}>
      <div className={headerBase()}>
        <span className={titleText()}>Trade Tape</span>
      </div>

      <div className={colHeader()}>
        <span className="text-white">Price</span>
        <span className="text-[#87858c]">Qty</span>
        <span className="text-[#87858c]">Type</span>
      </div>

      <div className={contentBase()}>
        <div className={scrollInner()}>
          {visible.length === 0 && (
            <div className={emptyMsg()}>Connecting…</div>
          )}
          {visible.map((entry) => (
            <div key={entry.id} className={rowBase()}>
              <span className={priceVariants({ side: entry.side })}>
                {fmtPrice(entry.price)}
              </span>
              <span className={qtyVariants({ side: entry.side })}>
                {fmtQty(entry.qty)}
              </span>
              <span className={badgeVariants({ side: entry.side })}>
                {entry.side === "buy" ? "Buy" : "Sell"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
