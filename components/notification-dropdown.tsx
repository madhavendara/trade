"use client";

import { cva } from "class-variance-authority";
import { Radio, AlertCircle, TrendingUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotificationStore, selectUnreadCount } from "@/lib/notification-store";
import { useDashboardStore } from "@/lib/store";
import type { Notification, NotifCategory } from "@/lib/notification-store";

// ── CVA ──────────────────────────────────────────────────────

const panel      = cva("absolute right-0 top-full z-[60] mt-2 w-[360px] rounded-[10px] border border-[#2e2e2f] bg-[#1c1c1d] shadow-2xl");
const hdr        = cva("flex items-center justify-between border-b border-[#2e2e2f] px-4 py-3");
const hdrTitle   = cva("text-[14px] font-semibold text-white");
const hdrActions = cva("flex items-center gap-3");
const actionBtn  = cva("text-[12px] text-[#87858c] transition-colors hover:text-white");
const scrollWrap = cva("max-h-[400px] overflow-y-auto");
const emptyWrap  = cva("flex flex-col items-center justify-center py-12 text-center");
const emptyPrimary   = cva("text-[14px] text-[#87858c]");
const emptySecondary = cva("mt-1 text-[12px] text-[#87858c]/60");

const rowRoot = cva(
  "flex cursor-pointer items-start gap-3 border-b border-[#2e2e2f]/40 px-4 py-3 last:border-0 transition-colors hover:bg-white/5",
  { variants: { unread: { true: "bg-white/[0.02]", false: "" } } }
);

const severityDot = cva("mt-[5px] h-2 w-2 shrink-0 rounded-full", {
  variants: {
    severity: { critical: "bg-red-500", info: "bg-emerald-400" },
  },
});

const rowBody  = cva("flex-1 min-w-0");
const rowTop   = cva("flex items-center gap-1.5");
const rowTitle = cva("text-[13px] font-medium text-white truncate");
const rowTime  = cva("ml-auto shrink-0 text-[11px] text-[#87858c]");
const rowText  = cva("mt-0.5 text-[12px] leading-relaxed text-[#87858c]");
const unreadPip = cva("mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#E30EAB]");

// ─────────────────────────────────────────────────────────────

function relTime(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

const CATEGORY_ICON: Record<NotifCategory, React.ReactNode> = {
  stream: <Radio className="h-3 w-3 shrink-0 text-[#87858c]" />,
  status: <AlertCircle className="h-3 w-3 shrink-0 text-[#87858c]" />,
  mover:  <TrendingUp className="h-3 w-3 shrink-0 text-[#87858c]" />,
};

function NotifRow({
  n,
  onActivate,
}: {
  n: Notification;
  onActivate: (n: Notification) => void;
}) {
  return (
    <div className={rowRoot({ unread: !n.read })} onClick={() => onActivate(n)}>
      <span className={severityDot({ severity: n.severity })} />
      <div className={rowBody()}>
        <div className={rowTop()}>
          {CATEGORY_ICON[n.category]}
          <span className={rowTitle()}>{n.title}</span>
          <span className={rowTime()}>{relTime(n.timestamp)}</span>
        </div>
        <p className={rowText()}>{n.body}</p>
      </div>
      {!n.read && <span className={unreadPip()} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const notifications = useNotificationStore((s) => s.notifications);
  const markRead      = useNotificationStore((s) => s.markRead);
  const markAllRead   = useNotificationStore((s) => s.markAllRead);
  const clearAll      = useNotificationStore((s) => s.clearAll);
  const unread        = useNotificationStore(selectUnreadCount);
  const setSelectedSymbol = useDashboardStore((s) => s.setSelectedSymbol);
  const router = useRouter();

  function handleActivate(n: Notification) {
    markRead(n.id);
    if (n.symbol) {
      setSelectedSymbol(n.symbol);
      router.push("/");
      onClose();
    }
  }

  return (
    <div className={panel()}>
      <div className={hdr()}>
        <span className={hdrTitle()}>
          Notifications{unread > 0 ? ` · ${unread} new` : ""}
        </span>
        <div className={hdrActions()}>
          {unread > 0 && (
            <button className={actionBtn()} onClick={markAllRead}>
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button className={actionBtn()} onClick={clearAll}>
              Clear
            </button>
          )}
          <button className={actionBtn()} onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className={scrollWrap()}>
        {notifications.length === 0 ? (
          <div className={emptyWrap()}>
            <span className={emptyPrimary()}>No notifications yet</span>
            <span className={emptySecondary()}>
              Stream events, status changes, and top-mover alerts will appear here
            </span>
          </div>
        ) : (
          notifications.map((n) => (
            <NotifRow key={n.id} n={n} onActivate={handleActivate} />
          ))
        )}
      </div>
    </div>
  );
}
