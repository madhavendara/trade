"use client";

import { useEffect, useRef } from "react";
import { useStreamRegistry } from "@/lib/stream-registry";

const WS_BASE = "wss://stream.binance.com:9443/stream";
const RECONNECT_DELAY_MS = 2000;

/**
 * Subscribes to one or more combined Binance public streams and calls
 * onMessage for every parsed payload. Reconnects automatically on disconnect.
 *
 * Pass a stable array reference (e.g. from useMemo) for `streams`.
 * Pass `streamName` to register this connection in the stream health registry.
 */
export function useBinanceStream<T = unknown>(
  streams: string[],
  onMessage: (data: T) => void,
  streamName?: string
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const register = useStreamRegistry((s) => s.register);
  const update = useStreamRegistry((s) => s.update);

  const streamsKey = streams.join(",");
  const msgCountRef = useRef(0);

  // Register/unregister in the health registry
  useEffect(() => {
    if (!streamName || streams.length === 0) return;
    let storedReconnect: Date | null = null;
    try {
      const iso = localStorage.getItem(`stream:reconnect:${streamName}`);
      if (iso) storedReconnect = new Date(iso);
    } catch { /* localStorage unavailable */ }
    register(streamName, {
      streams,
      status: "connecting",
      msgsPerSec: 0,
      lastReconnectAt: storedReconnect,
    });
    const rateInterval = setInterval(() => {
      update(streamName, { msgsPerSec: msgCountRef.current });
      msgCountRef.current = 0;
    }, 1000);
    return () => {
      clearInterval(rateInterval);
      // Keep the registry entry — the WebSocket cleanup below sets status → "closed",
      // so the Health page still shows the stream rather than an empty list.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamName, streamsKey]);

  useEffect(() => {
    if (streams.length === 0) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cleanedUp = false;
    let connectCount = 0;

    const connect = () => {
      connectCount++;
      const url = `${WS_BASE}?streams=${streams.join("/")}`;
      socket = new WebSocket(url);

      socket.onopen = () => {
        if (streamName) {
          const reconnectAt = connectCount > 1 ? new Date() : null;
          update(streamName, {
            status: "connected",
            ...(reconnectAt ? { lastReconnectAt: reconnectAt } : {}),
          });
          if (reconnectAt) {
            try {
              localStorage.setItem(`stream:reconnect:${streamName}`, reconnectAt.toISOString());
            } catch { /* localStorage unavailable */ }
          }
        }
      };

      socket.onmessage = (event) => {
        msgCountRef.current++;
        try {
          const parsed = JSON.parse(event.data);
          onMessageRef.current(parsed.data ?? parsed);
        } catch {
          // Drop malformed frames
        }
      };

      socket.onclose = () => {
        if (cleanedUp) return;
        if (streamName) update(streamName, { status: "reconnecting" });
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      cleanedUp = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
      if (streamName) update(streamName, { status: "closed" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamsKey]);
}
