import * as React from "react";
import { isTauri } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ipc } from "@/lib/apiCore";
import {
  detectHostOsKind,
  FOLLOWUP_MAIL_PRESETS,
  FOLLOWUP_TEL_PRESETS,
  loadFollowupContactPrefs,
  saveFollowupContactPrefs,
  type AppPreset,
  type FollowupContactPrefs,
  type UrlHandlerApp,
} from "@/lib/followupContactPrefs";
import { cn, warningNoticeTextClassName } from "@/lib/utils";

function handlerSelectChildren(
  detected: UrlHandlerApp[],
  presets: AppPreset[],
  showDeviceGroup: boolean,
): React.ReactNode {
  if (showDeviceGroup && detected.length > 0) {
    return (
      <>
        <optgroup label="Sur cet appareil">
          {detected.map((a) => (
            <option key={a.open_with} value={a.open_with}>
              {a.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="Suggestions">
          {presets.map((o) => (
            <option key={o.value || "__preset"} value={o.value}>
              {o.label}
            </option>
          ))}
        </optgroup>
      </>
    );
  }
  return presets.map((o) => (
    <option key={o.value || "__preset"} value={o.value}>
      {o.label}
    </option>
  ));
}

export function SettingsClientFollowupPage() {
  const os = React.useMemo(() => detectHostOsKind(), []);
  const mailOpts = FOLLOWUP_MAIL_PRESETS[os];
  const telOpts = FOLLOWUP_TEL_PRESETS[os];
  const [p, setP] = React.useState<FollowupContactPrefs>(() =>
    loadFollowupContactPrefs(),
  );
  const [detectedMail, setDetectedMail] = React.useState<UrlHandlerApp[]>([]);
  const [detectedTel, setDetectedTel] = React.useState<UrlHandlerApp[]>([]);
  const [detectLoading, setDetectLoading] = React.useState(() => isTauri());
  const [detectError, setDetectError] = React.useState<string | null>(null);

  const refreshHandlers = React.useCallback(async () => {
    if (!isTauri()) return;
    setDetectLoading(true);
    setDetectError(null);
    try {
      const [mail, tel] = await Promise.all([
        ipc<UrlHandlerApp[]>("list_url_handler_apps", { scheme: "mailto" }),
        ipc<UrlHandlerApp[]>("list_url_handler_apps", { scheme: "tel" }),
      ]);
      setDetectedMail(mail);
      setDetectedTel(tel);
    } catch (e) {
      setDetectError(e instanceof Error ? e.message : String(e));
    } finally {
      setDetectLoading(false);
    }
  }, []);

  React.useEffect(() => {
    saveFollowupContactPrefs(p);
  }, [p]);

  React.useEffect(() => {
    if (!isTauri()) return;
    void refreshHandlers();
  }, [refreshHandlers]);

  const setPatch = React.useCallback((patch: Partial<FollowupContactPrefs>) => {
    setP((prev) => ({ ...prev, ...patch }));
  }, []);

  const tauri = isTauri();

  return (
    <div className="h-full min-h-0 w-full min-w-0 space-y-6 overflow-y-auto">
      <div>
        <h1 className="text-xl font-semibold">Suivi clients — applications</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--color-muted-foreground)]">
          Indiquez quelle application doit ouvrir les liens{" "}
          <strong className="text-[var(--color-foreground)]">courriel</strong> et{" "}
          <strong className="text-[var(--color-foreground)]">téléphone</strong>{" "}
          depuis <strong className="text-[var(--color-foreground)]">Suivi clients</strong>{" "}
          (liste Accueil et fiches détail). Sous l’app bureau Tauri, la valeur est
          transmise au plugin{" "}
          <span className="font-mono text-xs">opener</span>. Les entrées{" "}
          <strong className="text-[var(--color-foreground)]">Sur cet appareil</strong>{" "}
          proviennent des applications enregistrées pour{" "}
          <span className="font-mono text-xs">mailto:</span> /{" "}
          <span className="font-mono text-xs">tel:</span> (ex. chemin complet d’un
          bundle <span className="font-mono text-xs">.app</span> sur macOS) : elles
          sont en général plus fiables qu’un nom tapé à la main.
        </p>
        {tauri ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={detectLoading}
              onClick={() => void refreshHandlers()}
            >
              {detectLoading ? "Actualisation…" : "Actualiser la liste"}
            </Button>
            {detectError ? (
              <span className={cn("text-xs", warningNoticeTextClassName)}>
                {detectError}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {!tauri ? (
        <p
          className={cn(
            "max-w-3xl rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/20 px-3 py-2 text-sm",
            warningNoticeTextClassName,
          )}
        >
          Hors application Tauri, le navigateur gère les liens : ces choix sont
          enregistrés et s’appliquent lorsque vous utilisez le binaire Artisan.
          La détection des clients mail / téléphone n’est pas disponible ici.
        </p>
      ) : null}

      <section className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/40 p-4">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
          Courriel
        </h2>
        <div className="space-y-2">
          <Label htmlFor="followup-mail-preset">
            Application pour les liens <span className="font-mono">mailto:</span>
          </Label>
          <select
            id="followup-mail-preset"
            className="mt-1 flex h-9 w-full max-w-md rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm text-[var(--color-foreground)]"
            value={p.mailPreset}
            onChange={(e) => setPatch({ mailPreset: e.target.value })}
          >
            {handlerSelectChildren(detectedMail, mailOpts, tauri)}
          </select>
          {tauri && !detectLoading && detectedMail.length === 0 && !detectError ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Aucune application enregistrée pour{" "}
              <span className="font-mono">mailto:</span> n’a été détectée (macOS /
              Linux). Utilisez les suggestions ou le champ ci-dessous.
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="followup-mail-custom">
            Nom ou chemin personnalisé (optionnel)
          </Label>
          <Input
            id="followup-mail-custom"
            className="max-w-md"
            placeholder="ex. Mail, ou chemin /Applications/…/MonClient.app"
            value={p.mailCustom}
            onChange={(e) => setPatch({ mailCustom: e.target.value })}
            autoComplete="off"
          />
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Si ce champ est rempli, il remplace la liste ci-dessus.
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]/40 p-4">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
          Téléphone
        </h2>
        <div className="space-y-2">
          <Label htmlFor="followup-tel-preset">
            Application pour les liens <span className="font-mono">tel:</span>
          </Label>
          <select
            id="followup-tel-preset"
            className="mt-1 flex h-9 w-full max-w-md rounded-md border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm text-[var(--color-foreground)]"
            value={p.telPreset}
            onChange={(e) => setPatch({ telPreset: e.target.value })}
          >
            {handlerSelectChildren(detectedTel, telOpts, tauri)}
          </select>
          {tauri && !detectLoading && detectedTel.length === 0 && !detectError ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Aucune application enregistrée pour{" "}
              <span className="font-mono">tel:</span> n’a été détectée. Utilisez les
              suggestions ou le champ ci-dessous.
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="followup-tel-custom">
            Nom ou chemin personnalisé (optionnel)
          </Label>
          <Input
            id="followup-tel-custom"
            className="max-w-md"
            placeholder="ex. FaceTime, ou chemin vers une app .app"
            value={p.telCustom}
            onChange={(e) => setPatch({ telCustom: e.target.value })}
            autoComplete="off"
          />
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Si ce champ est rempli, il remplace la liste ci-dessus. Sur Windows /
            Linux, le défaut système ouvre souvent déjà le bon composeur.
          </p>
        </div>
      </section>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        Détection plateforme pour les listes :{" "}
        <span className="font-medium text-[var(--color-foreground)]">{os}</span>
        . Les préférences sont stockées sur cet appareil (localStorage).
      </p>
    </div>
  );
}
