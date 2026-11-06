import assert from "node:assert/strict";
import { test } from "node:test";
import { expensesToSpreadsheet } from "./expenseExport";
import type { Cashflow } from "./localStorage";

const expense = (overrides: Partial<Cashflow> = {}): Cashflow => ({
  id: 1, name: "Rent", amount: "1200.50", type: "expense", bucket: "needs", ...overrides,
});

test("exports three tab-separated columns in the supplied order, with numeric amounts", () => {
  assert.equal(expensesToSpreadsheet([
    expense({ name: "Dining, coffee", amount: "25.75", bucket: "wants" }),
    expense(),
    expense({ type: "income", name: "Salary" }),
    expense({ name: "Insurance", amount: "30", bucket: null }),
  ]), "Expense name\tAmount\tNeed/Want\nDining, coffee\t25.75\tWant\nRent\t1200.5\tNeed\nInsurance\t30\tNeed");
});

test("keeps names in a single cell and prevents spreadsheet formulas", () => {
  assert.equal(expensesToSpreadsheet([
    expense({ name: "Food\tand\nsupplies" }),
    expense({ name: '=IMPORTXML("example")' }),
  ]), 'Expense name\tAmount\tNeed/Want\nFood and supplies\t1200.5\tNeed\n\'=IMPORTXML("example")\t1200.5\tNeed');
});

test("handles empty exports and rejects invalid amounts", () => {
  assert.equal(expensesToSpreadsheet([]), "Expense name\tAmount\tNeed/Want");
  assert.throws(() => expensesToSpreadsheet([expense({ amount: "invalid" })]), /Check the amount/);
});
