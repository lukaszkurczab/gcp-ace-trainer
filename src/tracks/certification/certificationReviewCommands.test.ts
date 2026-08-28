import assert from "node:assert/strict";
import test from "node:test";

import { setQuestionNeedsReview } from "../../application/certification";
import { getReviewQueueItems } from "../../storage/repositories";
import { getCertificationPackageTestCatalog, prepareBundledTestPackages } from "../../testing/contentPackageRuntimeTestSupport";
import { installMemoryStorage } from "../../testing/journalTestSupport";

test("Certification manual review preserves the exact reviewed answer package pin and session identity", async () => {
  await prepareBundledTestPackages();
  installMemoryStorage();
  const catalog = getCertificationPackageTestCatalog();
  const question = catalog.getItems()[0];
  assert.ok(question);
  const sourceItem = catalog.toContentItemRef(question);

  await setQuestionNeedsReview({
    question,
    sourceAttemptId: "attempt-reviewed",
    sourceItem,
    sourceSessionId: "session-reviewed",
  }, true);

  const [review] = (await getReviewQueueItems()).value;
  assert.ok(review);
  assert.deepEqual(review.sourceItem, sourceItem);
  assert.equal(review.sourceAttemptId, "attempt-reviewed");
  assert.equal(review.sourceSessionId, "session-reviewed");
  assert.match(review.id, new RegExp(sourceItem.packagePin.packageIdentity));
});

test("Certification manual review rejects a future or mismatched answer pin without writing", async () => {
  await prepareBundledTestPackages();
  installMemoryStorage();
  const catalog = getCertificationPackageTestCatalog();
  const question = catalog.getItems()[0];
  assert.ok(question);
  const sourceItem = catalog.toContentItemRef(question);

  await assert.rejects(() => setQuestionNeedsReview({
    question,
    sourceItem: {
      ...sourceItem,
      packagePin: { ...sourceItem.packagePin, contentReleaseId: `${sourceItem.packagePin.contentReleaseId}-future` },
    },
    sourceSessionId: "session-future",
  }, true), /Package pin does not match|exact package pin|exact content package pin/u);
  await assert.rejects(() => setQuestionNeedsReview({
    question,
    sourceItem: { ...sourceItem, itemId: `${question.id}-mismatch` },
    sourceSessionId: "session-mismatch",
  }, true), /does not match the reviewed answer identity/u);
  assert.deepEqual((await getReviewQueueItems()).value, []);
});
