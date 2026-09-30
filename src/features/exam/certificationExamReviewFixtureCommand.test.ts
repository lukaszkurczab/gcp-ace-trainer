import assert from "node:assert/strict";
import test from "node:test";

import { CERTIFICATION_EXAM_REVIEW_FIXTURE_CASES, CERTIFICATION_EXAM_REVIEW_FIXTURE_URL, nextCertificationExamReviewFixtureLaunch, parseCertificationExamReviewFixtureUrl } from "./certificationExamReviewFixtureCommand";

const ready = `${CERTIFICATION_EXAM_REVIEW_FIXTURE_URL}?case=exam-ready`;

test("review fixture accepts only named development smoke cases and exact deep links", () => {
  assert.deepEqual(CERTIFICATION_EXAM_REVIEW_FIXTURE_CASES, ["exam-ready", "source-failure", "practice-answer-matrix"]);
  assert.equal(parseCertificationExamReviewFixtureUrl(ready, true), "exam-ready");
  assert.equal(parseCertificationExamReviewFixtureUrl(`${CERTIFICATION_EXAM_REVIEW_FIXTURE_URL}?case=source-failure`, true), "source-failure");
  assert.equal(parseCertificationExamReviewFixtureUrl(`${CERTIFICATION_EXAM_REVIEW_FIXTURE_URL}?case=practice-answer-matrix`, true), "practice-answer-matrix");
  for (const url of [null, "", `${CERTIFICATION_EXAM_REVIEW_FIXTURE_URL}?case=unknown`, `${ready}&case=source-failure`, `${ready}&extra=1`, `${ready}#fragment`, ready.replace("//audit/", "/audit/"), ready.replace("com.lkurczab.patternly", "https://user:pass@com.lkurczab.patternly")]) {
    assert.equal(parseCertificationExamReviewFixtureUrl(url, true), null, String(url));
  }
  assert.equal(parseCertificationExamReviewFixtureUrl(ready, false), null);
});

test("reopening the same fixture case creates a fresh launch identity", () => {
  const scenario = parseCertificationExamReviewFixtureUrl(ready, true)!;
  const first = nextCertificationExamReviewFixtureLaunch(null, scenario);
  const second = nextCertificationExamReviewFixtureLaunch(first, scenario);
  assert.deepEqual(first, { scenario, launchId: 1 });
  assert.deepEqual(second, { scenario, launchId: 2 });
});
