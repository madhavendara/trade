"use client";

import { useMemo } from "react";
import { useBinanceStream } from "@/hooks/use-binance-stream";
import { useTickerStore } from "@/lib/ticker-store";
import { miniTickerStream, SYMBOLS, type MiniTickerMessage } from "@/lib/binance";

export function TickerStreamProvider() {
  const update = useTickerStore((s) => s.update);
  const streams = useMemo(() => SYMBOLS.map(miniTickerStream), []);

  useBinanceStream<MiniTickerMessage>(streams, (msg) => {
    if (msg.e !== "24hrMiniTicker") return;
    update({
      symbol: msg.s,
      price: parseFloat(msg.c),
      open: parseFloat(msg.o),
      volume: parseFloat(msg.v),
      quoteVolume: parseFloat(msg.q),
    });
  }, "ticker-stream");

  return null;
}
