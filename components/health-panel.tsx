"use client";

import { useStreamRegistry, type StreamStatus } from "@/lib/stream-registry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<StreamStatus, { label: string; className: string }> = {
  connecting: { label: "Connecting", className: "border-yellow-500/30 text-yellow-400" },
  connected: { label: "Connected", className: "border-emerald-500/30 text-emerald-400" },
  reconnecting: { label: "Reconnecting", className: "border-orange-500/30 text-orange-400" },
  closed: { label: "Closed", className: "border-red-500/30 text-red-400" },
};

export function HealthPanel() {
  const registry = useStreamRegistry((s) => s.registry);
  const entries = Object.values(registry);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-violet-400" />
          Stream Health
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            {entries.filter((e) => e.status === "connected").length}/{entries.length} connected
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {entries.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No active streams. Visit the{" "}
            <a href="/" className="text-violet-400 underline underline-offset-2 hover:text-violet-300">
              Overview
            </a>{" "}
            page to start WebSocket connections, then return here to monitor them.
          </div>
        ) : (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-4 px-4 py-2 text-xs text-muted-foreground">
              <span>Stream</span>
              <span>Status</span>
              <span className="text-right">Msgs/sec</span>
              <span className="text-right">Last Reconnect</span>
            </div>
            {entries.map((stream) => {
              const cfg = STATUS_CONFIG[stream.status];
              return (
                <div
                  key={stream.name}
                  className="grid grid-cols-4 items-center px-4 py-3 hover:bg-accent/30"
                >
                  <div>
                    <div className="font-mono text-sm font-medium">{stream.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {stream.streams.length} channel{stream.streams.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", cfg.className)}
                    >
                      <span
                        className={cn(
                          "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
                          stream.status === "connected" && "bg-emerald-400 animate-pulse",
                          stream.status === "reconnecting" && "bg-orange-400 animate-pulse",
                          stream.status === "connecting" && "bg-yellow-400 animate-pulse",
                          stream.status === "closed" && "bg-red-400"
                        )}
                      />
                      {cfg.label}
                    </Badge>
                  </div>
                  <div className="text-right font-mono text-sm">
                    {stream.msgsPerSec}
                  </div>
                  <div className="text-right font-mono text-xs text-muted-foreground">
                    {stream.lastReconnectAt
                      ? stream.lastReconnectAt.toLocaleTimeString()
                      : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
