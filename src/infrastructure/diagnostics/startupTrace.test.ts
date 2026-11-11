import test from "node:test";
import assert from "node:assert/strict";
import { beginStartupSpan, JS_LOOP_PROBE_IDLE_MS, markInteractive, markStartup, markVisible, readStartupTrace } from "./startupTrace";

function configure(dev: boolean, mode: string, flag: string) {
  Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: dev });
  process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = mode;
  process.env.EXPO_PUBLIC_PATTERNLY_STARTUP_TRACE = flag;
}
const oldPerf = process.env.EXPO_PUBLIC_PATTERNLY_PERF_BUILD;
const oldMode = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
const oldFlag = process.env.EXPO_PUBLIC_PATTERNLY_STARTUP_TRACE;
const oldDev = Object.getOwnPropertyDescriptor(globalThis, "__DEV__");
test.after(() => {
  if (oldPerf === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_PERF_BUILD; else process.env.EXPO_PUBLIC_PATTERNLY_PERF_BUILD = oldPerf;
  if (oldMode === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE; else process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = oldMode;
  if (oldFlag === undefined) delete process.env.EXPO_PUBLIC_PATTERNLY_STARTUP_TRACE; else process.env.EXPO_PUBLIC_PATTERNLY_STARTUP_TRACE = oldFlag;
  if (oldDev) Object.defineProperty(globalThis, "__DEV__", oldDev); else Reflect.deleteProperty(globalThis, "__DEV__");
});

test("trace requires all three explicit development/smoke/measurement gates", () => {
  for (const [dev, mode, flag] of [[false, "smoke", "1"], [true, "release", "1"], [true, "sandbox", "1"], [true, "smoke", "0"]] as const) {
    configure(dev, mode, flag);
    markStartup("blocking");
    assert.equal(readStartupTrace(), null);
  }
  configure(true, "smoke", "1");
  assert.equal(readStartupTrace()?.events.length, 0);
});

test("trace snapshots contain only immutable numeric timing and static stages", (t) => {
  configure(true, "smoke", "1");
  t.mock.method(globalThis.performance, "now", () => 42);
  t.mock.method(Date, "now", () => 1_700_000_000_000);
  markStartup("artifact_hash", "begin");
  const snapshot = readStartupTrace()!;
  assert.deepEqual(snapshot, { schema: "patternly.startup-trace.v1", truncated: false, events: [{ stage: "artifact_hash", edge: "begin", atMs: 42, epochMs: 1_700_000_000_000 }] });
  assert.ok(Object.isFrozen(snapshot.events[0]));
  assert.ok(Object.isFrozen(snapshot.events));
  markStartup("artifact_hash", "end");
  assert.equal(snapshot.events.length, 1);
});

test("clock failure and invalid timing do not affect startup or emit false measurements", (t) => {
  configure(true, "smoke", "1");
  const before = readStartupTrace()!.events.length;
  const clock = t.mock.method(globalThis.performance, "now", () => Number.NaN);
  assert.doesNotThrow(() => markStartup("ready"));
  clock.mock.mockImplementation(() => { throw new Error("clock unavailable"); });
  assert.doesNotThrow(() => markStartup("ready"));
  assert.equal(readStartupTrace()!.events.length, before);
});

test("overlapping attempts have numeric correlation and close exactly once", () => {
  configure(true, "smoke", "1");
  const before = readStartupTrace()!.events.length;
  const first = beginStartupSpan("content_gate");
  const second = beginStartupSpan("content_gate");
  first(); second(); first();
  const emitted = readStartupTrace()!.events.slice(before);
  assert.equal(emitted.length, 4);
  assert.equal(emitted[0]!.span, emitted[2]!.span);
  assert.equal(emitted[1]!.span, emitted[3]!.span);
  assert.notEqual(emitted[0]!.span, emitted[1]!.span);
});

test("disabled spans leave no events when tracing is subsequently enabled", () => {
  configure(true, "release", "1");
  const end = beginStartupSpan("content_gate");
  configure(true, "smoke", "1");
  const before = readStartupTrace()!.events.length;
  end();
  assert.equal(readStartupTrace()!.events.length, before);
});

test("the Release perf build enables the trace without development or the trace flag", () => {
  configure(false, "smoke", "0");
  process.env.EXPO_PUBLIC_PATTERNLY_PERF_BUILD = "1";
  try {
    assert.notEqual(readStartupTrace(), null);
    configure(false, "release", "0");
    assert.equal(readStartupTrace(), null);
  } finally { delete process.env.EXPO_PUBLIC_PATTERNLY_PERF_BUILD; }
  configure(false, "smoke", "1");
  assert.equal(readStartupTrace(), null);
});

test("markVisible marks after a double animation frame", (t) => {
  configure(true, "smoke", "1");
  const frames: Array<() => void> = [];
  const raf = (callback: () => void) => { frames.push(callback); return frames.length; };
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "requestAnimationFrame");
  Object.defineProperty(globalThis, "requestAnimationFrame", { configurable: true, value: raf });
  t.after(() => { if (descriptor) Object.defineProperty(globalThis, "requestAnimationFrame", descriptor); else Reflect.deleteProperty(globalThis, "requestAnimationFrame"); });
  const before = readStartupTrace()!.events.length;
  markVisible("option_visible");
  frames.shift()!();
  assert.equal(readStartupTrace()!.events.length, before);
  frames.shift()!();
  assert.deepEqual(readStartupTrace()!.events.slice(before).map((event) => event.stage), ["option_visible"]);
});

test("markInteractive marks at the first loop probe that returns under the idle threshold", (t) => {
  configure(true, "smoke", "1");
  let now = 0;
  t.mock.method(globalThis.performance, "now", () => now);
  const pending: Array<() => void> = [];
  const before = readStartupTrace()!.events.length;
  markInteractive("today_interactive", (callback) => { pending.push(callback); });
  now += JS_LOOP_PROBE_IDLE_MS + 10;
  pending.shift()!();
  assert.equal(readStartupTrace()!.events.length, before);
  now += 3;
  pending.shift()!();
  const emitted = readStartupTrace()!.events.slice(before);
  assert.deepEqual(emitted.map((event) => [event.stage, event.atMs]), [["today_interactive", JS_LOOP_PROBE_IDLE_MS + 13]]);
  assert.equal(pending.length, 0);
});

test("buffer stops at 512 and explicitly signals an incomplete trace", () => {
  configure(true, "smoke", "1");
  for (let index = 0; index < 600; index++) markStartup("content_gate");
  assert.equal(readStartupTrace()!.events.length, 512);
  assert.equal(readStartupTrace()!.truncated, true);
});
