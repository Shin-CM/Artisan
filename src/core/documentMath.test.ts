import { describe, expect, it } from "vitest";
import {
  applyDocumentDiscount,
  applyLineDiscountHt,
  computeLine,
  computeMarginPercent,
  computeMarginValue,
  isBelowProductionCost,
  normalizeDiscountKind,
  roundMoneyHt,
  roundMoneyHt2,
  sumDocumentLines,
  sumLineCatalogueGrossHt,
  sumLineDiscountsHtAmount,
} from "./documentMath";

describe("roundMoneyHt2", () => {
  it("arrondit à 2 décimales", () => {
    expect(roundMoneyHt2(3.4)).toBe(3.4);
    expect(roundMoneyHt2(10.126)).toBe(10.13);
  });

  it("corrige les artefacts flottants (addition flottante)", () => {
    const raw = 0.1 + 0.2;
    expect(raw).not.toBe(0.3);
    expect(roundMoneyHt2(raw)).toBe(0.3);
  });
});

describe("roundMoneyHt", () => {
  it("respecte le nombre de décimales", () => {
    expect(roundMoneyHt(1.23456, 3)).toBe(1.235);
    expect(roundMoneyHt(1.23456, 4)).toBe(1.2346);
  });
});

describe("computeLine", () => {
  it("applique la TVA", () => {
    const r = computeLine(
      { quantity: 2, unitPrice: 100, taxRatePercent: 20 },
      false,
    );
    expect(r.lineSubtotal).toBe(200);
    expect(r.lineTax).toBe(40);
    expect(r.lineTotal).toBe(240);
  });

  it("ignore la TVA si document hors taxe", () => {
    const r = computeLine(
      { quantity: 1, unitPrice: 50, taxRatePercent: 20 },
      true,
    );
    expect(r.lineTax).toBe(0);
    expect(r.lineTotal).toBe(50);
  });

  it("applique une remise ligne en pourcentage sur le HT", () => {
    const r = computeLine(
      {
        quantity: 2,
        unitPrice: 100,
        taxRatePercent: 20,
        lineDiscountKind: "percent",
        lineDiscountValue: 10,
      },
      false,
    );
    expect(r.lineSubtotal).toBe(180);
    expect(r.lineTax).toBe(36);
    expect(r.lineTotal).toBe(216);
  });

  it("applique une remise ligne en montant HT fixe", () => {
    const r = computeLine(
      {
        quantity: 1,
        unitPrice: 200,
        taxRatePercent: 10,
        lineDiscountKind: "fixed",
        lineDiscountValue: 50,
      },
      false,
    );
    expect(r.lineSubtotal).toBe(150);
    expect(r.lineTax).toBe(15);
    expect(r.lineTotal).toBe(165);
  });
});

describe("applyLineDiscountHt", () => {
  it("borne le pourcentage et le montant fixe", () => {
    expect(applyLineDiscountHt(100, "percent", 100)).toBe(0);
    expect(applyLineDiscountHt(100, "fixed", 200)).toBe(0);
  });
});

describe("applyDocumentDiscount", () => {
  it("ne change rien si none ou valeur nulle", () => {
    const r = applyDocumentDiscount(100, 20, false, "none", 10);
    expect(r.subtotal).toBe(100);
    expect(r.taxTotal).toBe(20);
    expect(r.total).toBe(120);
    const r2 = applyDocumentDiscount(100, 20, false, "percent", 0);
    expect(r2.total).toBe(120);
  });

  it("applique 10 % sur HT et TVA au prorata", () => {
    const r = applyDocumentDiscount(100, 20, false, "percent", 10);
    expect(r.subtotal).toBe(90);
    expect(r.taxTotal).toBe(18);
    expect(r.total).toBe(108);
  });

  it("applique montant fixe HT", () => {
    const r = applyDocumentDiscount(100, 20, false, "fixed", 25);
    expect(r.subtotal).toBe(75);
    expect(r.taxTotal).toBe(15);
    expect(r.total).toBe(90);
  });

  it("hors taxe : pas de TVA après remise", () => {
    const r = applyDocumentDiscount(200, 0, true, "percent", 50);
    expect(r.subtotal).toBe(100);
    expect(r.taxTotal).toBe(0);
    expect(r.total).toBe(100);
  });

  it("normalizeDiscountKind", () => {
    expect(normalizeDiscountKind("percent")).toBe("percent");
    expect(normalizeDiscountKind("fixed")).toBe("fixed");
    expect(normalizeDiscountKind("")).toBe("none");
    expect(normalizeDiscountKind(undefined)).toBe("none");
  });
});

describe("sumDocumentLines", () => {
  it("agrège plusieurs lignes", () => {
    const { subtotal, taxTotal, total } = sumDocumentLines(
      [
        { quantity: 1, unitPrice: 100, taxRatePercent: 10 },
        { quantity: 2, unitPrice: 50, taxRatePercent: 10 },
      ],
      false,
    );
    expect(subtotal).toBe(200);
    expect(taxTotal).toBe(20);
    expect(total).toBe(220);
  });

  it("agrège sur HT nets après remise ligne puis compatible remise document", () => {
    const lines = [
      {
        quantity: 1,
        unitPrice: 100,
        taxRatePercent: 20,
        lineDiscountKind: "percent" as const,
        lineDiscountValue: 10,
      },
      { quantity: 1, unitPrice: 100, taxRatePercent: 20 },
    ];
    const { subtotal, taxTotal } = sumDocumentLines(lines, false);
    expect(subtotal).toBe(190);
    expect(taxTotal).toBe(38);
    const afterDoc = applyDocumentDiscount(subtotal, taxTotal, false, "percent", 10);
    expect(afterDoc.subtotal).toBe(171);
    expect(afterDoc.taxTotal).toBeCloseTo(34.2, 5);
  });

  it("calcule catalogue et total remises lignes", () => {
    const lines = [
      {
        quantity: 2,
        unitPrice: 50,
        taxRatePercent: 0,
        lineDiscountKind: "fixed" as const,
        lineDiscountValue: 30,
      },
    ];
    expect(sumLineCatalogueGrossHt(lines)).toBe(100);
    expect(sumLineDiscountsHtAmount(lines)).toBe(30);
  });
});

describe("marge", () => {
  it("calcule la marge valeur", () => {
    expect(computeMarginValue(2, 30, 10)).toBe(40);
    expect(computeMarginValue(1, 10, null)).toBeNull();
  });

  it("calcule le pourcentage", () => {
    expect(computeMarginPercent(25, 100)).toBe(25);
    expect(computeMarginPercent(null, 100)).toBeNull();
  });

  it("détecte prix sous coût", () => {
    expect(isBelowProductionCost(5, 10)).toBe(true);
    expect(isBelowProductionCost(15, 10)).toBe(false);
    expect(isBelowProductionCost(10, null)).toBe(false);
  });
});
