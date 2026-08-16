const MAX_LEN = 600;

/**
 * Normalise une erreur d’import / validation police PDF pour affichage UI.
 */
export function formatFontImportError(err: unknown): string {
  let s: string;
  if (err instanceof Error) s = err.message;
  else if (typeof err === "string") s = err;
  else {
    try {
      s = String(err);
    } catch {
      s = "Erreur inconnue.";
    }
  }
  const t = s.trim();
  if (!t) return "Erreur inconnue.";
  return t.length > MAX_LEN ? `${t.slice(0, MAX_LEN)}…` : t;
}
