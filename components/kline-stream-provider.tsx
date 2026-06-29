"use client";

import { useMemo } from "react";
import { useBinanceStream } from "@/hooks/use-binance-stream";
import { useKlineStore, klineKey } from "@/lib/kline-store";
import { useDashboardStore } from "@/lib/store";
import { klineStream, type KlineMessage } from "@/lib/binance";

const INTERVAL = "1m";

export function KlineStreamProvider() {
  const selectedSymbol = useDashboardStore((s) => s.selectedSymbol);
  const pushPoint = useKlineStore((s) => s.pushPoint);
  const streams = useMemo(() => [klineStream(selectedSymbol, INTERVAL)], [selectedSymbol]);

  useBinanceStream<KlineMessage>(streams, (msg) => {
    if (msg.e !== "kline") return;
    pushPoint(klineKey(selectedSymbol, INTERVAL), {
      time: msg.k.t,
      close: parseFloat(msg.k.c),
    });
  }, "kline-stream");

  return null;
}
