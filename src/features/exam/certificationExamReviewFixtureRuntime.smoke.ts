import { createCertificationExamReviewFixture } from "../../testing/certificationExamReviewFixture";
import type { CertificationExamReviewProjection } from "../../application/certification/certificationExamReviewProjection";
import { createCertificationPracticeAnswerFixture } from "../../testing/certificationPracticeAnswerFixture";
import { CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID, CERTIFICATION_PRACTICE_ANSWER_FIXTURE_SESSION_ID } from "./certificationExamReviewFixtureCommand";
import type { Summary } from "./ResultScreen";
import type { CertificationExamReviewFixtureCase } from "./certificationExamReviewFixtureCommand";
import type { CertificationExamReviewFixtureRuntime, CertificationExamReviewFixtureSourceTrace } from "./certificationExamReviewFixtureRuntime.disabled";

export function createCertificationExamReviewFixtureRuntime(
  scenario: CertificationExamReviewFixtureCase,
  options: Readonly<{ openUrl: (url: string) => Promise<unknown> }>,
): CertificationExamReviewFixtureRuntime {
  let fixturePromise: ReturnType<typeof createCertificationExamReviewFixture> | null = null;
  let practiceFixturePromise: ReturnType<typeof createCertificationPracticeAnswerFixture> | null = null;
  let sourceTrace: CertificationExamReviewFixtureSourceTrace = Object.freeze({ count: 0, url: null });
  const getFixture = () => fixturePromise ??= createCertificationExamReviewFixture({ correctIndices: [0], incorrectIndices: [1] });
  const getPracticeFixture = () => practiceFixturePromise ??= createCertificationPracticeAnswerFixture();
  const fixtureSessionId = scenario === "practice-answer-matrix" ? CERTIFICATION_PRACTICE_ANSWER_FIXTURE_SESSION_ID : CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID;
  const assertSessionIdentity = (sessionId: string) => {
    if (sessionId !== fixtureSessionId) throw new Error("The requested session does not match this local review fixture.");
  };
  const readReview = async (sessionId: string): Promise<CertificationExamReviewProjection | import("../../application/certification/certificationPracticeReviewProjection").CertificationPracticeReviewProjection> => {
    assertSessionIdentity(sessionId);
    return scenario === "practice-answer-matrix" ? (await getPracticeFixture()).projection : (await getFixture()).projection;
  };
  return Object.freeze({
    async readSummary(sessionId: string): Promise<Summary> {
      assertSessionIdentity(sessionId);
      if (scenario === "practice-answer-matrix") {
        const { projection, result, session } = await getPracticeFixture();
        const details = result.evidence.details as Record<string, unknown>;
        return Object.freeze({ certificationMaxPoints: typeof details.maxPoints === "number" ? details.maxPoints : null, certificationExam: null, certificationTopicId: null, designTopicId: null, result, session });
      }
      const { projection, result, session } = await getFixture();
      return Object.freeze({
        certificationMaxPoints: projection.maxPoints,
        certificationExam: projection,
        certificationTopicId: null,
        designTopicId: null,
        result,
        session,
      });
    },
    readReview,
    async readPracticePreviews(sessionId: string) {
      assertSessionIdentity(sessionId);
      if (scenario !== "practice-answer-matrix") throw new Error("Practice answer previews are unavailable in this fixture case.");
      return (await getPracticeFixture()).previews;
    },
    async openSource(url: string): Promise<unknown> {
      sourceTrace = Object.freeze({ count: sourceTrace.count + 1, url });
      const projection = scenario === "practice-answer-matrix" ? (await getPracticeFixture()).projection : (await getFixture()).projection;
      const projectedUrls = projection.items.flatMap((item) => (item.sources ?? []).map((source) => source.url));
      if (!projectedUrls.includes(url)) throw new Error("The source URL does not belong to this local review fixture.");
      if (scenario === "source-failure") throw new Error("The fixture source opener rejected this request.");
      return options.openUrl(url);
    },
    getSourceTrace: () => sourceTrace,
  });
}
