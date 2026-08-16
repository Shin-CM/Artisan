import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dayIsoUnderPoint } from "./dragOriginIso";

/**
 * Stub léger pour simuler un `HTMLElement` avec `closest` et `dataset`,
 * suffisant pour `dayIsoUnderPoint` sans avoir besoin de JSDOM.
 */
type StubElement = {
  dataset: Record<string, string>;
  parent: StubElement | null;
  closest: (selector: string) => StubElement | null;
};

function makeEl(
  attrs: Record<string, string> = {},
  parent: StubElement | null = null,
): StubElement {
  const node: StubElement = {
    dataset: { ...attrs },
    parent,
    closest(selector: string) {
      const match =
        selector === "[data-day-iso]"
          ? (n: StubElement) => n.dataset.dayIso !== undefined
          : selector === "[data-event-id]"
            ? (n: StubElement) => n.dataset.eventId !== undefined
            : () => false;
      let cur: StubElement | null = this;
      while (cur) {
        if (match(cur)) return cur;
        cur = cur.parent;
      }
      return null;
    },
  };
  return node;
}

const originalDocument = (globalThis as { document?: Document }).document;

beforeEach(() => {
  (globalThis as { document: unknown }).document = {
    elementsFromPoint: () => [],
  };
});

afterEach(() => {
  if (originalDocument === undefined) {
    delete (globalThis as { document?: unknown }).document;
  } else {
    (globalThis as { document: unknown }).document = originalDocument;
  }
});

function mockElements(list: StubElement[]) {
  (globalThis as { document: { elementsFromPoint: unknown } }).document = {
    elementsFromPoint: () => list,
  };
}

describe("dayIsoUnderPoint", () => {
  it("retourne l'ISO de la cellule située sous le point", () => {
    mockElements([makeEl({ dayIso: "2026-05-12" })]);
    expect(dayIsoUnderPoint(10, 10)).toBe("2026-05-12");
  });

  it("traverse une barre multi-jours pour atteindre la cellule sous-jacente", () => {
    const cell = makeEl({ dayIso: "2026-05-20" });
    const bar = makeEl({ eventId: "evt-1" });
    mockElements([bar, cell]);
    expect(dayIsoUnderPoint(10, 10)).toBe("2026-05-20");
  });

  it("remonte par closest si on tape sur un descendant de la cellule", () => {
    const cell = makeEl({ dayIso: "2026-05-25" });
    const inner = makeEl({}, cell);
    mockElements([inner]);
    expect(dayIsoUnderPoint(0, 0)).toBe("2026-05-25");
  });

  it("retourne null si aucun élément n'a `data-day-iso`", () => {
    mockElements([makeEl()]);
    expect(dayIsoUnderPoint(0, 0)).toBeNull();
  });

  it("retourne null si la liste est vide", () => {
    mockElements([]);
    expect(dayIsoUnderPoint(0, 0)).toBeNull();
  });

  it("retourne null si `document` n'est pas défini (SSR)", () => {
    delete (globalThis as { document?: unknown }).document;
    expect(dayIsoUnderPoint(0, 0)).toBeNull();
  });

  it("ignore une cellule qui n'est pas descendante du root", () => {
    const cell = makeEl({ dayIso: "2026-06-10" });
    mockElements([cell]);
    const root = { contains: () => false } as unknown as Element;
    expect(dayIsoUnderPoint(0, 0, root)).toBeNull();
  });

  it("accepte la cellule si le root la contient", () => {
    const cell = makeEl({ dayIso: "2026-06-11" });
    mockElements([cell]);
    const root = { contains: (n: unknown) => n === cell } as unknown as Element;
    expect(dayIsoUnderPoint(0, 0, root)).toBe("2026-06-11");
  });
});
