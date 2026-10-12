import assert from "node:assert/strict";
import test from "node:test";
import { createActivityPresentationFixture, createReviewPresentationFixture, isListFixtureConfiguration } from "./perf06PresentationFixtures";
import { resolvePerf06Entry } from "./perf06Entry";
import { resolvePersist13Entry } from "../application/runtimeAuditability/persist13Entry";

test("list fixture entry is explicit local development smoke and cannot overlap persistence fixtures", () => {
  assert.deepEqual(resolvePerf06Entry(undefined, true, "smoke", "regular"), { kind: "regular" });
  assert.deepEqual(resolvePerf06Entry("lists", true, "smoke", "regular"), { kind: "fixture" });
  for (const [mode, development, runtime, persistence] of [
    ["lists", false, "smoke", "regular"], ["lists", true, "sandbox", "regular"], ["lists", true, "smoke", "fixture"], ["", true, "smoke", "regular"],
  ] as const) assert.deepEqual(resolvePerf06Entry(mode, development, runtime, persistence), { kind: "invalid" });
  for (const configuration of [{ runId: "orphan" }, { scenario: "journal" }, { mode: "" }, { scenario: "" }]) {
    assert.deepEqual(resolvePerf06Entry("lists", true, "smoke", resolvePersist13Entry(configuration).kind), { kind: "invalid" });
  }
});

test("presentation configurations reject unbounded sizes, unknown actions and open payloads", () => {
  for (const size of [50, 500, 1000]) assert.equal(isListFixtureConfiguration({ screen: "activity", size }), true);
  for (const screen of ["review-due", "review-upcoming"]) for (const size of [100, 500, 1000]) assert.equal(isListFixtureConfiguration({ screen, size }), true);
  for (const value of [null, { screen: { toString: () => "review-due" }, size: 100 }, { screen: "activity", size: "500" }, { screen: "activity", size: 10000 }, { screen: "review-due", size: 50 }, { screen: "reset", size: 500 }, { screen: "activity", size: 500, account: "unexpected" }]) assert.equal(isListFixtureConfiguration(value), false);
});

test("synthetic models preserve exact unique row counts and exercise all presentation groups", () => {
  for (const size of [50, 100, 500, 1000]) {
    const activity = createActivityPresentationFixture(size);
    assert.equal(activity.items.length, size);
    assert.equal(new Set(activity.items.map((item) => item.id)).size, size);
    assert.deepEqual(activity.groups.flatMap((group) => group.items), activity.items);
    assert.equal(activity.groups.length, 4);
    for (const upcoming of [false, true]) {
      const model = createReviewPresentationFixture(size, upcoming);
      const rows = [...model.dueRows, ...model.upcomingRows, ...model.unavailableRows];
      assert.equal(rows.length, size);
      assert.equal(new Set(rows.map((row) => row.id)).size, size);
      assert.equal(model.totalCount, size);
      assert.ok(model.unavailableRows.length > 0);
      assert.equal(upcoming ? model.dueRows.length : model.upcomingRows.length, 0);
    }
  }
});
