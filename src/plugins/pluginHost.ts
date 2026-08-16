/**
 * Hôte d’extensions : les manifestes en base (register_plugin_manifest) pourront
 * déclarer des routes BDD (sidebar 1 + panneau + vue principale).
 * MVP : validation légère du JSON pour affichage dans Paramètres ; branchement
 * navigation dynamique = évolution sans casser les manifestes existants.
 */

export type InternalManifestV1 = {
  id: string;
  name: string;
  version: string;
  capabilities?: string[];
  /** Future : entrées de navigation type { routeKey, icon, labelFr } */
  navigation?: unknown[];
};

export function parseInternalManifest(json: string): InternalManifestV1 | null {
  try {
    const o = JSON.parse(json) as InternalManifestV1;
    if (typeof o.id === "string" && typeof o.name === "string") return o;
  } catch {
    /* ignore */
  }
  return null;
}
