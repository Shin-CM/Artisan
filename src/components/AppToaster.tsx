import { Toaster } from "sonner";
import { useTheme } from "@/context/ThemeContext";

/** Toasts alignés sur le thème effectif de l’app (clair / sombre). */
export function AppToaster() {
  const { effective } = useTheme();
  return <Toaster richColors position="top-center" theme={effective} />;
}
