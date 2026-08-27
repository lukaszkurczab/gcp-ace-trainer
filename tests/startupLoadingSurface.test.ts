import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

test("bootstrap has one themed branded loading surface with no synthetic completion", () => {
  const gate = source("src/content/application/ContentPreparationGate.tsx");
  const loadingState = source("src/components/LoadingState.tsx");

  assert.equal((gate.match(/variant="startup"/g) ?? []).length, 1);
  assert.match(gate, /state\.kind === "loading"[\s\S]*?<Screen edges=\{\["top", "bottom"\]\} scroll=\{false\}><LoadingState title="Preparing content…" variant="startup" \/><\/Screen>/);
  assert.match(loadingState, /variant\?: "default" \| "startup"/);
  assert.match(loadingState, /<PatternlyMark[\s\S]*treatment=\{colorMode === "dark" \? "mint" : "navy"\}/);
  assert.match(loadingState, /<StatusBar[\s\S]*style=\{colorMode === "dark" \? "light" : "dark"\}/);
  assert.match(loadingState, /accessibilityRole="progressbar"[\s\S]*accessibilityState=\{\{ busy: true \}\}/);
  assert.match(gate, /CONTENT_PREPARATION_TIMEOUT_MS\s*=\s*15_000/);
  assert.match(gate, /setTimeout\([\s\S]*?Content preparation timed out/);
  assert.match(gate, /<EmptyState actionLabel="Retry"[\s\S]*?onActionPress=/);
  assert.doesNotMatch(`${gate}\n${loadingState}`, /setInterval|delay\s*:/);
});
