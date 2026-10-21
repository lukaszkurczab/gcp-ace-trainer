import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("legacy device cleanup starts outside and before profile storage preparation", () => {
  const root = readFileSync("src/RegularApplicationRoot.tsx", "utf8");
  const host = root.indexOf("<RetiredAccountSecretsCleanupHost />");
  const gate = root.indexOf("<ProfileStoragePreparationGate>");

  assert.ok(host >= 0);
  assert.ok(gate >= 0);
  assert.ok(host < gate);
});
