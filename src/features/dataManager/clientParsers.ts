/** Parseurs clients pour aperçu import (CSV, Excel → lignes, chaîne v1:). */

export const CLIENT_PREVIEW_CAP = 500;

export type ClientPreviewRow = {
  id: string;
  name: string;
  email: string | null;
  /** Ligne invalide (nom vide) : affichée mais non importable */
  selectable: boolean;
  sourceLabel: string;
};

function rowsToClientRecords(
  rows: Record<string, unknown>[],
  sourcePrefix: string,
): ClientPreviewRow[] {
  const out: ClientPreviewRow[] = [];
  let i = 0;
  for (const row of rows) {
    i += 1;
    const name = String(
      row.name ?? row.Name ?? row.nom ?? row.Nom ?? "",
    ).trim();
    const emailRaw =
      row.email ?? row.Email ?? row.courriel ?? row.Courriel ?? "";
    const email = String(emailRaw).trim() || null;
    const id = `${sourcePrefix}:${i}`;
    out.push({
      id,
      name,
      email,
      selectable: name.length > 0,
      sourceLabel: `${sourcePrefix} · ligne ${i}`,
    });
  }
  return out;
}

export function parseClientPreviewFromCsvText(
  csvText: string,
): ClientPreviewRow[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const dataLines = lines.slice(1);
  const rows: Record<string, unknown>[] = [];
  let lineNum = 1;
  for (const line of dataLines) {
    lineNum += 1;
    const [nameRaw, emailRaw] = line.split(";").map((s) => s?.trim() ?? "");
    rows.push({
      name: nameRaw ?? "",
      email: emailRaw ?? "",
      __line: lineNum,
    });
  }
  const withSource = rowsToClientRecords(rows, "CSV");
  return withSource.map((r, idx) => ({
    ...r,
    id: `csv:${idx + 2}`,
    sourceLabel: `CSV · ligne ${idx + 2}`,
  }));
}

export function parseClientPreviewFromExcelRows(
  rows: Record<string, unknown>[],
  fileLabel: string,
): ClientPreviewRow[] {
  return rowsToClientRecords(rows, fileLabel).map((r, idx) => ({
    ...r,
    id: `${fileLabel}:${idx + 1}`,
    sourceLabel: `${fileLabel} · ligne ${idx + 1}`,
  }));
}

export type ClientV1Record = { name?: string; email?: string | null };

export function clientRecordsToPreviewRows(
  records: ClientV1Record[],
  sourceLabel: string,
): ClientPreviewRow[] {
  return records.map((r, idx) => {
    const name = String(r?.name ?? "").trim();
    const email =
      r?.email != null && String(r.email).trim()
        ? String(r.email).trim()
        : null;
    return {
      id: `v1:${idx + 1}`,
      name,
      email,
      selectable: name.length > 0,
      sourceLabel: `${sourceLabel} · #${idx + 1}`,
    };
  });
}

export function capPreviewRows<T extends { id: string }>(
  rows: T[],
): { rows: T[]; truncated: boolean } {
  if (rows.length <= CLIENT_PREVIEW_CAP) {
    return { rows, truncated: false };
  }
  return { rows: rows.slice(0, CLIENT_PREVIEW_CAP), truncated: true };
}
