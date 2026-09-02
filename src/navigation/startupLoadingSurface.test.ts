import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

test("bootstrap has one themed branded loading surface with no synthetic completion", () => {
  const gate = source("src/content/application/ContentPreparationGate.tsx");
  const loadingState = source("src/components/LoadingState.tsx");

  assert.equal((gate.match(/variant="startup"/g) ?? []).length, 1);
  assert.match(gate, /state\.kind === "loading"[\s\S]*?runtimeSelectors\.content\.preparing\(state\.phase\)[\s\S]*?<LoadingState description=\{PREPARATION_PHASE_COPY\[state\.phase\]\} title="Preparing content…" variant="startup" \/>/);
  assert.match(loadingState, /variant\?: "default" \| "startup"/);
  assert.match(loadingState, /<PatternlyMark[\s\S]*treatment=\{colorMode === "dark" \? "white" : "mint"\}/);
  assert.match(loadingState, /Animated\.loop\([\s\S]*Animated\.timing\([\s\S]*useNativeDriver: true/);
  assert.match(loadingState, /startupProgressTrack:[\s\S]*height: 4/);
  assert.match(loadingState, /startupProgressFill:\s*\{/);
  assert.match(loadingState, /<Animated\.View style=\{\[styles\.startupProgressFill,[\s\S]*width: segmentWidth/);
  assert.match(loadingState, /isReduceMotionEnabled\(\)[\s\S]*reduceMotionChanged/);
  assert.doesNotMatch(loadingState, /width: "42%"/);
  assert.match(loadingState, /animation\.start\(\)[\s\S]*animation\.stop\(\)/);
  assert.match(loadingState, /<StatusBar[\s\S]*style=\{colorMode === "dark" \? "light" : "dark"\}/);
  assert.match(loadingState, /accessibilityRole="progressbar"[\s\S]*accessibilityState=\{\{ busy: true \}\}/);
  assert.match(gate, /CONTENT_PREPARATION_TIMEOUT_MS\s*=\s*15_000/);
  assert.match(gate, /setTimeout\([\s\S]*?preparationTimeoutReason\(currentPhase\)/);
  assert.match(gate, /Content preparation timed out while/);
  assert.match(gate, /ContentPreparationPhase[\s\S]*?"opening-storage"[\s\S]*?"recovering-learning-state"[\s\S]*?"verifying-content"[\s\S]*?"resuming-session"/);
  assert.match(gate, /runtimeSelectors\.content\.unavailable\(\)/);
  assert.match(gate, /setState\(\{ kind: "loading", phase: "opening-storage" \}\)/);
  assert.match(gate, /<EmptyState actionLabel="Retry"[\s\S]*?onActionPress=/);
  assert.doesNotMatch(`${gate}\n${loadingState}`, /setInterval|delay\s*:/);
});
