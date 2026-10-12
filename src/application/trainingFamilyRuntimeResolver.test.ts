import assert from "node:assert/strict";
import test from "node:test";
import type { TrainingCatalog, TrainingFamilyRuntime, TrainingInteractionPort } from "./trainingLifecycle";
import { createTrainingFamilyRuntimeResolver } from "./trainingFamilyRuntimeResolver";

const catalog = { trackId: "fixture-track" } as TrainingCatalog;
const interactions = {} as TrainingInteractionPort;
function runtime(familyId: string): TrainingFamilyRuntime {
  return { familyId } as TrainingFamilyRuntime;
}

test("family runtime resolver uses explicit registrations and rejects missing or mismatched owners", () => {
  let created = 0;
  const resolver = createTrainingFamilyRuntimeResolver([{ familyId: "fixture_family", create: (actual) => {
    assert.equal(actual, catalog);
    created += 1;
    return runtime("fixture_family");
  } }]);

  assert.equal(resolver.resolve(catalog, "fixture_family", interactions).familyId, "fixture_family");
  assert.equal(created, 1);
  assert.throws(() => resolver.resolve(catalog, "unregistered_family", interactions), /not registered/);
  const mismatched = createTrainingFamilyRuntimeResolver([{ familyId: "fixture_family", create: () => runtime("other_family") }]);
  assert.throws(() => mismatched.resolve(catalog, "fixture_family", interactions), /mismatched family/);
  assert.throws(() => createTrainingFamilyRuntimeResolver([
    { familyId: "fixture_family", create: () => runtime("fixture_family") },
    { familyId: "fixture_family", create: () => runtime("fixture_family") },
  ]), /more than once/);
});
