"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cva } from "class-variance-authority";
import { Bell, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarNav, BottomTabBar } from "@/components/sidebar-nav";
import { TickerStreamProvider } from "@/components/ticker-stream-provider";
import { KlineStreamProvider } from "@/components/kline-stream-provider";
import { NotificationWatcher } from "@/components/notification-watcher";
import { NotificationDropdown } from "@/components/notification-dropdown";
import { useDashboardStore } from "@/lib/store";
import { useNotificationStore, selectUnreadCount } from "@/lib/notification-store";
import { SYMBOLS } from "@/lib/binance";
import images from "@/app/assets";

// ── CVA ──────────────────────────────────────────────────────

const shell          = cva("flex h-[100dvh] flex-col overflow-hidden bg-[#161617]");
const topbar         = cva("flex flex-wrap min-[800px]:flex-nowrap w-full shrink-0 items-center border-b border-[#2e2e2f] bg-[#1c1c1d] px-6");
const logoWrap       = cva("flex h-[76px] w-[180px] shrink-0 items-center");
const logoImg        = cva("h-[34px] w-auto object-contain");
const searchWrap     = cva("relative order-last min-[800px]:order-none w-full min-[800px]:flex-1 py-3 min-[800px]:py-0 min-[800px]:mx-3");
const searchBox      = cva("flex h-[45px] w-full items-center gap-2 rounded-[8px] bg-[#2e2e2f] px-4");
const searchIcon     = cva("h-4 w-4 shrink-0 text-[#87858c]");
const searchInput    = cva("flex-1 bg-transparent text-[14px] text-foreground placeholder:text-[#87858c] focus:outline-none");
const searchDropdown = cva("absolute top-full z-50 mt-1 w-full rounded-[8px] border border-[#2e2e2f] bg-[#1c1c1d] shadow-xl");
const searchOption   = cva("flex w-full items-center px-4 py-2.5 font-mono text-sm text-foreground hover:bg-[#2e2e2f] first:rounded-t-[8px] last:rounded-b-[8px]");
const topbarIcons    = cva("flex h-[76px] items-center gap-3 ml-auto min-[800px]:ml-0");
const topbarDivider  = cva("hidden min-[800px]:block h-5 w-px bg-[#2e2e2f]");
const iconBtn        = cva("text-[#87858c] hover:text-white");
const notifBadge     = cva("absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E30EAB] text-[10px] font-bold text-white leading-none");
const body           = cva("flex flex-1 overflow-hidden");

// ─────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.refetchQueries();
    setRefreshing(false);
  }, [queryClient]);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifWrapRef = useRef<HTMLDivElement>(null);
  const unreadCount = useNotificationStore(selectUnreadCount);

  const pathname = usePathname();
  const { setSelectedSymbol, mobileFilterOpen, setMobileFilterOpen } = useDashboardStore();
  const hasFilter = pathname === "/" || pathname === "/activity";

  useEffect(() => {
    setMobileFilterOpen(false);
  }, [pathname, setMobileFilterOpen]);

  const filtered = search.trim()
    ? SYMBOLS.filter((s) => s.toLowerCase().includes(search.toLowerCase()))
    : [];

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    function handle(e: MouseEvent) {
      if (notifWrapRef.current && !notifWrapRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [notifOpen]);

  function selectSymbol(symbol: string) {
    setSelectedSymbol(symbol);
    setSearch("");
    setSearchOpen(false);
  }

  return (
    <div className={shell()}>
      <header className={topbar()}>
        <div className={logoWrap()}>
          <Image src={images.logo} alt="TradeDesk" className={logoImg()} />
        </div>

        {/* Search — inline on desktop, wraps to second row on mobile */}
        <div ref={searchRef} className={searchWrap()}>
          <div className={searchBox()}>
            <Search className={searchIcon()} />
            <input
              className={searchInput()}
              placeholder="Search symbol…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
            />
          </div>
          {searchOpen && filtered.length > 0 && (
            <div className={searchDropdown()}>
              {filtered.map((s) => (
                <button key={s} className={searchOption()} onMouseDown={() => selectSymbol(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Icons */}
        <div className={topbarIcons()}>
          <div className={topbarDivider()} />

          <Button
            variant="ghost"
            size="icon"
            className={iconBtn()}
            disabled={refreshing}
            onClick={handleRefresh}
          >
            <RefreshCw className={`h-5 w-5 transition-transform${refreshing ? " animate-spin" : ""}`} />
          </Button>

          <div ref={notifWrapRef} className="relative">
            <Button
              variant="ghost"
              size="icon"
              className={`relative ${iconBtn()}`}
              onClick={() => setNotifOpen((o) => !o)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className={notifBadge()}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
            {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
          </div>

          {hasFilter && (
            <Button
              variant="ghost"
              size="icon"
              className={`min-[800px]:hidden ${mobileFilterOpen ? "text-white" : iconBtn()}`}
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      <div className={body()}>
        <TickerStreamProvider />
        <KlineStreamProvider />
        <NotificationWatcher />
        <SidebarNav />
        {children}
      </div>

      <BottomTabBar />
    </div>
  );
}
