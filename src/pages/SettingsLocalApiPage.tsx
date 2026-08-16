import * as React from "react";
import { isTauri } from "@tauri-apps/api/core";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { RefreshCw, Tablet, Trash2 } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useDocumentModules } from "@/context/DocumentModulesContext";
import { Button } from "@/components/ui/button";
import { PageTitleWithInfo } from "@/components/PageTitleWithInfo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn, warningNoticeTextClassName } from "@/lib/utils";
import * as apiLocal from "@/lib/apiLocal";
import {
  isLocalTabletApiEnabledForWorkspace,
  MARKETPLACE_ROUTE_LOCAL_TABLET_API,
} from "@/lib/marketplaceModules";

export function SettingsLocalApiPage() {
  const { active } = useWorkspace();
  const { plugins, loading: pluginsLoading } = useDocumentModules();
  const localTabletModuleOn = isLocalTabletApiEnabledForWorkspace(plugins);
  const [status, setStatus] = React.useState<apiLocal.LocalApiStatus | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [portDraft, setPortDraft] = React.useState("3847");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [pairQr, setPairQr] = React.useState<string | null>(null);
  const [pw, setPw] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [sessions, setSessions] = React.useState<apiLocal.LocalApiSessionRow[]>(
    [],
  );

  const load = React.useCallback(async () => {
    if (!isTauri()) {
      setLoading(false);
      return;
    }
    try {
      const s = await apiLocal.localApiGetStatus();
      setStatus(s);
      setPortDraft(String(s.port));
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (pluginsLoading) return;
    if (!isLocalTabletApiEnabledForWorkspace(plugins)) {
      setLoading(false);
      return;
    }
    void load();
  }, [load, plugins, pluginsLoading]);

  const loadSessions = React.useCallback(async () => {
    if (!isTauri()) return;
    try {
      const list = await apiLocal.localApiListSessions(active?.id ?? null);
      setSessions(list.filter((r) => !r.revokedAt));
    } catch (e) {
      toast.error(String(e));
    }
  }, [active?.id]);

  React.useEffect(() => {
    void loadSessions();
  }, [loadSessions, status?.enabled]);

  async function onToggleEnabled(checked: boolean) {
    if (!isTauri()) return;
    setBusy("toggle");
    try {
      await apiLocal.localApiSetEnabled(checked);
      await load();
      toast.success(
        checked ? "API locale activée" : "API locale désactivée",
      );
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(null);
    }
  }

  async function onSavePort() {
    if (!isTauri()) return;
    const p = Number.parseInt(portDraft, 10);
    if (!Number.isFinite(p) || p < 1 || p > 65535) {
      toast.error("Port invalide (1–65535).");
      return;
    }
    setBusy("port");
    try {
      await apiLocal.localApiSetPort(p);
      await load();
      toast.success("Port enregistré — le serveur se reconfigure.");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(null);
    }
  }

  async function onGenerateQr() {
    if (!isTauri()) return;
    if (!active?.id) {
      toast.error("Ouvrez un espace de travail avant de générer un QR code.");
      return;
    }
    setBusy("qr");
    try {
      const payload = await apiLocal.localApiStartPairing(active.id);
      const qrObj = {
        apiUrl: payload.apiUrl,
        pairingToken: payload.pairingToken,
        expiresIn: payload.expiresIn,
      };
      setPairQr(JSON.stringify(qrObj));
      toast.success("QR prêt — valide 5 minutes.");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(null);
    }
  }

  async function onSetPassword() {
    if (!isTauri()) return;
    if (pw.length < 8) {
      toast.error("Au moins 8 caractères.");
      return;
    }
    if (pw !== pw2) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setBusy("pw");
    try {
      await apiLocal.localApiSetOperatorPassword(pw);
      setPw("");
      setPw2("");
      await load();
      toast.success("Mot de passe opérateur enregistré.");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(null);
    }
  }

  async function onRevoke(id: string) {
    if (!isTauri()) return;
    setBusy(`revoke-${id}`);
    try {
      await apiLocal.localApiRevokeSession(id);
      await loadSessions();
      toast.success("Session révoquée.");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(null);
    }
  }

  if (pluginsLoading) {
    return (
      <div className="text-sm text-[var(--color-muted-foreground)]">
        Chargement…
      </div>
    );
  }

  if (!localTabletModuleOn) {
    return (
      <div className="h-full min-h-0 w-full min-w-0 space-y-6 overflow-y-auto">
        <div>
          <PageTitleWithInfo
            description="Serveur HTTP dans l’application bureau pour la PWA tablette sur le même Wi‑Fi. Extension Marketplace optionnelle et expérimentale."
          >
            <h1 className="text-xl font-semibold">API tablette (réseau local)</h1>
          </PageTitleWithInfo>
        </div>
        <div className="max-w-xl space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-sm">
          <p className="text-[var(--color-foreground)]">
            Cette fonctionnalité n’est pas activée pour l’espace courant. Activez
            le module{" "}
            <span className="font-medium">« API tablette (réseau local) »</span>{" "}
            dans la Marketplace (onglet Intégrations) : il est{" "}
            <span className="font-medium">expérimental</span> (périmètre API et
            sécurité réseau susceptibles d’évoluer).
          </p>
          <Button type="button" asChild>
            <Link to={MARKETPLACE_ROUTE_LOCAL_TABLET_API}>
              Ouvrir la Marketplace — Intégrations
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-sm text-[var(--color-muted-foreground)]">
        Chargement…
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 w-full min-w-0 space-y-8 overflow-y-auto">
      <div>
        <PageTitleWithInfo
          description="Serveur HTTP dans l’application : consultation clients et devis depuis une tablette sur le même Wi‑Fi. Aucun cloud."
        >
          <h1 className="text-xl font-semibold">API tablette (réseau local)</h1>
        </PageTitleWithInfo>
      </div>

      {!isTauri() && (
        <p className={cn(warningNoticeTextClassName, "text-sm")}>
          Réglages disponibles uniquement dans l’application bureau Tauri.
        </p>
      )}

      {isTauri() && (
        <>
          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <div className="flex items-center gap-3">
              <Tablet className="h-5 w-5 shrink-0 text-[var(--color-muted-foreground)]" />
              <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label htmlFor="local-api-enabled" className="text-sm font-medium">
                    Activer l’API locale
                  </Label>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Écoute sur toutes les interfaces (0.0.0.0) — réseau local
                    uniquement.
                  </p>
                </div>
                <Switch
                  id="local-api-enabled"
                  checked={status?.enabled ?? false}
                  disabled={busy !== null}
                  onCheckedChange={(v) => void onToggleEnabled(v)}
                />
              </div>
            </div>
            {status && (
              <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
                URL suggérée :{" "}
                <code className="rounded bg-[var(--color-muted)] px-1 py-0.5 text-[var(--color-foreground)]">
                  {status.apiBaseUrl}
                </code>
                {status.operatorPasswordSet ? (
                  <span className="ml-2">· Mot de passe opérateur défini</span>
                ) : (
                  <span className="ml-2">· Connexion par mot de passe non configurée</span>
                )}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
            <h2 className="text-sm font-medium">Port</h2>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="local-api-port">Port TCP</Label>
                <Input
                  id="local-api-port"
                  className="w-32"
                  value={portDraft}
                  onChange={(e) => setPortDraft(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={busy !== null}
                onClick={() => void onSavePort()}
              >
                Appliquer
              </Button>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
            <h2 className="text-sm font-medium">Mot de passe opérateur (fallback)</h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Utilisé avec la connexion manuelle sur la tablette (identifiant
              libre + ce mot de passe + identifiant d’espace).
            </p>
            <div className="grid max-w-md gap-2">
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="Nouveau mot de passe"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="Confirmer"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
              />
              <Button
                type="button"
                disabled={busy !== null}
                onClick={() => void onSetPassword()}
              >
                Enregistrer le mot de passe
              </Button>
            </div>
          </section>

          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-medium">Couplage QR (espace actuel)</h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy !== null}
                onClick={() => void onGenerateQr()}
              >
                Générer un QR code
              </Button>
            </div>
            {!active && (
              <p className={cn(warningNoticeTextClassName, "text-xs")}>
                Ouvrez un espace de travail pour lier la tablette à cet espace.
              </p>
            )}
            {pairQr && (
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <div className="rounded-md border border-[var(--color-border)] bg-white p-2 dark:bg-zinc-900">
                  <QRCodeSVG value={pairQr} size={180} level="M" />
                </div>
                <p className="max-w-md text-xs text-[var(--color-muted-foreground)]">
                  Scannez ce code avec la PWA tablette. Il expire dans 5 minutes
                  et ne peut être utilisé qu’une fois.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium">Sessions actives</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1"
                disabled={busy !== null}
                onClick={() => void loadSessions()}
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </Button>
            </div>
            {sessions.length === 0 ? (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Aucune session active.
              </p>
            ) : (
              <div className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 bg-[var(--color-muted)]/40 px-3 py-2 text-xs font-medium">
                  <span>Créée</span>
                  <span>Espace</span>
                  <span className="text-right">Action</span>
                </div>
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 px-3 py-2 text-xs"
                  >
                    <span>{new Date(s.createdAt).toLocaleString("fr-FR")}</span>
                    <span className="font-mono">{s.workspaceId.slice(0, 8)}…</span>
                    <div className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        title="Révoquer"
                        disabled={busy !== null}
                        onClick={() => void onRevoke(s.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
