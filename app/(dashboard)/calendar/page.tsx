import { cva } from "class-variance-authority";
import { CalendarTab } from "@/components/calendar-tab";

const mainBase = cva("flex-1 overflow-y-auto py-4 pl-4 lg:pr-4 bg-[#111111] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden");

export default function CalendarPage() {
  return (
    <main className={mainBase()}>
      <CalendarTab />
    </main>
  );
}
