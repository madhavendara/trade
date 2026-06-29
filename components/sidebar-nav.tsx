"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cva } from "class-variance-authority";
import type { StaticImageData } from "next/image";
import images from "@/app/assets";

// ── CVA — shared ─────────────────────────────────────────────

const navLabelVariants = cva(
  "w-full text-center text-[14px] font-medium leading-tight transition-colors",
  {
    variants: {
      active: { true: "text-white", false: "text-[#87858c]" },
    },
    defaultVariants: { active: false },
  }
);

const navIconVariants = cva("h-[20px] w-[20px] transition-colors", {
  variants: {
    active: { true: "text-white", false: "text-[#87858c]" },
  },
  defaultVariants: { active: false },
});

// ── CVA — side nav ────────────────────────────────────────────

const navRoot      = cva("hidden min-[800px]:flex h-full w-[106px] shrink-0 flex-col border-r border-[#2e2e2f] bg-[#161617]");
const navItems     = cva("flex flex-col pt-0");
const navLink      = cva("flex w-full gap-1 flex-col items-center px-[22px] py-[10px] transition-colors hover:bg-white/5");
const navIconWrap  = cva("flex h-8 w-8 shrink-0 items-center justify-center");
const navSeparator = cva("h-px w-full bg-[#454447]");

// ── CVA — bottom tab bar ──────────────────────────────────────

const tabRoot  = cva("relative z-50 flex min-[800px]:hidden w-full shrink-0 border-t border-[#2e2e2f] bg-[#161617]");
const tabItem  = cva("flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors hover:bg-white/5");
const tabIcon  = cva("h-6 w-6 object-contain");

// ─────────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
} & (
  | { icon: StaticImageData; iconActive: StaticImageData; lucide?: never }
  | { lucide: React.ComponentType<{ className?: string }>; icon?: never; iconActive?: never }
);

const NAV_ITEMS: NavItem[] = [
  { href: "/",         label: "Overview", icon: images.dashboard, iconActive: images.dashboardActive },
  { href: "/activity", label: "Activity", icon: images.activity,  iconActive: images.activityActive },
  { href: "/calendar", label: "Calendar", icon: images.calender,  iconActive: images.calenderActive },
  { href: "/health",   label: "Health",   icon: images.health,    iconActive: images.healthActive },
];

function NavIcon({ item, isActive, className }: { item: NavItem; isActive: boolean; className?: string }) {
  if ("icon" in item && item.icon) {
    return (
      <Image
        src={isActive ? item.iconActive! : item.icon}
        alt={item.label}
        className={className ?? "h-full aspect-square object-contain"}
      />
    );
  }
  if (item.lucide) {
    return <item.lucide className={navIconVariants({ active: isActive })} />;
  }
  return null;
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className={navRoot()}>
      <div className={navItems()}>
        {NAV_ITEMS.map((item, idx) => {
          const isActive = pathname === item.href;
          return (
            <div key={item.href}>
              <Link href={item.href} className={navLink()}>
                <span className={navIconWrap()}>
                  <NavIcon item={item} isActive={isActive} />
                </span>
                <span className={navLabelVariants({ active: isActive })}>{item.label}</span>
              </Link>
              {idx < NAV_ITEMS.length - 1 && <div className={navSeparator()} />}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className={tabRoot()}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={tabItem()}>
            <NavIcon item={item} isActive={isActive} className={tabIcon()} />
            <span className={navLabelVariants({ active: isActive })}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
