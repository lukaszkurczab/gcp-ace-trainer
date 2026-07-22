import assert from "node:assert/strict";
import test from "node:test";

import { clearSimulationTrace, readSimulationTrace, recordSimulationTrace, simulationTraceIdentity } from "../src/application/algorithms/simulationTrace";

test("development simulation trace is append-only, typed, and never owns durable state", () => {
  clearSimulationTrace();
  const operationId = simulationTraceIdentity({ sessionId: "simulation-1", operationKind: "navigation", ordinal: 2, itemId: "item-2", revision: 1 });
  recordSimulationTrace({
    sessionId: "simulation-1", operationId, operationKind: "navigation", idempotencyKey: operationId,
    interactionType: "choice", itemId: "item-2", ordinalBefore: 1, ordinalAfter: 2,
    currentItemIdBefore: "item-1", currentItemIdAfter: "item-2", draftStatus: "saved", responseIdentity: "choice:a",
    journalRevisionBefore: 1, journalRevisionAfter: 2, aggregateRevisionBefore: 1, aggregateRevisionAfter: 2,
    projectionRevisionBefore: 1, projectionRevisionAfter: 2, timerRevision: 3, navigationRevision: 2,
    routeKey: "algorithms-interview-simulation", screenItemId: "item-2", selectorItemId: "item-2", result: "succeeded", typedError: null,
  });
  const [record] = readSimulationTrace();
  assert.equal(record?.sessionId, "simulation-1");
  assert.equal(record?.operationId, operationId);
  assert.equal(record?.ordinalAfter, 2);
  assert.equal(record?.selectorItemId, "item-2");
  assert.equal(record?.queueSequence, 1);
  assert.match(record?.timestamp ?? "", /^\d{4}-\d\d-\d\dT/);
});
