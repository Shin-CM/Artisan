import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { InvestorPage } from "./pages/InvestorPage";
import { TechPage } from "./pages/TechPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/pitch" replace />} />
        <Route path="pitch" element={<InvestorPage />} />
        <Route path="tech" element={<TechPage />} />
      </Route>
    </Routes>
  );
}
