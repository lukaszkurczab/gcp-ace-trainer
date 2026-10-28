import assert from "node:assert/strict";
import { test } from "node:test";
import { toggleExamOption } from "./examResponseSelection";
test("exact-N limit never replaces earlier stable IDs; deselection permits a different choice", () => {
  const selected = ["c", "a"];
  assert.equal(toggleExamOption(selected, "b", 2), selected);
  assert.deepEqual(toggleExamOption(toggleExamOption(selected, "a", 2), "b", 2), ["c", "b"]);
  assert.deepEqual(toggleExamOption([], "false", 2), ["false"]);
});
