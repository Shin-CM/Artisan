import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/**
 * Redirige vers la Marketplace si le module document n’est pas autorisé pour l’espace.
 */
export function DocumentModulePageGate({
  enabled,
  loading,
  redirectToast,
  redirectTo = "/marketplace",
  children,
}: {
  enabled: boolean;
  loading: boolean;
  redirectToast: string;
  /** Cible après refus d’accès (ex. `/marketplace/documents`). */
  redirectTo?: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const didRedirect = React.useRef(false);

  React.useEffect(() => {
    if (enabled) didRedirect.current = false;
  }, [enabled]);

  React.useEffect(() => {
    if (loading || enabled) return;
    if (didRedirect.current) return;
    didRedirect.current = true;
    toast.info(redirectToast);
    void navigate(redirectTo, { replace: true });
  }, [loading, enabled, navigate, redirectToast, redirectTo]);

  if (loading || !enabled) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-[var(--color-muted-foreground)]">
        Chargement…
      </div>
    );
  }

  return <>{children}</>;
}
