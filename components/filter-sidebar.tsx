"use client";

import { useState } from "react";
import { cva } from "class-variance-authority";
import { ChevronUp, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDashboardStore } from "@/lib/store";

// ── CVA ──────────────────────────────────────────────────────

const scrollArea   = cva("flex-1 overflow-hidden");

const sectionWrap  = cva("");
const sectionBtn   = cva("mx-3 my-2 flex w-[calc(100%-24px)] items-center gap-2 rounded-[8px] border border-[#454447] bg-[#222224] px-3 py-[9px] shadow-[inset_0px_2px_4px_rgba(255,255,255,0.15)] transition-colors hover:bg-[#2a2a2b]");
const sectionLabel = cva("flex-1 text-left text-[14px] font-medium text-white");
const sectionBody  = cva("pb-1");

export const toggleWrap = cva("mx-3 mb-1 flex rounded-[8px] bg-[#2a2a2b] p-1");
const toggleBtn    = cva(
  "flex-1 rounded-[6px] py-1.5 text-[14px] font-medium transition-colors",
  {
    variants: {
      active: {
        true:  "bg-[#7D00FF] text-white",
        false: "text-[#87858c] hover:text-white",
      },
    },
    defaultVariants: { active: false },
  }
);

const rowBase      = cva("group flex cursor-pointer items-center gap-3 px-5 py-1.5 transition-colors");
const checkboxBase = cva("h-[16px] w-[16px] shrink-0 cursor-pointer appearance-none rounded-[2.3px] border-2 border-[#87858c] bg-transparent transition-colors checked:border-violet-600 checked:bg-violet-600 group-hover:border-white");
const rowText      = cva("flex-1 text-[14px] text-[#87858c] transition-colors group-hover:text-white");
const rowSubtext   = cva("ml-1.5 text-[14px] text-[#4a4a4c] transition-colors group-hover:text-[#87858c]");
const rowCount     = cva("rounded-[4px] bg-[#2a2a2b] px-1.5 py-0.5 font-mono text-[14px] text-[#87858c]");

// ─────────────────────────────────────────────────────────────

export function FilterSidebar({
  header,
  children,
}: {
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { mobileFilterOpen, setMobileFilterOpen } = useDashboardStore();

  return (
    <>
      {mobileFilterOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 min-[800px]:hidden"
          onClick={() => setMobileFilterOpen(false)}
        />
      )}
      <aside
        className={
          mobileFilterOpen
            ? "flex fixed left-0 top-[76px] bottom-0 z-40 w-[260px] shrink-0 flex-col border-r border-[#2E2E2F] bg-[#161617]"
            : "hidden min-[800px]:flex min-[800px]:h-full w-[260px] shrink-0 flex-col border-r border-[#2E2E2F] bg-[#161617]"
        }
      >
        {header}
        <ScrollArea className={scrollArea()}>
          {children}
        </ScrollArea>
      </aside>
    </>
  );
}

export function SidebarSection({
  label,
  defaultOpen = true,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={sectionWrap()}>
      <button className={sectionBtn()} onClick={() => setOpen((v) => !v)}>
        <span className={sectionLabel()}>{label}</span>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-white" />
          : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white" />}
      </button>
      {open && <div className={sectionBody()}>{children}</div>}
    </div>
  );
}

export function SidebarToggleGroup<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={toggleWrap()}>
      {options.map(({ value: v, label }) => (
        <button
          key={String(v)}
          className={toggleBtn({ active: value === v })}
          onClick={() => onChange(v)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function SidebarCheckRow({
  label,
  sublabel,
  count,
  checked,
  onToggle,
}: {
  label: string;
  sublabel?: string;
  count?: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className={rowBase()}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className={checkboxBase()}
        style={
          checked
            ? { backgroundImage: "url(\"data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e\")" }
            : {}
        }
      />
      <span className={rowText()}>
        {label}
        {sublabel && <span className={rowSubtext()}>{sublabel}</span>}
      </span>
      {count !== undefined && <span className={rowCount()}>{count.toLocaleString()}</span>}
    </label>
  );
}
