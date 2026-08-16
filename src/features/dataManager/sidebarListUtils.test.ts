import { describe, expect, it } from "vitest";
import {
  normalizeSearch,
  paginateSlice,
  matchesSearch,
  SIDEBAR_PAGE_SIZE,
} from "./sidebarListUtils";

describe("sidebarListUtils", () => {
  it("normalizeSearch retire accents", () => {
    expect(normalizeSearch("Élève")).toBe("eleve");
  });

  it("matchesSearch insensible aux accents", () => {
    const q = normalizeSearch("cafe");
    expect(matchesSearch("Café", q)).toBe(true);
  });

  it("paginateSlice", () => {
    const arr = Array.from({ length: 45 }, (_, i) => i);
    const { slice, pageCount, total } = paginateSlice(arr, 0, 40);
    expect(total).toBe(45);
    expect(pageCount).toBe(2);
    expect(slice).toHaveLength(40);
    const p2 = paginateSlice(arr, 1, 40);
    expect(p2.slice).toHaveLength(5);
  });

  it("SIDEBAR_PAGE_SIZE positif", () => {
    expect(SIDEBAR_PAGE_SIZE).toBeGreaterThan(0);
  });
});
