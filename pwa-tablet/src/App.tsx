import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { getStoredAuth } from "./api";
import { Layout } from "./Layout";
import { LoginPage } from "./pages/LoginPage";
import { ClientsPage } from "./pages/ClientsPage";
import { ClientNewPage } from "./pages/ClientNewPage";
import { QuotesPage } from "./pages/QuotesPage";
import { QuoteEditorPage } from "./pages/QuoteEditorPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  if (!getStoredAuth()) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/clients" replace />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/new" element={<ClientNewPage />} />
        <Route path="/quotes" element={<QuotesPage />} />
        <Route path="/quotes/new" element={<QuoteEditorPage />} />
        <Route path="/quotes/:id" element={<QuoteEditorPage />} />
      </Route>
    </Routes>
  );
}
