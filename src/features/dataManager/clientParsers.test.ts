import { describe, expect, it } from "vitest";
import {
  capPreviewRows,
  clientRecordsToPreviewRows,
  parseClientPreviewFromCsvText,
  CLIENT_PREVIEW_CAP,
} from "./clientParsers";

describe("clientParsers", () => {
  it("parseClientPreviewFromCsvText ignore la ligne d’en-tête", () => {
    const rows = parseClientPreviewFromCsvText(
      "name;email\nAlice;a@ex.fr\nBob;",
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.name).toBe("Alice");
    expect(rows[0]?.selectable).toBe(true);
    expect(rows[1]?.name).toBe("Bob");
    expect(rows[1]?.selectable).toBe(true);
  });

  it("clientRecordsToPreviewRows marque nom vide non sélectionnable", () => {
    const rows = clientRecordsToPreviewRows(
      [{ name: "  ", email: "x@y.fr" }, { name: "Ok", email: null }],
      "v1",
    );
    expect(rows[0]?.selectable).toBe(false);
    expect(rows[1]?.selectable).toBe(true);
  });

  it("capPreviewRows tronque au plafond", () => {
    const many = Array.from({ length: CLIENT_PREVIEW_CAP + 10 }, (_, i) => ({
      id: `x${i}`,
    }));
    const { rows, truncated } = capPreviewRows(many);
    expect(truncated).toBe(true);
    expect(rows).toHaveLength(CLIENT_PREVIEW_CAP);
  });
});
