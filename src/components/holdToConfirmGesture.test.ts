import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

import {
  createHoldToConfirmController,
  HOLD_TO_CONFIRM_DURATION_MS,
  type HoldToConfirmFrameScheduler,
  type HoldToConfirmState,
} from "./holdToConfirmGesture";
import { colors } from "../theme/tokens";

type Harness = Readonly<{
  cancelCount: () => number;
  controller: ReturnType<typeof createHoldToConfirmController>;
  flushFrame: () => void;
  now: (value: number) => void;
  state: () => HoldToConfirmState;
}>;

function harness(onComplete: () => void = () => undefined): Harness {
  let currentTime = 0;
  let nextFrameId = 1;
  let pendingFrame: { callback: () => void; id: number } | null = null;
  let cancelCount = 0;
  let currentState: HoldToConfirmState = { elapsedMs: 0, phase: "idle", progress: 0 };
  const scheduler: HoldToConfirmFrameScheduler = {
    cancel: (id) => {
      if (pendingFrame?.id === id) pendingFrame = null;
      cancelCount += 1;
    },
    request: (callback) => {
      const id = nextFrameId++;
      pendingFrame = { callback, id };
      return id;
    },
  };
  const controller = createHoldToConfirmController({
    clock: { now: () => currentTime },
    onComplete,
    onStateChange: (next) => { currentState = next; },
    scheduler,
  });
  return {
    cancelCount: () => cancelCount,
    controller,
    flushFrame: () => {
      const frame = pendingFrame;
      pendingFrame = null;
      frame?.callback();
    },
    now: (value) => { currentTime = value; },
    state: () => currentState,
  };
}

function staleFrameHarness(onComplete: () => void = () => undefined) {
  let currentTime = 0;
  let nextFrameId = 1;
  let currentState: HoldToConfirmState = { elapsedMs: 0, phase: "idle", progress: 0 };
  const frames = new Map<number, () => void>();
  const controller = createHoldToConfirmController({
    clock: { now: () => currentTime },
    onComplete,
    onStateChange: (next) => { currentState = next; },
    scheduler: {
      cancel: () => undefined,
      request: (callback) => {
        const id = nextFrameId++;
        frames.set(id, callback);
        return id;
      },
    },
  });
  return {
    controller,
    flush: (id: number) => {
      const callback = frames.get(id);
      frames.delete(id);
      callback?.();
    },
    now: (value: number) => { currentTime = value; },
    state: () => currentState,
  };
}

