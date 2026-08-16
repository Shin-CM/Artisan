import { isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";

export type OpenExternalUrlOptions = {
  /**
   * Nom d’application passé au plugin opener (ex. « Mail », « Microsoft Outlook »).
   * Sous navigateur web, ignoré — seul le défaut système s’applique.
   */
  openWith?: string;
};

/**
 * Ouvre une URL « externe » (mailto:, tel:, https:, …). Sous Tauri, la WebView
 * ne déclenche pas toujours le client mail / le composeur téléphonique sur un
 * simple `<a href>` — on passe par le plugin opener.
 */
export async function openExternalUrl(
  href: string,
  opts?: OpenExternalUrlOptions,
): Promise<void> {
  const app = opts?.openWith?.trim();
  if (isTauri()) {
    if (app) await openUrl(href, app);
    else await openUrl(href);
  } else {
    window.location.assign(href);
  }
}
