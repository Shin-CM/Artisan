import { Outlet } from "react-router-dom";
import { TopBar } from "@/components/TopBar";

export function MarketplaceShell() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <TopBar />
      <main className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4">
        <div className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
