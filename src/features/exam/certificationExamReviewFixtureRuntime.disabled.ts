import type { Summary } from "./ResultScreen";
import type { CertificationExamReviewProjection } from "../../application/certification/certificationExamReviewProjection";
import type { CertificationExamReviewFixtureCase } from "./certificationExamReviewFixtureCommand";

export type CertificationExamReviewFixtureSourceTrace = Readonly<{ count: number; url: string | null }>;
export type CertificationExamReviewFixtureRuntime = Readonly<{
  readSummary: (sessionId: string) => Promise<Summary>;
  readReview: (sessionId: string) => Promise<CertificationExamReviewProjection>;
  openSource: (url: string) => Promise<unknown>;
  getSourceTrace: () => CertificationExamReviewFixtureSourceTrace;
}>;

/** Metro selects this explicit unavailable implementation outside the local smoke profile. */
export function createCertificationExamReviewFixtureRuntime(_scenario: CertificationExamReviewFixtureCase, _options: Readonly<{ openUrl: (url: string) => Promise<unknown> }>): CertificationExamReviewFixtureRuntime {
  throw new Error("Certification Exam review fixtures are unavailable in this runtime.");
}
