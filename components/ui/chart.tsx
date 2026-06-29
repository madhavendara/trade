"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = {
  [k: string]: {
    label?: React.ReactNode;
    color?: string;
  };
};

type ChartContextValue = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextValue | null>(null);

function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within ChartContainer");
  return ctx;
}

function ChartContainer({
  config,
  children,
  className,
}: {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  className?: string;
}) {
  const style = Object.fromEntries(
    Object.entries(config)
      .filter(([, v]) => v.color)
      .map(([k, v]) => [`--color-${k}`, v.color])
  ) as React.CSSProperties;

  return (
    <ChartContext.Provider value={{ config }}>
      <div style={style} className={cn("h-full w-full", className)}>
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
  className,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
  className?: string;
}) {
  const { config } = useChart();
  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-background p-2.5 text-xs shadow-md",
        className
      )}
    >
      {label !== undefined && (
        <p className="mb-1.5 font-medium text-foreground">
          {labelFormatter ? labelFormatter(label, payload) : String(label)}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((item) => {
          const key = item.dataKey as string;
          const cfg = config[key];
          const color = item.color ?? cfg?.color;
          const displayLabel = cfg?.label ?? key;
          const value = formatter
            ? formatter(item.value as number, key, item, 0, payload)
            : [String(item.value)];
          return (
            <div key={key} className="flex items-center gap-2">
              {color && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
              <span className="text-muted-foreground">{displayLabel}</span>
              <span className="ml-auto font-mono font-medium text-foreground">
                {Array.isArray(value) ? value[0] : value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
