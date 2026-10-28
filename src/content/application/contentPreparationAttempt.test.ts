import assert from "node:assert/strict";
import test from "node:test";
import { createContentPreparationAttempt } from "./contentPreparationAttempt";
import { createCanonicalRuntimeCatalogOwner, type VerificationWorkPlan } from "../canonical/runtimeCatalog";
import aws from "../generated/canonical-content/aws-certified-solutions-architect-associate.json";
import backend from "../generated/canonical-content/backend-system-design-interview.json";
import coding from "../generated/canonical-content/coding-interview-dsa-problem-solving.json";
import lockFile from "../generated/canonical-content/content-lock.json";

const workPlan = (current = 2, retained = 0): VerificationWorkPlan => Object.freeze({
  build: Object.freeze({}), units: Object.freeze([
    ...Array.from({ length: current }, (_, i) => Object.freeze({ id: `current:${i}`, kind: "current_artifact" as const })),
    ...Array.from({ length: retained }, (_, i) => Object.freeze({ id: `retained:${i}`, kind: "retained_pair" as const })),
  ]),
});
function setup(late = true) {
  let time = 0, current = true;
  const attempt = createContentPreparationAttempt({ isCurrent: () => current, canAcceptLateSuccess: () => late, now: () => time, stallMs: 15_000 });
  return { attempt, at: (value: number) => { time = value; }, revoke: () => { current = false; } };
}

test("no proof expires at the monotonic boundary and publishes timeout only once", () => {
  const { attempt, at } = setup();
  at(14_999); assert.equal(attempt.expireIfDue().publication, "none");
  at(15_000); assert.equal(attempt.expireIfDue().publication, "timeout");
  assert.equal(attempt.pending(), false);
  assert.equal(attempt.expireIfDue().publication, "none");
  assert.equal(attempt.complete(false).publication, "none");
  assert.equal(attempt.complete(true).publication, "whole_result");
  assert.equal(attempt.complete(true).publication, "none");
});

test("unique verified work renews beyond total 15s; whole completion alone establishes success", () => {
  const { attempt, at } = setup(); const plan = workPlan();
  assert.equal(attempt.attachWorkPlan(plan).accepted, true);
  for (const [time, unit] of [[10_000, 0], [20_000, 1]] as const) {
    at(time);
    const result = attempt.acceptVerifiedUnit({ build: plan.build, unitId: plan.units[unit]!.id });
    assert.equal(result.publication, "none"); assert.equal(result.accepted, true);
    assert.equal(result.deadline, time + 15_000);
  }
  at(30_000); assert.equal(attempt.pending(), true);
  assert.equal(attempt.complete(true).publication, "whole_result");
});

test("the default canonical owner’s 13 verified units renew a real preparation attempt", async () => {
  const owner = createCanonicalRuntimeCatalogOwner();
  let time = 0;
  const attempt = createContentPreparationAttempt({
    isCurrent: () => true,
    canAcceptLateSuccess: () => true,
    now: () => time,
    stallMs: 15_000,
  });
  let planUnits = 0;
  let planAccepted = false;
  let acceptedProofs = 0;
  const proofOutcomes: ReturnType<typeof attempt.acceptVerifiedUnit>[] = [];
  let completion: ReturnType<typeof attempt.complete> | undefined;
  owner.subscribeVerification({
    onWorkPlan(plan) {
      planUnits = plan.units.length;
      assert.equal(plan.units.filter((unit) => unit.kind === "current_artifact").length, 9);
      assert.equal(plan.units.filter((unit) => unit.kind === "retained_pair").length, 4);
      planAccepted = attempt.attachWorkPlan(plan).accepted;
    },
    onVerifiedUnit(proof) {
      time += 14_000;
      const outcome = attempt.acceptVerifiedUnit(proof);
      proofOutcomes.push(outcome);
      if (outcome.accepted) acceptedProofs++;
    },
  });

  const catalog = await owner.load();
  assert.equal(catalog.tracks.length, 9);
  assert.equal(planUnits, 13);
  assert.equal(planAccepted, true, "the actual owner plan must fit the watchdog’s finite bound");
  assert.equal(acceptedProofs, 13);
  assert.ok(proofOutcomes.every((outcome) => outcome.publication === "none"), "progress cannot publish the whole result");
  assert.ok(attempt.view().deadline <= 210_000);
  completion = attempt.complete(true);
  assert.equal(completion.publication, "whole_result", "only successful owner completion can publish readiness");
});

