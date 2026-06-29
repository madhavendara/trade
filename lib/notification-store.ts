import { create } from "zustand";

export type NotifSeverity = "critical" | "info";
export type NotifCategory = "stream" | "status" | "mover";

export interface Notification {
  id: string;
  category: NotifCategory;
  severity: NotifSeverity;
  title: string;
  body: string;
  symbol?: string;
  timestamp: Date;
  read: boolean;
}

const MAX = 50;

interface NotificationStore {
  notifications: Notification[];
  push: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  push: (n) =>
    set((s) => {
      const next: Notification = {
        ...n,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date(),
        read: false,
      };
      return { notifications: [next, ...s.notifications].slice(0, MAX) };
    }),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
  clearAll: () => set({ notifications: [] }),
}));

export const selectUnreadCount = (s: NotificationStore) =>
  s.notifications.filter((n) => !n.read).length;
