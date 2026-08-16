import { Outlet } from "react-router-dom";
import { TopBar } from "@/components/TopBar";

export function CalendarLayout() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <TopBar />
      <div className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