function relativeLuminance(hexColor: string): number {
  const normalized = hexColor.slice(1);
  const channels = [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

test("a release at 2999ms cancels and never confirms", () => {
  let completions = 0;
  const testHarness = harness(() => { completions += 1; });
  testHarness.controller.grant();
  testHarness.now(2_999);

  assert.equal(testHarness.controller.release(), "cancelled");
  assert.equal(completions, 0);
  assert.deepEqual(testHarness.state(), { elapsedMs: 0, phase: "idle", progress: 0 });
});

test("a release at exactly 3000ms confirms once", () => {
  let completions = 0;
  const testHarness = harness(() => { completions += 1; });
  testHarness.controller.grant();
  testHarness.now(HOLD_TO_CONFIRM_DURATION_MS);

  assert.equal(testHarness.controller.release(), "committed");
  assert.equal(completions, 1);
  assert.equal(testHarness.controller.release(), "idle");
  assert.equal(completions, 1);
});

test("one controller instance survives setup cleanup setup and can confirm after reactivation", () => {
  let completions = 0;
  const testHarness = harness(() => { completions += 1; });
  const controller = testHarness.controller;

  controller.activate();
  controller.deactivate();
  controller.activate();
  testHarness.controller.grant();
  testHarness.now(HOLD_TO_CONFIRM_DURATION_MS);

  assert.equal(testHarness.controller, controller);
  assert.equal(controller.release(), "committed");
  assert.equal(completions, 1);
});

test("a stale RAF from a deactivated setup cannot update the reactivated gesture", () => {
  const testHarness = staleFrameHarness();
  testHarness.controller.grant();
  testHarness.controller.deactivate();
  testHarness.controller.activate();
  testHarness.now(0);
  testHarness.controller.grant();
  testHarness.now(1_000);

  testHarness.flush(1);
  assert.deepEqual(testHarness.state(), { elapsedMs: 0, phase: "holding", progress: 0 });
  testHarness.flush(2);
  assert.deepEqual(testHarness.state(), { elapsedMs: 1_000, phase: "holding", progress: 1_000 / HOLD_TO_CONFIRM_DURATION_MS });
});

test("the controller cannot be configured with a threshold below 3000ms", () => {
  let completions = 0;
  let currentTime = 0;
  const controller = createHoldToConfirmController({
    clock: { now: () => currentTime },
    durationMs: 1,
    onComplete: () => { completions += 1; },
    onStateChange: () => undefined,
  });
  controller.grant();
  currentTime = 2_999;
  assert.equal(controller.release(), "cancelled");
  currentTime = 0;
  controller.grant();
  currentTime = 3_000;
  assert.equal(controller.release(), "committed");
  assert.equal(completions, 1);
});

test("time passing and RAF readiness never confirm before release", () => {
  let completions = 0;
  const testHarness = harness(() => { completions += 1; });
  testHarness.controller.grant();
  testHarness.now(HOLD_TO_CONFIRM_DURATION_MS);
  testHarness.flushFrame();

  assert.equal(testHarness.state().phase, "ready");
  assert.equal(testHarness.state().progress, 1);
  assert.equal(completions, 0);
  assert.equal(testHarness.controller.release(), "committed");
  assert.equal(completions, 1);
});

test("a backward clock reading cancels the gesture fail-closed", () => {
  const testHarness = harness();
  testHarness.now(1_000);
  testHarness.controller.grant();
  testHarness.now(999);
  testHarness.flushFrame();

  assert.deepEqual(testHarness.state(), { elapsedMs: 0, phase: "idle", progress: 0 });
  assert.equal(testHarness.controller.release(), "idle");
});

test("a non-finite clock reading cancels the gesture fail-closed", () => {
  for (const invalidTime of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    const testHarness = harness();
    testHarness.controller.grant();
    testHarness.now(invalidTime);
    testHarness.flushFrame();

    assert.deepEqual(testHarness.state(), { elapsedMs: 0, phase: "idle", progress: 0 }, String(invalidTime));
    assert.equal(testHarness.controller.release(), "idle", String(invalidTime));
  }
});

test("repeated releases cannot duplicate a completed gesture", () => {
  let completions = 0;
  const testHarness = harness(() => { completions += 1; });
  testHarness.controller.grant();
  testHarness.now(3_000);

  assert.equal(testHarness.controller.release(), "committed");
  assert.equal(testHarness.controller.release(), "idle");
  assert.equal(completions, 1);
});

test("moving outside the measured bounds cancels the gesture", () => {
  let completions = 0;
  const testHarness = harness(() => { completions += 1; });
  testHarness.controller.grant();
  testHarness.now(3_000);
  testHarness.controller.move(false);

  assert.equal(testHarness.state().phase, "idle");
  assert.equal(testHarness.controller.release(), "idle");
  assert.equal(completions, 0);
});

test("background termination and disabled changes cancel without confirming", () => {
  let completions = 0;
  const backgroundHarness = harness(() => { completions += 1; });
  backgroundHarness.controller.grant();
  backgroundHarness.controller.terminate();
  backgroundHarness.now(3_000);
  assert.equal(backgroundHarness.controller.release(), "idle");

  const disabledHarness = harness(() => { completions += 1; });
  disabledHarness.controller.grant();
  disabledHarness.controller.setEnabled(false);
  disabledHarness.now(3_000);
  assert.equal(disabledHarness.controller.release(), "idle");
  assert.equal(completions, 0);
});

test("disabling immediately before release rejects the current gesture", () => {
  let completions = 0;
  const testHarness = harness(() => { completions += 1; });
  testHarness.controller.grant();
  testHarness.now(HOLD_TO_CONFIRM_DURATION_MS);
  testHarness.controller.setEnabled(false);

  assert.equal(testHarness.controller.release(), "idle");
  assert.equal(completions, 0);
});

test("release is rejected while the controller is inactive", () => {
  let completions = 0;
  const testHarness = harness(() => { completions += 1; });
  testHarness.controller.grant();
  testHarness.controller.deactivate();
  testHarness.now(HOLD_TO_CONFIRM_DURATION_MS);

  assert.equal(testHarness.controller.release(), "idle");
  assert.equal(completions, 0);
});

test("destroying the controller cancels a held gesture and ignores later input", () => {
  let completions = 0;
  const testHarness = harness(() => { completions += 1; });
  testHarness.controller.grant();
  testHarness.controller.destroy();
  testHarness.now(3_000);
  testHarness.controller.grant();
  assert.equal(testHarness.controller.release(), "idle");
  assert.equal(completions, 0);
});

test("a new gesture starts from zero after an early release and progress is clamped", () => {
  let completions = 0;
  const testHarness = harness(() => { completions += 1; });
  testHarness.controller.grant();
  testHarness.now(1_000);
  assert.equal(testHarness.controller.release(), "cancelled");
  assert.deepEqual(testHarness.state(), { elapsedMs: 0, phase: "idle", progress: 0 });

  testHarness.now(2_000);
  testHarness.controller.grant();
  testHarness.now(100_000);
  testHarness.flushFrame();
  assert.equal(testHarness.state().progress, 1);
  assert.equal(testHarness.controller.release(), "committed");
  assert.equal(completions, 1);
});

test("reset cancels a scheduled RAF and does not invoke the completion callback", () => {
  const testHarness = harness();
  testHarness.controller.grant();
  const cancelCountBeforeReset = testHarness.cancelCount();

  testHarness.controller.reset();

  assert.equal(testHarness.cancelCount(), cancelCountBeforeReset + 1);
  assert.equal(testHarness.state().phase, "idle");
});

test("the component wires native responder cancellation, visual progress, and translated hint props", () => {
  const source = readFileSync("src/components/HoldToConfirmButton.tsx", "utf8");
  const exports = readFileSync("src/components/index.ts", "utf8");

  assert.match(source, /onResponderGrant=/u);
  assert.match(source, /onResponderMove=/u);
  assert.match(source, /onResponderRelease=\{\(event\) => handleRelease\(event\.nativeEvent\.locationX, event\.nativeEvent\.locationY\)\}/u);
  assert.match(source, /isInsideMeasuredBounds\(locationX, locationY\)/u);
  assert.match(source, /if \(!isInsideMeasuredBounds\(locationX, locationY\)\) controller\.move\(false\)/u);
  assert.match(source, /onResponderTerminate=/u);
  assert.match(source, /controller\.terminate\(\)/u);
  assert.match(source, /useLayoutEffect/u);
  assert.match(source, /controller\.activate\(\)/u);
  assert.match(source, /controller\.deactivate\(\)/u);
  assert.match(source, /isInteractiveRef/u);
  assert.match(source, /accessibilityHint=\{hint\}/u);
  assert.match(source, /testID=\{hintTestID\}/u);
  assert.match(source, /testID=\{readyTestID\}/u);
  assert.match(source, /width: `\$\{percent\}%`/u);
  assert.match(source, /onMoveShouldSetResponder=\{\(\) => false\}/u);
  assert.match(source, /progressArea/u);
  assert.match(source, /progressFill:\s*\{[\s\S]*backgroundColor: palette\.onDanger[\s\S]*opacity: 1/u);
  assert.match(source, /progressTrack:\s*\{[\s\S]*backgroundColor: palette\.danger/u);
  assert.match(source, /requestAnimationFrame/u);
  assert.match(source, /cancelAnimationFrame/u);
  assert.doesNotMatch(source, /Date\.now\(\)/u);
  assert.doesNotMatch(source, /onPress=/u);
  assert.doesNotMatch(source, /onAccessibilityTap=/u);
  assert.match(exports, /export \* from "\.\/HoldToConfirmButton";/u);
});

test("destructive text and progress colors meet their composite contrast thresholds", () => {
  const source = readFileSync("src/components/HoldToConfirmButton.tsx", "utf8");
  assert.match(source, /progressFill:\s*\{[\s\S]*backgroundColor: palette\.onDanger[\s\S]*opacity: 1/u);
  assert.match(source, /progressTrack:\s*\{[\s\S]*backgroundColor: palette\.danger/u);

  for (const theme of [colors.light, colors.dark]) {
    const ratio = contrastRatio(theme.onDanger, theme.danger);
    assert.ok(ratio >= 4.5, `text contrast ${ratio} is below 4.5`);
    assert.ok(ratio >= 3, `progress contrast ${ratio} is below 3`);
  }
});
