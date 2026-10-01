/**
 * Evaluate numbers joined by + without executing arbitrary expressions.
 * Decimal arithmetic stays exact (e.g. 0.1+0.2 becomes "0.3").
 * Blank fields retain the existing zero-balance behavior.
 */
export function evaluateSnapshotAmount(input: string): string | null {
  if (!input.trim()) return "0";
  const terms = input.split("+").map(term => term.trim());
  if (terms.some(term => !/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(term))) return null;

  const precision = Math.max(...terms.map(term => (term.split(".")[1] || "").length));
  let total = BigInt(0);
  for (const term of terms) {
    const negative = term.startsWith("-");
    const [whole, fraction = ""] = term.replace(/^-/, "").split(".");
    const value = BigInt((whole || "0") + fraction.padEnd(precision, "0"));
    total += negative ? -value : value;
  }

  const negative = total < BigInt(0);
  const digits = (negative ? -total : total).toString().padStart(precision + 1, "0");
  const result = precision
    ? `${digits.slice(0, -precision)}.${digits.slice(-precision)}`.replace(/\.?0+$/, "")
    : digits;
  const signed = `${negative ? "-" : ""}${result}`;
  return Number.isFinite(Number(signed)) ? signed : null;
}

export function evaluateSnapshotBalances(balances: Record<string, string>): Record<string, string> | null {
  const evaluated: Record<string, string> = {};
  for (const [id, input] of Object.entries(balances)) {
    const amount = evaluateSnapshotAmount(input);
    if (amount === null) return null;
    evaluated[id] = amount;
  }
  return evaluated;
}