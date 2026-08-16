import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Archive, Package, UserRoundSearch, Users, Warehouse } from "lucide-react";
import { IconToolButton } from "@/components/IconToolButton";
import { useDocumentModules } from "@/context/DocumentModulesContext";

export function DatabaseLayout() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { loading: modLoading, stockManagerEnabled, clientFollowupEnabled } =
    useDocumentModules();
  const isClients = loc.pathname.includes("/clients");
  const isProducts = loc.pathname.includes("/products");
  const isHistory = loc.pathname.includes("/history");
  const isStock = loc.pathname.includes("/stock");
  const isClientFollowupData = loc.pathname.includes("/client-followup");

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <nav className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-[var(--color-border)] bg-[var(--color-card)] py-2">
          <IconToolButton
            label="Clients"
            tooltipSide="right"
            active={isClients}
            onClick={() => void navigate("/database/clients")}
          >
            <Users className="h-5 w-5" />
          </IconToolButton>
          <IconToolButton
            label="Produits"
            tooltipSide="right"
            active={isProducts}
            onClick={() => void navigate("/database/products")}
          >
            <Package className="h-5 w-5" />
          </IconToolButton>
          <IconToolButton
            label="Historique"
            tooltipSide="right"
            active={isHistory}
            onClick={() => void navigate("/database/history")}
          >
            <Archive className="h-5 w-5" />
          </IconToolButton>
          {!modLoading && clientFollowupEnabled ? (
            <IconToolButton
              label="Suivi clients — données"
              tooltipSide="right"
              active={isClientFollowupData}
              onClick={() => void navigate("/database/client-followup")}
            >
              <UserRoundSearch className="h-5 w-5" />
            </IconToolButton>
          ) : null}
          {!modLoading && stockManagerEnabled ? (
            <IconToolButton
              label="Stock"
              tooltipSide="right"
              active={isStock}
              onClick={() => void navigate("/database/stock")}
            >
              <Warehouse className="h-5 w-5" />
            </IconToolButton>
          ) : null}
        </nav>
        <div className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
