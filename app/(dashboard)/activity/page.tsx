import { cva } from "class-variance-authority";
import { ActivitySidebar } from "@/components/activity-sidebar";
import { ActivityTab } from "@/components/activity-tab";

const mainBase = cva("flex-1 overflow-hidden px-6 py-5 bg-[#111111]");

export default function ActivityPage() {
  return (
    <>
      <ActivitySidebar />
      <main className={mainBase()}>
        <ActivityTab />
      </main>
    </>
  );
}
