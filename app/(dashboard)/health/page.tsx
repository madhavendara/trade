import { cva } from "class-variance-authority";
import { HealthTab } from "@/components/health-tab";

const mainBase = cva("flex-1 overflow-y-auto px-6 py-5 bg-[#111111]");

export default function HealthPage() {
  return (
    <main className={mainBase()}>
      <HealthTab />
    </main>
  );
}
