import assert from "node:assert/strict";
import test from "node:test";
import { createLaunchId, createStartupTraceSink, MAX_PENDING_TRACE_LINES, type StartupTraceSinkPorts } from "./startupTraceSink";

function harness(append: StartupTraceSinkPorts["append"] = () => undefined) {
  const scheduled: Array<() => void> = [];
  let background: (() => void) | null = null;
  const written: string[] = [];
  const sink = createStartupTraceSink({
    append: (text) => { append(text); written.push(text); },
    schedule: (flush) => { scheduled.push(flush); },
    onBackground: (flush) => { background = flush; },
  });
  return { sink, scheduled, written, background: () => background?.() };
}
const event = (stage: string, epochMs = 1_000, span?: number) => ({ stage, edge: "event" as const, atMs: 5, epochMs, ...(span === undefined ? {} : { span }) });

test("events are batched into one JSONL append per scheduled flush", () => {
  const { sink, scheduled, written } = harness();
  sink.push(event("regular_root_module"));
  sink.push({ stage: "content_gate", edge: "begin", atMs: 6, epochMs: 1_001, span: 3 });
  assert.equal(scheduled.length, 1);
  assert.equal(written.length, 0);
  scheduled[0]!();
  assert.equal(written.length, 1);
  assert.deepEqual(written[0]!.trimEnd().split("\n").map((line) => JSON.parse(line)), [
    { stage: "regular_root_module", edge: "event", atMs: 5, epochMs: 1_000 },
    { stage: "content_gate", edge: "begin", atMs: 6, epochMs: 1_001, span: 3 },
  ]);
  sink.push(event("home_data_commit"));
  assert.equal(scheduled.length, 2);
});

test("going to the background flushes pending events immediately", () => {
  const { sink, written, background } = harness();
  sink.push(event("account:complete"));
  background();
  assert.equal(written.length, 1);
  background();
  assert.equal(written.length, 1);
});

test("write failures are ignored and do not block later batches", () => {
  let fail = true;
  const { sink, scheduled, written } = harness(() => { if (fail) throw new Error("disk unavailable"); });
  sink.push(event("ready"));
  assert.doesNotThrow(() => scheduled[0]!());
  fail = false;
  sink.push(event("home_data_commit"));
  scheduled[1]!();
  assert.equal(written.length, 1);
  assert.match(written[0]!, /home_data_commit/);
});

test("pending lines are bounded while no flush runs", () => {
  const { sink, scheduled, written } = harness();
  for (let index = 0; index < MAX_PENDING_TRACE_LINES + 10; index++) sink.push(event("content_gate"));
  scheduled[0]!();
  assert.equal(written[0]!.trimEnd().split("\n").length, MAX_PENDING_TRACE_LINES);
});

test("launch ids sort by launch time and are safe file names", () => {
  assert.equal(createLaunchId(1_700_000_000_000, () => 0.5), "1700000000000-800000");
  assert.match(createLaunchId(), /^\d{13}-[0-9a-f]{6}$/u);
});
