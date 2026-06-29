import { create } from "zustand";

export type StreamStatus = "connecting" | "connected" | "reconnecting" | "closed";

export interface StreamInfo {
  name: string;
  streams: string[];
  status: StreamStatus;
  msgsPerSec: number;
  lastReconnectAt: Date | null;
}

interface StreamRegistryStore {
  registry: Record<string, StreamInfo>;
  register: (name: string, info: Omit<StreamInfo, "name">) => void;
  update: (name: string, patch: Partial<Omit<StreamInfo, "name">>) => void;
  unregister: (name: string) => void;
}

export const useStreamRegistry = create<StreamRegistryStore>((set) => ({
  registry: {},
  register: (name, info) =>
    set((s) => ({
      registry: { ...s.registry, [name]: { ...info, name } },
    })),
  update: (name, patch) =>
    set((s) =>
      s.registry[name]
        ? {
            registry: {
              ...s.registry,
              [name]: { ...s.registry[name], ...patch },
            },
          }
        : s
    ),
  unregister: (name) =>
    set((s) => {
      const next = { ...s.registry };
      delete next[name];
      return { registry: next };
    }),
}));
