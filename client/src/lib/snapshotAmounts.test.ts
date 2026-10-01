import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateSnapshotAmount, evaluateSnapshotBalances } from "./snapshotAmounts";

test("evaluates snapshot sums and ordinary balances exactly", () => {
  for (const [input, expected] of [
    ["123+456", "579"], ["12+34+56", "102"],
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