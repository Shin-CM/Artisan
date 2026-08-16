import { Suspense, lazy } from "react";
import { isTauri } from "@tauri-apps/api/core";
import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { TooltipPreferenceProvider } from "@/context/TooltipPreferenceContext";
import { GlobalSearchProvider } from "@/context/GlobalSearchContext";
import { DocumentModulesProvider } from "@/context/DocumentModulesContext";
import { WorkspaceProvider, useWorkspace } from "@/context/WorkspaceContext";
import { ThemeRoot } from "@/context/ThemeContext";
import { WorkspaceGate } from "@/components/WorkspaceGate";
import { HomeLayout } from "@/layouts/HomeLayout";
import { DatabaseLayout } from "@/layouts/DatabaseLayout";
import { SettingsLayout } from "@/layouts/SettingsLayout";
import { LegacyMarketplaceRedirect } from "@/layouts/LegacyMarketplaceRedirect";
import { MarketplaceLayout } from "@/layouts/MarketplaceLayout";
import { MarketplaceShell } from "@/layouts/MarketplaceShell";
import { DataManagerLayout } from "@/layouts/DataManagerLayout";
import { CalendarLayout } from "@/layouts/CalendarLayout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppToaster } from "@/components/AppToaster";

const HomeDashboard = lazy(() =>
  import("@/pages/HomeDashboard").then((m) => ({ default: m.HomeDashboard })),
);
const QuotesPage = lazy(() =>
  import("@/pages/QuotesPage").then((m) => ({ default: m.QuotesPage })),
);
const InvoicesPage = lazy(() =>
  import("@/pages/InvoicesPage").then((m) => ({ default: m.InvoicesPage })),
);
const CreditNotesPage = lazy(() =>
  import("@/pages/CreditNotesPage").then((m) => ({
    default: m.CreditNotesPage,
  })),
);
const PurchaseOrdersPage = lazy(() =>
  import("@/pages/PurchaseOrdersPage").then((m) => ({
    default: m.PurchaseOrdersPage,
  })),
);
const ReportsPage = lazy(() =>
  import("@/pages/ReportsPage").then((m) => ({ default: m.ReportsPage })),
);
const RecoveryPage = lazy(() =>
  import("@/pages/RecoveryPage").then((m) => ({ default: m.RecoveryPage })),
);
const CrmPipelinePage = lazy(() =>
  import("@/pages/CrmPipelinePage").then((m) => ({
    default: m.CrmPipelinePage,
  })),
);
const ClientFollowupPage = lazy(() =>
  import("@/pages/ClientFollowupPage").then((m) => ({
    default: m.ClientFollowupPage,
  })),
);
const ClientFollowupClientPage = lazy(() =>
  import("@/pages/ClientFollowupClientPage").then((m) => ({
    default: m.ClientFollowupClientPage,
  })),
);
const ProjectsPage = lazy(() =>
  import("@/pages/projects/ProjectsPage").then((m) => ({
    default: m.ProjectsPage,
  })),
);
const ProjectWorkspaceLayout = lazy(() =>
  import("@/pages/projects/ProjectWorkspaceLayout").then((m) => ({
    default: m.ProjectWorkspaceLayout,
  })),
);
const ProjectDashboardPage = lazy(() =>
  import("@/pages/projects/ProjectDashboardPage").then((m) => ({
    default: m.ProjectDashboardPage,
  })),
);
const ProjectDetailPage = lazy(() =>
  import("@/pages/projects/ProjectDetailPage").then((m) => ({
    default: m.ProjectDetailPage,
  })),
);
const ProjectQuotesListPage = lazy(() =>
  import("@/pages/projects/ProjectQuotesListPage").then((m) => ({
    default: m.ProjectQuotesListPage,
  })),
);
const ProjectInvoicesListPage = lazy(() =>
  import("@/pages/projects/ProjectInvoicesListPage").then((m) => ({
    default: m.ProjectInvoicesListPage,
  })),
);
const ProjectPurchaseOrdersListPage = lazy(() =>
  import("@/pages/projects/ProjectPurchaseOrdersListPage").then((m) => ({
    default: m.ProjectPurchaseOrdersListPage,
  })),
);
const ProjectInvoicesEditRoute = lazy(() =>
  import("@/pages/projects/ProjectInvoicesEditRoute").then((m) => ({
    default: m.ProjectInvoicesEditRoute,
  })),
);
const ProjectPurchaseOrdersEditRoute = lazy(() =>
  import("@/pages/projects/ProjectPurchaseOrdersEditRoute").then((m) => ({
    default: m.ProjectPurchaseOrdersEditRoute,
  })),
);
const ClientsPage = lazy(() =>
  import("@/pages/ClientsPage").then((m) => ({ default: m.ClientsPage })),
);
const ProductsPage = lazy(() =>
  import("@/pages/ProductsPage").then((m) => ({ default: m.ProductsPage })),
);
const HistoryPage = lazy(() =>
  import("@/pages/HistoryPage").then((m) => ({ default: m.HistoryPage })),
);
const StockPage = lazy(() =>
  import("@/pages/StockPage").then((m) => ({ default: m.StockPage })),
);
const DatabaseClientFollowupPage = lazy(() =>
  import("@/pages/DatabaseClientFollowupPage").then((m) => ({
    default: m.DatabaseClientFollowupPage,
  })),
);
const DatabaseClientFollowupHistoryPage = lazy(() =>
  import("@/pages/DatabaseClientFollowupHistoryPage").then((m) => ({
    default: m.DatabaseClientFollowupHistoryPage,
  })),
);
const SettingsWorkspacePage = lazy(() =>
  import("@/pages/SettingsWorkspacePage").then((m) => ({
    default: m.SettingsWorkspacePage,
  })),
);
const SettingsBrandingPage = lazy(() =>
  import("@/pages/SettingsBrandingPage").then((m) => ({
    default: m.SettingsBrandingPage,
  })),
);
const SettingsTemplatePage = lazy(() =>
  import("@/pages/SettingsTemplatePage").then((m) => ({
    default: m.SettingsTemplatePage,
  })),
);
const MarketplaceDiscoverPage = lazy(() =>
  import("@/pages/MarketplaceDiscoverPage").then((m) => ({
    default: m.MarketplaceDiscoverPage,
  })),
);
const MarketplaceCategoryPage = lazy(() =>
  import("@/pages/MarketplaceCategoryPage").then((m) => ({
    default: m.MarketplaceCategoryPage,
  })),
);
const MarketplacePolicesPage = lazy(() =>
  import("@/pages/MarketplacePolicesPage").then((m) => ({
    default: m.MarketplacePolicesPage,
  })),
);
const MarketplaceDocumentsPage = lazy(() =>
  import("@/pages/MarketplaceDocumentsPage").then((m) => ({
    default: m.MarketplaceDocumentsPage,
  })),
);
const MarketplaceDonneesPage = lazy(() =>
  import("@/pages/MarketplaceDonneesPage").then((m) => ({
    default: m.MarketplaceDonneesPage,
  })),
);
const MarketplaceClientsPage = lazy(() =>
  import("@/pages/MarketplaceClientsPage").then((m) => ({
    default: m.MarketplaceClientsPage,
  })),
);
const MarketplaceIntegrationsPage = lazy(() =>
  import("@/pages/MarketplaceIntegrationsPage").then((m) => ({
    default: m.MarketplaceIntegrationsPage,
  })),
);
const MarketplaceStockPage = lazy(() =>
  import("@/pages/MarketplaceStockPage").then((m) => ({
    default: m.MarketplaceStockPage,
  })),
);
const MarketplaceCrmRoadmapPage = lazy(() =>
  import("@/pages/marketplace/wave2StubPages").then((m) => ({
    default: m.MarketplaceCrmRoadmapPage,
  })),
);
const MarketplaceAccountingRoadmapPage = lazy(() =>
  import("@/pages/marketplace/wave2StubPages").then((m) => ({
    default: m.MarketplaceAccountingRoadmapPage,
  })),
);
const MarketplaceStocksProjectsRoadmapPage = lazy(() =>
  import("@/pages/marketplace/wave2StubPages").then((m) => ({
    default: m.MarketplaceStocksProjectsRoadmapPage,
  })),
);
const MarketplacePlatformRoadmapPage = lazy(() =>
  import("@/pages/marketplace/wave3RoadmapPage").then((m) => ({
    default: m.MarketplacePlatformRoadmapPage,
  })),
);
const SettingsLocalApiPage = lazy(() =>
  import("@/pages/SettingsLocalApiPage").then((m) => ({
    default: m.SettingsLocalApiPage,
  })),
);
const SettingsClientFollowupPage = lazy(() =>
  import("@/pages/SettingsClientFollowupPage").then((m) => ({
    default: m.SettingsClientFollowupPage,
  })),
);
const SettingsCalendarPage = lazy(() =>
  import("@/pages/SettingsCalendarPage").then((m) => ({
    default: m.SettingsCalendarPage,
  })),
);
const DataManagerPage = lazy(() =>
  import("@/pages/DataManagerPage").then((m) => ({
    default: m.DataManagerPage,
  })),
);
const CalendarPage = lazy(() =>
  import("@/pages/CalendarPage").then((m) => ({
    default: m.CalendarPage,
  })),
);

function PageFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-[var(--color-muted-foreground)]">
      Chargement…
    </div>
  );
}

function ShellRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home/dashboard" replace />} />
      <Route path="/home" element={<HomeLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<HomeDashboard />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectWorkspaceLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ProjectDashboardPage />} />
          <Route path="detail" element={<ProjectDetailPage />} />
          <Route path="quotes" element={<ProjectQuotesListPage />} />
          <Route path="quotes/edit" element={<QuotesPage />} />
          <Route path="invoices" element={<ProjectInvoicesListPage />} />
          <Route path="invoices/edit" element={<ProjectInvoicesEditRoute />} />
          <Route
            path="purchase-orders"
            element={<ProjectPurchaseOrdersListPage />}
          />
          <Route
            path="purchase-orders/edit"
            element={<ProjectPurchaseOrdersEditRoute />}
          />
        </Route>
        <Route path="quotes" element={<QuotesPage />} />
        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="credit-notes" element={<CreditNotesPage />} />
        <Route path="recovery" element={<RecoveryPage />} />
        <Route path="crm" element={<CrmPipelinePage />} />
        <Route
          path="client-followup/clients/:clientId"
          element={<ClientFollowupClientPage />}
        />
        <Route path="client-followup" element={<ClientFollowupPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="stock" element={<StockPage />} />
      </Route>
      <Route path="/database" element={<DatabaseLayout />}>
        <Route index element={<Navigate to="clients" replace />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route
          path="client-followup/clients/:clientId"
          element={<DatabaseClientFollowupHistoryPage />}
        />
        <Route
          path="client-followup"
          element={<DatabaseClientFollowupPage />}
        />
        <Route path="stock" element={<StockPage />} />
      </Route>
      <Route path="/settings/marketplace/*" element={<LegacyMarketplaceRedirect />} />
      <Route path="/settings" element={<SettingsLayout />}>
        <Route index element={<Navigate to="workspace" replace />} />
        <Route path="workspace" element={<SettingsWorkspacePage />} />
        <Route path="branding" element={<SettingsBrandingPage />} />
        <Route path="template" element={<SettingsTemplatePage />} />
        <Route path="local-api" element={<SettingsLocalApiPage />} />
        <Route
          path="client-followup-apps"
          element={<SettingsClientFollowupPage />}
        />
        <Route path="calendar" element={<SettingsCalendarPage />} />
      </Route>
      <Route path="/marketplace" element={<MarketplaceShell />}>
        <Route element={<MarketplaceLayout />}>
          <Route index element={<MarketplaceDiscoverPage />} />
          <Route
            path="integrations"
            element={<MarketplaceIntegrationsPage />}
          />
          <Route
            path="reports"
            element={<MarketplaceCategoryPage categoryKey="reports" />}
          />
          <Route path="documents" element={<MarketplaceDocumentsPage />} />
          <Route path="donnees" element={<MarketplaceDonneesPage />} />
          <Route path="stock" element={<MarketplaceStockPage />} />
          <Route path="clients" element={<MarketplaceClientsPage />} />
          <Route path="polices" element={<MarketplacePolicesPage />} />
          <Route
            path="sur-mesure"
            element={<MarketplaceCategoryPage categoryKey="sur-mesure" />}
          />
          <Route path="crm" element={<MarketplaceCrmRoadmapPage />} />
          <Route
            path="accounting-essentials"
            element={<MarketplaceAccountingRoadmapPage />}
          />
          <Route
            path="stocks-projects"
            element={<MarketplaceStocksProjectsRoadmapPage />}
          />
          <Route
            path="platform-roadmap"
            element={<MarketplacePlatformRoadmapPage />}
          />
        </Route>
      </Route>
      <Route path="/data-manager" element={<DataManagerLayout />}>
        <Route index element={<DataManagerPage />} />
      </Route>
      <Route path="/calendar" element={<CalendarLayout />}>
        <Route index element={<CalendarPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/home/dashboard" replace />} />
    </Routes>
  );
}

function BrowserModeBanner() {
  if (isTauri()) return null;
  return (
    <div
      role="status"
      className="shrink-0 border-b border-orange-600/30 bg-transparent px-4 py-2 text-center text-sm text-orange-900 dark:border-orange-500/35 dark:text-orange-300"
    >
      Mode navigateur : données fictives en mémoire (aucune persistance). Pour la base réelle, lancez l’app Tauri.
    </div>
  );
}

function AppWithWorkspace() {
  const { active } = useWorkspace();
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <BrowserModeBanner />
      {/* Un seul provider : WorkspaceGate (sélection d’espace) utilise aussi PageTitleWithInfo / Tooltip. */}
      <TooltipProvider delayDuration={300}>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {!active ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <WorkspaceGate />
            </div>
          ) : (
            <ThemeRoot>
              <DocumentModulesProvider>
                <GlobalSearchProvider>
                  <AppToaster />
                  <Suspense fallback={<PageFallback />}>
                    <ShellRoutes />
                  </Suspense>
                </GlobalSearchProvider>
              </DocumentModulesProvider>
            </ThemeRoot>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}

export default function App() {
  // En build packagé (import.meta.env.PROD), le document est servi via le schéma
  // Tauri (tauri://localhost). BrowserRouter + history.pushState est souvent cassé
  // là-bas → routes vides / écran blanc. HashRouter évite d’écrire le path HTTP.
  const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;
  return (
    <Router>
      <div className="h-full min-h-0">
        <TooltipPreferenceProvider>
          <WorkspaceProvider>
            <AppWithWorkspace />
          </WorkspaceProvider>
        </TooltipPreferenceProvider>
      </div>
    </Router>
  );
}
