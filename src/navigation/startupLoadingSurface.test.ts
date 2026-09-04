import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

test("bootstrap owns one branded phase-aware loading surface with no synthetic completion", () => {
  const gate = source("src/content/application/ContentPreparationGate.tsx");
  const loadingState = source("src/components/LoadingState.tsx");

  assert.match(gate, /export function ContentBootstrapLoadingSkeleton\(\{ phase \}/);
  assert.match(gate, /state\.kind === "loading"[\s\S]*?runtimeSelectors\.content\.preparing\(state\.phase\)[\s\S]*?<ContentBootstrapLoadingSkeleton phase=\{state\.phase\} \/>/);
  assert.match(gate, /const phaseCopy = t\(PREPARATION_PHASE_COPY\[phase\]\)/);
  assert.match(gate, /const title = t\("Preparing content…"\);/);
  assert.match(gate, /<LoadingState[\s\S]*?title=\{title\}/);
  assert.match(gate, /description=\{phaseCopy\}/);
  assert.match(gate, /descriptionTestID="content-bootstrap-phase"/);
  assert.match(gate, /testID="content-bootstrap-loading-skeleton"/);
  assert.match(gate, /showLogo/);
  assert.match(loadingState, /accessibilityRole="progressbar"[\s\S]*?accessibilityState=\{\{ busy: true \}\}/);
  assert.match(loadingState, /<SkeletonShape motion=\{motion\} style=\{styles\.statusBand\}/);
  assert.equal((loadingState.match(/useSkeletonGlassMotion\(\)/g) ?? []).length, 1);
  assert.match(loadingState, /palette\.progress\.loadingTrack/);
  assert.match(loadingState, /palette\.border/);
  assert.match(gate, /CONTENT_PREPARATION_TIMEOUT_MS\s*=\s*15_000/);
  assert.match(gate, /setTimeout\([\s\S]*?preparationTimeoutReason\(currentPhase\)/);
  assert.match(gate, /Content preparation timed out while/);
  assert.match(gate, /ContentPreparationPhase[\s\S]*?"opening-storage"[\s\S]*?"recovering-learning-state"[\s\S]*?"verifying-content"[\s\S]*?"resuming-session"/);
  assert.match(gate, /runtimeSelectors\.content\.unavailable\(\)/);
  assert.match(gate, /setState\(\{ kind: "loading", phase: "opening-storage" \}\)/);
  assert.match(gate, /<EmptyState actionLabel="Retry"[\s\S]*?onActionPress=/);
  assert.doesNotMatch(`${gate}\n${loadingState}`, /Variant|startupProgress|startupContent|Preparing your questions/);
  assert.doesNotMatch(`${gate}\n${loadingState}`, /setInterval|delay\s*:/);
});

test("generic LoadingState no longer carries the startup animation variant", () => {
  const loadingState = source("src/components/LoadingState.tsx");

  assert.match(loadingState, /type LoadingStateProps = Readonly<\{[\s\S]*?description\?: string;[\s\S]*?title: string;/);
  assert.doesNotMatch(loadingState, /variant=|StatusBar|Animated|AccessibilityInfo|startup/);
  assert.match(loadingState, /showLogo\?: boolean/);
  assert.match(loadingState, /<PatternlyMark decorative/);
  assert.match(loadingState, /<SkeletonShape motion=\{motion\} style=\{styles\.statusBand\}/);
  assert.match(loadingState, /useSkeletonGlassMotion\(\)/);
  assert.match(loadingState, /accessibilityRole="progressbar"[\s\S]*accessibilityState=\{\{ busy: true \}\}/);
});
