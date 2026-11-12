import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createAccountSyncScheduler, readAccountSyncActivity, registerAccountSyncScheduler, requestAccountSync, setAccountSyncActivity, type AccountSyncReason } from "./accountSyncSchedule";

function harness(options: Readonly<{ enabled?: boolean }> = {}) {
  const deferred: (() => void)[] = [];
  let cancelled = 0;
  const runs: AccountSyncReason[] = [];
  const pending: { resolve: () => void; reject: (error: unknown) => void }[] = [];
  const scheduler = createAccountSyncScheduler({
    enabled: () => options.enabled ?? true,
    defer: (task) => {
      deferred.push(task);
      return () => { cancelled += 1; const index = deferred.indexOf(task); if (index >= 0) deferred.splice(index, 1); };
    },
    run: (reason) => {
      runs.push(reason);
      return new Promise<void>((resolve, reject) => { pending.push({ resolve, reject }); });
    },
  });
  const flushIdle = () => { const tasks = deferred.splice(0); for (const task of tasks) task(); };
  const settle = async (index = 0, fail = false) => {
    const entry = pending[index]!;
    if (fail) entry.reject(new Error("offline")); else entry.resolve();
    await new Promise((resolve) => setImmediate(resolve));
  };
  return { scheduler, deferred, runs, flushIdle, settle, cancelledCount: () => cancelled };
}

test("T1.3 finalization defers one sync until idle and deduplicates repeated requests", () => {
  const h = harness();
  h.scheduler.schedule("session_finalized");
  h.scheduler.schedule("session_finalized");
  assert.equal(h.runs.length, 0, "nothing runs before the JS thread is idle");
  assert.equal(h.deferred.length, 1, "one deferred task for repeated requests");
  h.flushIdle();
  assert.deepEqual(h.runs, ["session_finalized"]);
});

test("T1.3 app background runs at once and replaces the deferred task", () => {
  const h = harness();
  h.scheduler.schedule("session_finalized");
  h.scheduler.schedule("app_background");
  assert.deepEqual(h.runs, ["app_background"]);
  assert.equal(h.cancelledCount(), 1);
  assert.equal(h.deferred.length, 0);
});

test("T1.3 a running sync absorbs background requests and queues one follow-up per finalization", async () => {
  const h = harness();
  h.scheduler.schedule("session_finalized");
  h.flushIdle();
  h.scheduler.schedule("app_background");
  h.scheduler.schedule("session_finalized");
  h.scheduler.schedule("session_finalized");
  assert.deepEqual(h.runs, ["session_finalized"], "no second attempt while one is running");
  await h.settle(0);
  assert.equal(h.deferred.length, 1, "exactly one follow-up after the running attempt");
  h.flushIdle();
  assert.deepEqual(h.runs, ["session_finalized", "session_finalized"]);
  await h.settle(1);
  assert.equal(h.deferred.length, 0, "no further follow-up");
});

test("T1.3 a failed attempt releases the scheduler", async () => {
  const h = harness();
  h.scheduler.schedule("app_background");
  await h.settle(0, true);
  h.scheduler.schedule("app_background");
  assert.deepEqual(h.runs, ["app_background", "app_background"]);
});

test("T1.3 kill-switch and dispose leave sync to the Today focus", () => {
  const off = harness({ enabled: false });
  off.scheduler.schedule("session_finalized");
  off.scheduler.schedule("app_background");
  assert.equal(off.deferred.length + off.runs.length, 0);

  const disposed = harness();
  disposed.scheduler.schedule("session_finalized");
  disposed.scheduler.dispose();
  disposed.flushIdle();
  disposed.scheduler.schedule("app_background");
  assert.deepEqual(disposed.runs, []);
});

test("T1.3 requestAccountSync reaches only the registered scheduler and never throws", () => {
  const seen: AccountSyncReason[] = [];
  requestAccountSync("session_finalized");
  const unregister = registerAccountSyncScheduler((reason) => { seen.push(reason); throw new Error("scheduler failure"); });
  assert.doesNotThrow(() => requestAccountSync("session_finalized"));
  unregister();
  requestAccountSync("app_background");
  assert.deepEqual(seen, ["session_finalized"]);
});

test("T1.3 sync activity store toggles the Today indicator state", () => {
  setAccountSyncActivity(true);
  assert.equal(readAccountSyncActivity(), true);
  setAccountSyncActivity(false);
  assert.equal(readAccountSyncActivity(), false);
});

test("T1.3 wiring: both practice finalization points request sync; provider registers it with the kill-switch", () => {
  const facade = readFileSync("src/application/coding-interview/codingInterviewSessionFacade.ts", "utf8");
  assert.equal(facade.match(/notifySessionFinalized\(\);/g)?.length, 2);
  assert.match(facade, /function notifySessionFinalized\(\): void \{\s*markStartup\("session_finalized"\);\s*requestAccountSync\("session_finalized"\);/);
  const provider = readFileSync("src/application/account/AccountSessionProvider.tsx", "utf8");
  assert.match(provider, /registerAccountSyncScheduler\(scheduler\.schedule\)/);
  assert.match(provider, /enabled: isSyncOnFinalizeEnabled/);
  assert.match(provider, /subscribeAppBackground\(\(\) => scheduler\.schedule\("app_background"\)\)/);
  const schedule = readFileSync("src/application/account/accountSyncSchedule.ts", "utf8");
  assert.match(schedule, /process\.env\.EXPO_PUBLIC_PATTERNLY_PERF_OPT_SYNC_ON_FINALIZE !== "0"/);
});
