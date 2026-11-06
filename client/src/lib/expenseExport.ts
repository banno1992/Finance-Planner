import type { Cashflow } from "./localStorage";

/** Tabs separate columns when pasted directly into Google Sheets. */
export function expensesToSpreadsheet(items: Cashflow[]): string {
  const rows = items.filter(item => item.type === "expense").map(item => {
    // Keep each name in one cell, and prevent it being interpreted as a formula.
    const name = item.name.replace(/[\t\r\n]+/g, " ").trim();
    const safeName = /^[=+\-@]/.test(name) ? `'${name}` : name;
    const amount = Number(item.amount);
    if (!Number.isFinite(amount)) {
      throw new Error(`Check the amount for "${name}" before copying.`);
    }
    return [safeName, String(amount), item.bucket === "wants" ? "Want" : "Need"].join("\t");
  });
  return ["Expense name\tAmount\tNeed/Want", ...rows].join("\n");
}
