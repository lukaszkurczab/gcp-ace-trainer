import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

test("bootstrap owns one branded phase-aware loading surface with no synthetic completion", () => {
  const gate = source("src/content/application/ContentPreparationGate.tsx");
  const loadingState = source("src/components/LoadingState.tsx");

  const presentation = source("src/content/application/startupPreparationSurfaces.tsx");
  assert.match(presentation, /export function ContentBootstrapLoadingSkeleton\(\)/);
  assert.match(gate, /state\.kind === "loading"[\s\S]*?<StartupLoadingSurface testID=\{runtimeSelectors\.content\.preparing\(state\.phase\)\} contentSkeleton=\{!account\.isMaterializedAccountTransition\}/);
  assert.match(presentation, /testID="content-bootstrap-loading-skeleton"><AccountProfileTransitionLoadingState/);
  assert.match(gate, /runtimeSelectors\.content\.preparing\(state\.phase\)/);
  assert.match(source("src/application/account/AccountProfileTransitionLoadingState.tsx"), /testID="account-profile-transition-loading"/);
  assert.match(loadingState, /accessibilityRole="progressbar"[\s\S]*?accessibilityState=\{\{ busy: true \}\}/);
  assert.match(loadingState, /<SkeletonShape motion=\{motion\} style=\{styles\.statusBand\}/);
  assert.equal((loadingState.match(/useSkeletonGlassMotion\(\)/g) ?? []).length, 1);
  assert.match(loadingState, /palette\.progress\.loadingTrack/);
  assert.match(loadingState, /palette\.border/);
  assert.match(gate, /CONTENT_PREPARATION_TIMEOUT_MS\s*=\s*15_000/);
  assert.match(gate, /outcome\.publication === "timeout"[\s\S]*?preparationTimeoutReason\(currentPhase\)/);
  assert.match(gate, /Content preparation timed out while/);
  assert.match(gate, /ContentPreparationPhase[\s\S]*?"opening-storage"[\s\S]*?"recovering-learning-state"[\s\S]*?"verifying-content"[\s\S]*?"resuming-session"/);
  assert.match(gate, /runtimeSelectors\.content\.unavailable\(\)/);
  assert.match(gate, /setState\(\{ kind: "loading", phase: "opening-storage" \}\)/);
  assert.match(presentation, /<EmptyState[\s\S]*?actionLabel=\{t\("Try again"\)\}[\s\S]*?onActionPress=/);
  assert.doesNotMatch(`${gate}\n${loadingState}`, /Variant|startupProgress|startupContent|Preparing your questions/);
  assert.doesNotMatch(`${gate}\n${loadingState}`, /setInterval|delay\s*:/);
});

test("startup wires the real owner and monotonic watchdog with conditional lease and timer epochs", () => {
  const gate = source("src/content/application/ContentPreparationGate.tsx");
  assert.match(gate, /lease === null \|\| isActiveProfileStorageLeaseCurrent\(lease\)/);
  assert.match(gate, /canAcceptLateSuccess: \(\) => lease !== null && isActiveProfileStorageLeaseCurrent\(lease\)/);
  assert.match(gate, /now: \(\) => performance\.now\(\)/);
  assert.match(gate, /subscribeBundledVerification\([\s\S]*?attachWorkPlan\(plan\)[\s\S]*?acceptVerifiedUnit\(proof\)[\s\S]*?await contentPackageRuntimeOwner\.verifyBundledPackages\(\)/);
  assert.match(gate, /epoch !== timerEpoch \|\| !isCurrent\(\)/);
  assert.match(gate, /publishOutcome\(attempt\.expireIfDue\(\)\)/);
  assert.match(gate, /attempt\.view\(\)\.deadline - performance\.now\(\)/);
  assert.match(gate, /unsubscribeVerification\(\);\s*publishOutcome\(outcome, nextState\)/);
  assert.match(gate, /attempt\.cancel\(\);\s*unsubscribeVerification\(\)/);
  assert.doesNotMatch(gate, /attempt\.timeout\(|Date\.now\(|setInterval/);
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
