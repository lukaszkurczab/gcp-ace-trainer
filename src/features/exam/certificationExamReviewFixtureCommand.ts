export const CERTIFICATION_EXAM_REVIEW_FIXTURE_URL = "com.lkurczab.patternly://audit/exam-review";
export const CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID = "ui12-exam-review-fixture";
export const CERTIFICATION_PRACTICE_ANSWER_FIXTURE_SESSION_ID = "aud15-practice-answer-matrix";

export const CERTIFICATION_EXAM_REVIEW_FIXTURE_CASES = Object.freeze(["exam-ready", "source-failure", "practice-answer-matrix"] as const);
export type CertificationExamReviewFixtureCase = (typeof CERTIFICATION_EXAM_REVIEW_FIXTURE_CASES)[number];
export type CertificationExamReviewFixtureLaunch = Readonly<{ scenario: CertificationExamReviewFixtureCase; launchId: number }>;

export function parseCertificationExamReviewFixtureUrl(url: string | null, enabled: boolean): CertificationExamReviewFixtureCase | null {
  if (!enabled || !url) return null;
  for (const scenario of CERTIFICATION_EXAM_REVIEW_FIXTURE_CASES) {
    if (url === `${CERTIFICATION_EXAM_REVIEW_FIXTURE_URL}?case=${scenario}`) return scenario;
  }
  return null;
}

export function nextCertificationExamReviewFixtureLaunch(
  previous: CertificationExamReviewFixtureLaunch | null,
  scenario: CertificationExamReviewFixtureCase,
): CertificationExamReviewFixtureLaunch {
  return Object.freeze({ scenario, launchId: (previous?.launchId ?? 0) + 1 });
}
