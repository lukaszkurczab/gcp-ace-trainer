import assert from "node:assert/strict";
import test from "node:test";
import { session } from "../../testing/journalTestSupport";
import { TrainingLifecycleUseCases } from "./TrainingLifecycleUseCases";
import { TrainingApplicationFailure, type TrainingLifecyclePorts } from "./contracts";

function fixture(options: { pending?: boolean; unreadable?: boolean; missingReader?: boolean; timer?: string; changeDuringRead?: boolean } = {}) {
  let active = { ...session(), activeForegroundMs: 10, configurationSnapshot: { timer: options.timer ?? "elapsedForeground" } };
  let writes = 0;
  const ports = {
    repositories: {
      getActiveSession: async () => active,
      ...(options.missingReader ? {} : { getPendingMutation: async () => {
        if (options.unreadable) throw Error("Journal read unavailable");
        if (options.changeDuringRead) active = { ...active, activeForegroundMs: 11 };
        return options.pending ? { operation: "advance_training_session" } : null;
      } }),
    },
    mutations: { advance: async (next: typeof active) => { writes++; active = next; } },
  } as unknown as TrainingLifecyclePorts;
  return { lifecycle: new TrainingLifecycleUseCases(ports), writes: () => writes };
}

test("an already durable foreground value skips the unchanged journal transaction", async () => {
  const f = fixture();
  assert.equal((await f.lifecycle.checkpointForegroundTime(10)).activeForegroundMs, 10);
  assert.equal(f.writes(), 0);
  assert.equal((await f.lifecycle.checkpointForegroundTime(11)).activeForegroundMs, 11);
  assert.equal(f.writes(), 1, "every changed value still commits and verifies");
});

test("pending or unobservable journal state cannot take the no-op shortcut", async () => {
  for (const options of [{ pending: true }, { missingReader: true }]) {
    const f = fixture(options); await f.lifecycle.checkpointForegroundTime(10); assert.equal(f.writes(), 1);
  }
  const f = fixture({ unreadable: true });
  await assert.rejects(f.lifecycle.checkpointForegroundTime(10), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "persistence_failure");
  assert.equal(f.writes(), 0);
});

test("a no-op checkpoint still rejects backward time, untimed modes and a changing session", async () => {
  for (const [options, value] of [[{}, 9], [{ timer: "none" }, 10]] as const) {
    const f = fixture(options);
    await assert.rejects(f.lifecycle.checkpointForegroundTime(value), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "invalid_response");
    assert.equal(f.writes(), 0);
  }
  const f = fixture({ changeDuringRead: true });
  await assert.rejects(f.lifecycle.checkpointForegroundTime(10), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "verification_failure");
  assert.equal(f.writes(), 0);
});
