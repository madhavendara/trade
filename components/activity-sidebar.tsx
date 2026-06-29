"use client";

import { cva } from "class-variance-authority";
import {
  FilterSidebar,
  SidebarSection,
  SidebarToggleGroup,
  SidebarCheckRow,
} from "@/components/filter-sidebar";
import {
  useDashboardStore,
  ACTIVITY_MIN_SIZES,
  ACTIVITY_BOOK_DEPTHS,
  type ActivitySide,
  type ActivityMinSize,
  type ActivityBookDepth,
} from "@/lib/store";

// ─────────────────────────────────────────────────────────────

const MIN_SIZE_LABELS: Record<number, string> = {
  0:     "Any size",
  0.001: "≥ 0.001",
  0.01:  "≥ 0.01",
  0.1:   "≥ 0.1",
};

const SIDE_OPTIONS: { value: ActivitySide; label: string }[] = [
  { value: "all",  label: "All"  },
  { value: "buy",  label: "Buy"  },
  { value: "sell", label: "Sell" },
];

const DEPTH_OPTIONS = ACTIVITY_BOOK_DEPTHS.map((d) => ({ value: d, label: String(d) }));

// ─────────────────────────────────────────────────────────────

export function ActivitySidebar() {
  const {
    activitySide, setActivitySide,
    activityMinSize, setActivityMinSize,
    activityBookDepth, setActivityBookDepth,
  } = useDashboardStore();

  return (
    <FilterSidebar>
      <SidebarSection label="Trade Side">
        <SidebarToggleGroup
          options={SIDE_OPTIONS}
          value={activitySide}
          onChange={setActivitySide}
        />
      </SidebarSection>

      <SidebarSection label="Min Trade Size">
        {ACTIVITY_MIN_SIZES.map((size) => (
          <SidebarCheckRow
            key={size}
            label={MIN_SIZE_LABELS[size]}
            checked={activityMinSize === size}
            onToggle={() => setActivityMinSize(size as ActivityMinSize)}
          />
        ))}
      </SidebarSection>

      <SidebarSection label="Book Depth">
        <SidebarToggleGroup
          options={DEPTH_OPTIONS}
          value={activityBookDepth}
          onChange={(v) => setActivityBookDepth(v as ActivityBookDepth)}
        />
      </SidebarSection>
    </FilterSidebar>
  );
}
