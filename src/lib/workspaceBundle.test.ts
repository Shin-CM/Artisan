import { describe, expect, it } from "vitest";
import {
  buildWorkspaceExportPayload,
  filterRecordsByIds,
  isWorkspaceBundlePayload,
  parseWorkspacePayload,
  selectedIdsByExportKind,
  WORKSPACE_BUNDLE_KIND,
} from "./workspaceBundle";
import type { DataManagerBundle } from "@/features/dataManager/useDataManagerWorkspaceData";

const emptyBundle: DataManagerBundle = {
  clients: [],
  categories: [],
  articles: [],
  quotes: [],
  invoices: [],
  taxRates: [],
  snippets: [],
  presets: [],
  projects: [],
};

const sampleBundle: DataManagerBundle = {
  ...emptyBundle,
  clients: [
    {
      id: "c1",
      workspaceId: "w",
      name: "A",
      email: null,
      phone: null,
      addressJson: null,
      notes: null,
      detailsJson: null,
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
  ],
  taxRates: [
    {
      id: "t1",
      workspaceId: "w",
      name: "TVA",
      rate: 20,
      isDefault: true,
    },
  ],
  articles: [
    {
      id: "a1",
      workspaceId: "w",
      categoryId: null,
      name: "Art",
      description: null,
      basePrice: 1,
      flatPrice: null,
      hourlyRate: null,
      productionCost: null,
      optionsJson: "{}",
      sortOrder: 0,
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "a2",
      workspaceId: "w",
      categoryId: "cat1",
      name: "B",
      description: null,
      basePrice: 2,
      flatPrice: null,
      hourlyRate: null,
      productionCost: null,
      optionsJson: "{}",
      sortOrder: 1,
      createdAt: "",
      updatedAt: "",
    },
  ],
};

describe("workspaceBundle", () => {
  it("selectedIdsByExportKind fusionne articles:all et articles:uncat", () => {
    const m = new Map<string, Set<string>>();
    m.set("articles:all", new Set(["a1"]));
    m.set("articles:uncat", new Set(["a1", "a2"]));
    const by = selectedIdsByExportKind(m);
    expect(by.get("articles")).toEqual(new Set(["a1", "a2"]));
  });

  it("buildWorkspaceExportPayload n’inclut que les kinds sélectionnés", () => {
    const sel = new Map<string, Set<string>>();
    sel.set("clients", new Set(["c1"]));
    const p = buildWorkspaceExportPayload({
      bundle: sampleBundle,
      sidebarSelection: sel,
      includeAllWhenNoSelection: false,
    });
    expect(p.bundleKind).toBe(WORKSPACE_BUNDLE_KIND);
    expect(p.schemaVersion).toBe(2);
    expect(p.modules.clients?.records).toHaveLength(1);
    expect(p.modules["tax-rates"]).toBeUndefined();
  });

  it("includeAllWhenNoSelection ajoute les modules sans cases", () => {
    const sel = new Map<string, Set<string>>();
    sel.set("clients", new Set(["c1"]));
    const p = buildWorkspaceExportPayload({
      bundle: sampleBundle,
      sidebarSelection: sel,
      includeAllWhenNoSelection: true,
    });
    expect(p.modules.clients?.records).toHaveLength(1);
    expect(p.modules["tax-rates"]?.records).toHaveLength(1);
    expect(p.modules.articles?.records).toHaveLength(2);
  });

  it("parseWorkspacePayload accepte un objet valide", () => {
    const raw = {
      schemaVersion: 2,
      bundleKind: WORKSPACE_BUNDLE_KIND,
      createdAt: "2020-01-01T00:00:00.000Z",
      modules: {
        clients: { kind: "clients", schemaVersion: 1, records: [] },
      },
    };
    expect(() => parseWorkspacePayload(raw)).not.toThrow();
    expect(parseWorkspacePayload(raw).modules.clients?.records).toEqual([]);
  });

  it("parseWorkspacePayload rejette un mono-kind", () => {
    expect(() =>
      parseWorkspacePayload({ kind: "clients", records: [] }),
    ).toThrow();
  });

  it("isWorkspaceBundlePayload", () => {
    expect(
      isWorkspaceBundlePayload({
        schemaVersion: 2,
        bundleKind: WORKSPACE_BUNDLE_KIND,
        createdAt: "x",
        modules: {},
      }),
    ).toBe(true);
    expect(isWorkspaceBundlePayload({ kind: "clients", records: [] })).toBe(
      false,
    );
  });

  it("filterRecordsByIds", () => {
    expect(
      filterRecordsByIds(
        [{ id: "a" }, { id: "b" }],
        new Set(["b"]),
      ),
    ).toEqual([{ id: "b" }]);
  });
});