test("the last proof has only a 15s tail, including an already queued early timer", () => {
  const { attempt, at } = setup(); const plan = workPlan(); attempt.attachWorkPlan(plan);
  at(10_000); attempt.acceptVerifiedUnit({ build: plan.build, unitId: plan.units[0]!.id });
  at(15_000); assert.equal(attempt.expireIfDue().publication, "none");
  at(24_999); assert.equal(attempt.expireIfDue().publication, "none");
  at(25_000); assert.equal(attempt.expireIfDue().publication, "timeout");
});

test("a plan itself, duplicates, foreign builds and undeclared IDs cannot renew", () => {
  const { attempt, at } = setup(); const plan = workPlan();
  at(5_000); attempt.attachWorkPlan(plan); assert.equal(attempt.view().deadline, 15_000);
  at(10_000); attempt.acceptVerifiedUnit({ build: plan.build, unitId: plan.units[0]!.id });
  at(20_000);
  for (const result of [attempt.attachWorkPlan(plan), attempt.attachWorkPlan(workPlan(9, 3)),
    attempt.acceptVerifiedUnit({ build: plan.build, unitId: plan.units[0]!.id }),
    attempt.acceptVerifiedUnit({ build: {}, unitId: plan.units[1]!.id }),
    attempt.acceptVerifiedUnit({ build: plan.build, unitId: "foreign" })]) {
    assert.equal(result.accepted, false); assert.equal(result.deadline, 25_000);
  }
});

test("late progress cannot rescue expiry even if no timer callback ran", () => {
  for (const time of [15_000, 20_000]) {
    const { attempt, at } = setup(); const plan = workPlan(); attempt.attachWorkPlan(plan); at(time);
    const first = attempt.acceptVerifiedUnit({ build: plan.build, unitId: plan.units[0]!.id });
    assert.equal(first.accepted, false); assert.equal(first.publication, "timeout");
    assert.equal(first.deadline, 15_000);
    assert.equal(attempt.acceptVerifiedUnit({ build: plan.build, unitId: plan.units[1]!.id }).publication, "none");
    assert.equal(attempt.attachWorkPlan(workPlan()).publication, "none");
    assert.equal(attempt.expireIfDue().publication, "none");
  }
});

test("a late plan also reports first expiry without becoming progress", () => {
  const { attempt, at } = setup(); at(15_000);
  const result = attempt.attachWorkPlan(workPlan());
  assert.equal(result.accepted, false); assert.equal(result.publication, "timeout");
});

test("13 declared units bound renewal; completed count never creates ready", () => {
  const { attempt, at } = setup(); const plan = workPlan(9, 4); attempt.attachWorkPlan(plan);
  let time = 0;
  for (const unit of plan.units) {
    time += 14_999; at(time);
    assert.equal(attempt.acceptVerifiedUnit({ build: plan.build, unitId: unit.id }).accepted, true);
  }
  assert.equal(attempt.pending(), true);
  assert.ok(attempt.view().deadline <= 210_000);
  at(attempt.view().deadline);
  assert.equal(attempt.expireIfDue().publication, "timeout");
});

test("invalid or oversized plans cannot allocate a renewal budget", () => {
  const malformedKind = { ...workPlan(), units: [...workPlan().units, { id: "unexpected", kind: "other" }] } as unknown as VerificationWorkPlan;
  for (const plan of [workPlan(10), workPlan(0, 5), malformedKind,
    { ...workPlan(), units: [{ id: "x", kind: "current_artifact" as const }, { id: "x", kind: "retained_pair" as const }] }]) {
    const { attempt } = setup(); assert.equal(attempt.attachWorkPlan(plan).accepted, false);
  }
});

