export function rateMatches(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-6;
}

export function formatTaxPct(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n);
}
