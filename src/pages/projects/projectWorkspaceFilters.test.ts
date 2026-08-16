import { describe, expect, it } from "vitest";
import { filterDocumentsByProjectId } from "@/pages/projects/projectWorkspaceFilters";

describe("filterDocumentsByProjectId", () => {
  it("retourne tous les éléments si projectId vide", () => {
    const rows = [{ projectId: "a" }, { projectId: "b" }];
    expect(filterDocumentsByProjectId(rows, "")).toEqual(rows);
    expect(filterDocumentsByProjectId(rows, "  ")).toEqual(rows);
  });

  it("filtre sur project_id exact", () => {
    const rows = [
      { projectId: "p1" },
      { projectId: null },
      { projectId: "p1" },
    ];
    expect(filterDocumentsByProjectId(rows, "p1")).toEqual([
      { projectId: "p1" },
      { projectId: "p1" },
    ]);
  });
});