test("a real owner validation failure after partial proofs cannot complete preparation successfully", async () => {
  const malformed = structuredClone(coding) as { schemaVersion: string };
  malformed.schemaVersion = "invalid";
  const owner = createCanonicalRuntimeCatalogOwner({
    artifacts: [aws, backend, malformed],
    locks: lockFile.tracks,
  });
  let time = 0;
  const attempt = createContentPreparationAttempt({ isCurrent: () => true, canAcceptLateSuccess: () => true, now: () => time, stallMs: 15_000 });
  let planAccepted = false;
  let acceptedProofs = 0;
  let readinessCompleted = false;
  owner.subscribeVerification({
    onWorkPlan(plan) { planAccepted = attempt.attachWorkPlan(plan).accepted; },
    onVerifiedUnit(proof) {
      time += 1_000;
      if (attempt.acceptVerifiedUnit(proof).accepted) acceptedProofs++;
    },
  });

  try {
    await owner.load();
    readinessCompleted = attempt.complete(true).publication === "whole_result";
  } catch {
    attempt.complete(false);
  }
  assert.equal(planAccepted, true);
  assert.equal(acceptedProofs, 2, "the valid artifacts emit real proofs before the third artifact fails validation");
  assert.equal(readinessCompleted, false, "a validation error cannot publish readiness");
  assert.equal(attempt.pending(), false, "the real failure is terminal for the attempt");
});

test("timer-delayed whole failure or null-lease late success still publishes timeout once", () => {
  for (const successful of [false, true]) {
    const { attempt, at } = setup(false); at(20_000);
    const result = attempt.complete(successful);
    assert.equal(result.accepted, false); assert.equal(result.publication, "timeout");
    assert.equal(attempt.expireIfDue().publication, "none");
    assert.equal(attempt.complete(successful).publication, "none");
  }
});

test("timer-delayed valid late WHOLE success has READY priority, never a later timeout", () => {
  const { attempt, at } = setup(); at(20_000);
  assert.equal(attempt.complete(true).publication, "whole_result");
  assert.equal(attempt.expireIfDue().publication, "none");
  assert.equal(attempt.pending(), false);
});

test("ordinary success and failure are terminal without requiring a late-success lease", () => {
  for (const successful of [true, false]) {
    const { attempt } = setup(false);
    assert.equal(attempt.complete(successful).publication, "whole_result");
    assert.equal(attempt.complete(true).publication, "none");
    assert.equal(attempt.expireIfDue().publication, "none");
  }
});

test("late completion cannot cross retry, handoff, profile or unmount boundaries", () => {
  for (const boundary of ["retry", "handoff", "profile", "unmount"] as const) {
    const { attempt, at, revoke } = setup(); at(15_000); attempt.expireIfDue();
    if (boundary === "unmount") attempt.cancel(); else revoke();
    assert.equal(attempt.complete(true).publication, "none", boundary);
  }
});

test("a revoked nonnull lease fences renewed running progress and whole completion before cleanup", () => {
  const { attempt, at, revoke } = setup(); const plan = workPlan(); attempt.attachWorkPlan(plan);
  at(14_000); attempt.acceptVerifiedUnit({ build: plan.build, unitId: plan.units[0]!.id });
  at(25_000); revoke();
  assert.equal(attempt.pending(), false);
  assert.equal(attempt.acceptVerifiedUnit({ build: plan.build, unitId: plan.units[1]!.id }).publication, "none");
  assert.equal(attempt.view().deadline, 29_000);
  assert.equal(attempt.complete(true).publication, "none");
  at(40_000); assert.equal(attempt.expireIfDue().publication, "none");
});

test("cancelled old attempt cannot consume a retry's cached proof replay", () => {
  const first = setup(); const second = setup(); const plan = workPlan();
  first.attempt.attachWorkPlan(plan); first.attempt.cancel();
  second.attempt.attachWorkPlan(plan); second.at(10_000);
  const proof = { build: plan.build, unitId: plan.units[0]!.id };
  assert.equal(first.attempt.acceptVerifiedUnit(proof).accepted, false);
  assert.equal(second.attempt.acceptVerifiedUnit(proof).accepted, true);
  assert.equal(second.attempt.acceptVerifiedUnit(proof).accepted, false);
});
