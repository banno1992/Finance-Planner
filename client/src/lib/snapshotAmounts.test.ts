import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateSnapshotAmount, evaluateSnapshotBalances } from "./snapshotAmounts";
import { localDB } from "./localStorage";

test("evaluates snapshot sums and ordinary balances exactly", () => {
  for (const [input, expected] of [
    ["123+456", "579"], ["12+34+56", "102"], ["121+953", "1074"],
    ["0.1+0.2", "0.3"], ["123.45 + 6.55", "130"],
    ["-12+34", "22"], ["12+-34", "-22"],
    [".5+.25", "0.75"], ["123.40", "123.4"],
    ["100", "100"], ["0.00", "0"], ["", "0"], ["   ", "0"],
  ]) {
    assert.equal(evaluateSnapshotAmount(input), expected, input);
  }
});

test("rejects incomplete, unsupported and non-finite input", () => {
  for (const input of ["123+", "+123", "12++34", "12+abc", "1*2", "1-2", "1e3", "Infinity", "1,000", "1 2", "9".repeat(400)]) {
    assert.equal(evaluateSnapshotAmount(input), null, input);
  }
});

test("normalizes every category before saving, or rejects the entire snapshot", () => {
  assert.deepEqual(evaluateSnapshotBalances({ "1": "123+456", "2": "12+34+56", "3": "" }), { "1": "579", "2": "102", "3": "0" });
  assert.equal(evaluateSnapshotBalances({ "1": "123+456", "2": "12+" }), null);
  assert.deepEqual(evaluateSnapshotBalances({}), {});
});

test("editing and resaving persists the evaluated sum and preserves other balances", () => {
  const storage = new Map<string, string>();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
  try {
    const snapshot = localDB.createSnapshot("2026-10-01", { "1": "121", "2": "50" });
    const balances = evaluateSnapshotBalances({ "1": "121+953", "2": "50" });
    assert.ok(balances);
    localDB.updateSnapshot(snapshot.id, balances);
    const saved = localDB.getSnapshots().find(item => item.id === snapshot.id);
    assert.equal(saved?.details.find(detail => detail.categoryId === 1)?.balance, "1074");
    assert.equal(saved?.details.find(detail => detail.categoryId === 2)?.balance, "50");
    assert.equal(saved?.totalNetWorth, "1124");
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});