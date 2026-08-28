import assert from "node:assert/strict";
import test from "node:test";

import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { ALGORITHM_MODE_IDS, selectAlgorithmSessionPlan } from "./";
import { getCodingPackageTestCatalog, prepareBundledTestPackages } from "../../testing/contentPackageRuntimeTestSupport";

test("the verified Coding Free package is the closed authority for its four approved modes", async () => {
  await prepareBundledTestPackages();
  const resolution = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving");
  assert.deepEqual(
    resolution.profile.modes.map((mode) => mode.modeId).sort(),
    [ALGORITHM_MODE_IDS.customPractice, ALGORITHM_MODE_IDS.guidedPractice, ALGORITHM_MODE_IDS.learnApproach, ALGORITHM_MODE_IDS.weakAreaReview].sort(),
  );
  assert.throws(() => resolution.profile.getMode(ALGORITHM_MODE_IDS.interviewSimulation), /unavailable in package/u);

  const catalog = getCodingPackageTestCatalog();
  const mentalUnitId = catalog.getItems()[0]!.taxonomy.primaryMentalUnitId;
  const reviewItemRefs = catalog.getItems().slice(0, 10).map((item) => catalog.toContentItemRef(item));
  const selections = [
    selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: ALGORITHM_MODE_IDS.learnApproach, sessionLength: 10, scope: { mentalUnitId } }),
    selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: ALGORITHM_MODE_IDS.guidedPractice, sessionLength: 10, scope: { mentalUnitId } }),
    selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: ALGORITHM_MODE_IDS.customPractice, sessionLength: 10, scope: { mentalUnitId } }),
    selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: ALGORITHM_MODE_IDS.weakAreaReview, sessionLength: 10, reviewSource: "session_misses", reviewItemRefs }),
  ];
  assert.deepEqual(selections.map((selection) => selection.actualLength), [10, 10, 10, 10]);
  assert.ok(selections.flatMap((selection) => selection.items).every((item) => resolution.profile.itemIds.includes(item.id)));
  assert.ok(reviewItemRefs.every((ref) => ref.packagePin.packageIdentity === resolution.package.packagePin.packageIdentity));
});
