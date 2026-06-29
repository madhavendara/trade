"use client";

import { cva } from "class-variance-authority";
import { useDashboardStore } from "@/lib/store";
import { TradeTape } from "./trade-tape";
import { OrderBook } from "./order-book";

// ── CVA ──────────────────────────────────────────────────────

const panelRow = cva("flex gap-4 h-full");

// ─────────────────────────────────────────────────────────────

export function ActivityTab() {
  const { selectedSymbol, activitySide, activityMinSize, activityBookDepth } = useDashboardStore();

  return (
    <div className={panelRow()}>
      <TradeTape symbol={selectedSymbol} side={activitySide} minSize={activityMinSize} />
      <OrderBook symbol={selectedSymbol} depth={activityBookDepth} />
    </div>
  );
}
