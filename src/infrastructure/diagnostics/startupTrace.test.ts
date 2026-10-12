import test from "node:test";
import assert from "node:assert/strict";
import { beginStartupSpan, markStartup, readStartupTrace } from "./startupTrace";

function configure(dev: boolean, mode: string, flag: string) {
  Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: dev });
  process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE = mode;
  process.env.EXPO_PUBLIC_PATTERNLY_STARTUP_TRACE = flag;
}
const oldMode = process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE;
const oldFlag = process.env.EXPO_PUBLIC_PATTERNLY_STARTUP_TRACE;
const oldDev = Object.getOwnPropertyDescriptor(globalThis, "__DEV__");
test.after(() => {
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
  markStartup("artifact_hash", "begin");
  const snapshot = readStartupTrace()!;
  assert.deepEqual(snapshot, { schema: "patternly.startup-trace.v1", truncated: false, events: [{ stage: "artifact_hash", edge: "begin", atMs: 42 }] });
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

test("buffer stops at 512 and explicitly signals an incomplete trace", () => {
  configure(true, "smoke", "1");
  for (let index = 0; index < 600; index++) markStartup("content_gate");
  assert.equal(readStartupTrace()!.events.length, 512);
  assert.equal(readStartupTrace()!.truncated, true);
});
