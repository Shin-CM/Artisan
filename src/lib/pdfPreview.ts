import { isTauri } from "@tauri-apps/api/core";
import { writePdfPreviewTemp } from "@/lib/api";

/**
 * Ouvre un PDF généré : navigateur (blob + onglet), Tauri (fichier temporaire + visionneuse système).
 */
export async function openGeneratedPdfPreview(bytes: Uint8Array): Promise<void> {
  if (isTauri()) {
    const path = await writePdfPreviewTemp(bytes);
    const { openPath } = await import("@tauri-apps/plugin-opener");
    await openPath(path);
    return;
  }
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
}
