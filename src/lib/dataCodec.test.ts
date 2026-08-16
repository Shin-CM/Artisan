import { describe, expect, it } from "vitest";
import { exportPayloadToString, importStringToPayload } from "./dataCodec";

describe("dataCodec", () => {
  it("export puis import conserve l’objet", () => {
    const obj = {
      kind: "clients",
      schemaVersion: 1,
      records: [{ name: "A", email: "a@ex.fr" }],
    };
    const s = exportPayloadToString(obj);
    expect(s.startsWith("v1:")).toBe(true);
    const back = importStringToPayload<typeof obj>(s);
    expect(back).toEqual(obj);
  });

  it("export partiel clients conserve le sous-ensemble après round-trip", () => {
    const obj = {
      kind: "clients",
      schemaVersion: 1,
      records: [
        { id: "1", name: "A", email: "a@ex.fr" },
        { id: "2", name: "B", email: null },
      ],
    };
    const s = exportPayloadToString(obj);
    const back = importStringToPayload<typeof obj>(s);
    expect(back.records).toHaveLength(2);
    expect(back.records?.[0]?.name).toBe("A");
  });
});
