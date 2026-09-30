import { createCertificationExamReviewFixture } from "../../testing/certificationExamReviewFixture";
import type { CertificationExamReviewProjection } from "../../application/certification/certificationExamReviewProjection";
import { CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID } from "./certificationExamReviewFixtureCommand";
import type { Summary } from "./ResultScreen";
import type { CertificationExamReviewFixtureCase } from "./certificationExamReviewFixtureCommand";
import type { CertificationExamReviewFixtureRuntime, CertificationExamReviewFixtureSourceTrace } from "./certificationExamReviewFixtureRuntime.disabled";

export function createCertificationExamReviewFixtureRuntime(
  scenario: CertificationExamReviewFixtureCase,
  options: Readonly<{ openUrl: (url: string) => Promise<unknown> }>,
): CertificationExamReviewFixtureRuntime {
  let fixturePromise: ReturnType<typeof createCertificationExamReviewFixture> | null = null;
  let sourceTrace: CertificationExamReviewFixtureSourceTrace = Object.freeze({ count: 0, url: null });
  const getFixture = () => fixturePromise ??= createCertificationExamReviewFixture({ correctIndices: [0], incorrectIndices: [1] });
  const assertSessionIdentity = (sessionId: string) => {
    if (sessionId !== CERTIFICATION_EXAM_REVIEW_FIXTURE_SESSION_ID) throw new Error("The requested session does not match this local review fixture.");
  };
  const readReview = async (sessionId: string): Promise<CertificationExamReviewProjection> => {
    assertSessionIdentity(sessionId);
    return (await getFixture()).projection;
  };
  return Object.freeze({
    async readSummary(sessionId: string): Promise<Summary> {
      assertSessionIdentity(sessionId);
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
    async openSource(url: string): Promise<unknown> {
      const fixture = await getFixture();
      sourceTrace = Object.freeze({ count: sourceTrace.count + 1, url });
      const projectedUrls = fixture.projection.items.flatMap((item) => item.sources.map((source) => source.url));
      if (!projectedUrls.includes(url)) throw new Error("The source URL does not belong to this local review fixture.");
      if (scenario === "source-failure") throw new Error("The fixture source opener rejected this request.");
      return options.openUrl(url);
    },
    getSourceTrace: () => sourceTrace,
  });
}
