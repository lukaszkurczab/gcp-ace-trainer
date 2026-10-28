import assert from "node:assert/strict";
import test from "node:test";

import { findPersist13FixtureErrorMetadata } from "./persist13FixtureErrorContext";

const isStage = (value: string): value is "seed" | "journal_materialized" => value === "seed" || value === "journal_materialized";
const isCategory = (value: string): value is "fault_injection_failed" | "bootstrap_blocked" => value === "fault_injection_failed" || value === "bootstrap_blocked";

test("fixture diagnostics recover only allowlisted stage/category through bounded causes", () => {
  const inner = Object.assign(new Error("private message is not returned"), { stage: "seed", category: "fault_injection_failed", id: "private-id" });
  const wrapped = Object.assign(new Error("outer wrapper"), { cause: Object.assign(new Error("middle wrapper"), { cause: inner }) });
  assert.deepEqual(findPersist13FixtureErrorMetadata(wrapped, isStage, isCategory), { stage: "seed", category: "fault_injection_failed" });
  assert.deepEqual(findPersist13FixtureErrorMetadata({ stage: "unknown-stage", category: "secret", cause: inner }, isStage, isCategory), { stage: "seed", category: "fault_injection_failed" });
});

test("fixture diagnostics terminate on cycles, stop at the bound, and preserve unknown errors", () => {
  const cycle: { cause?: unknown; stage?: string; category?: string } = {};
  cycle.cause = cycle;
  assert.deepEqual(findPersist13FixtureErrorMetadata(cycle, isStage, isCategory), {});

  let deep: unknown = Object.assign(new Error("too deep"), { stage: "seed", category: "fault_injection_failed" });
  for (let depth = 0; depth < 8; depth += 1) deep = Object.assign(new Error("wrapper"), { cause: deep });
  assert.deepEqual(findPersist13FixtureErrorMetadata(deep, isStage, isCategory), {});
  assert.deepEqual(findPersist13FixtureErrorMetadata(new Error("unclassified"), isStage, isCategory), {});
});
