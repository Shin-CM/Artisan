export function makeCurrencyFormatter(currency: string) {
  return (n: number) =>
    n.toLocaleString("fr-FR", { style: "currency", currency });
}
