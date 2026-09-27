import assert from "node:assert/strict";
import test from "node:test";

import { startAlgorithmsSession } from "./codingInterviewSessionFacade";
import {
  installForegroundSessionTimerFacade,
  installTrainingLifecycleUseCases,
  type TrainingLifecycleUseCases,
} from "../trainingLifecycle";
import type { ForegroundSessionTimerFacade } from "../trainingLifecycle/ForegroundSessionTimerFacade";

test("startAlgorithmsSession adapts feedback timing on the actual lifecycle request", async () => {
  const commands: Array<{ trackId: string; modeId: string; source?: string; request: unknown }> = [];
  const timerSessions: unknown[] = [];
  const prepared = { session: { id: "algorithms-adapter-test" } } as never;

  installTrainingLifecycleUseCases({
    async startSession(command: (typeof commands)[number]) {
      commands.push(command);
      return prepared;
    },
  } as unknown as TrainingLifecycleUseCases);
  installForegroundSessionTimerFacade({
    async initialize(session: unknown) { timerSessions.push(session); },
  } as unknown as ForegroundSessionTimerFacade);

  const common = { modeId: "coding-interview-learn-approach" as const, requestedLength: 10 as const, source: "adapter-test" };
  await startAlgorithmsSession({ ...common, feedbackMode: "afterEachAnswer" });
  await startAlgorithmsSession({ ...common, feedbackMode: "atSessionEnd" });
  await startAlgorithmsSession(common);

  assert.deepEqual(commands.map(({ request }) => request), [
    { modeId: common.modeId, requestedLength: 10, source: common.source, feedbackTiming: "after_each_durable_submit" },
    { modeId: common.modeId, requestedLength: 10, source: common.source, feedbackTiming: "after_session_completion" },
    { modeId: common.modeId, requestedLength: 10, source: common.source },
  ]);
  assert.equal(timerSessions.length, 3);
});
