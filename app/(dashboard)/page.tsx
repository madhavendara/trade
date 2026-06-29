import { cva } from "class-variance-authority";
import { SymbolSidebar } from "@/components/symbol-sidebar";
import { OverviewTab } from "@/components/overview-tab";

const mainBase = cva("flex-1 overflow-y-auto px-6 py-5 bg-[#111111]");

export default function OverviewPage() {
  return (
    <>
      <SymbolSidebar />
      <main className={mainBase()}>
        <OverviewTab />
      </main>
    </>
  );
}
