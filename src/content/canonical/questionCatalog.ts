import type { ContentPackagePin } from "../contracts";
import type { CanonicalArtifact, CanonicalContentLockRecord, Question } from "./questionTypes";
import { validateCanonicalArtifact } from "./questionValidation";

export type CanonicalQuestionCatalog = Readonly<{
  trackId: string;
  contentVersion: string;
  artifactSha256: string;
  questions: readonly Question[];
  packagePin: ContentPackagePin;
  getQuestionById(questionId: string): Question | undefined;
  getQuestionsByNodeId(nodeId: string): readonly Question[];
  getQuestionsByMentalUnitId(mentalUnitId: string): readonly Question[];
}>;

export type Sha256Utf8 = (canonicalUtf8: string) => Promise<string>;

export async function createCanonicalQuestionCatalog(value: unknown, lock: CanonicalContentLockRecord, expectedTrackId: string, sha256Utf8: Sha256Utf8): Promise<CanonicalQuestionCatalog> {
  // Structural validation intentionally precedes the sole integrity boundary below.
  const artifact: CanonicalArtifact = validateCanonicalArtifact(value, lock, expectedTrackId);
  const actualSha256 = await sha256Utf8(JSON.stringify(artifact));
  if (actualSha256 !== lock.sha256) throw new Error(`Canonical artifact ${expectedTrackId} SHA-256 does not match its lock record.`);
  const byQuestion = new Map(artifact.questions.map((question) => [question.questionId, question]));
  const byNode = group(artifact.questions, (question) => question.nodeId);
  const byMentalUnit = group(artifact.questions, (question) => question.mentalUnitId);
  const packagePin: ContentPackagePin = Object.freeze({ packageIdentity: lock.sha256, packageVersion: artifact.contentVersion, contentReleaseId: "canonical-content-v1" });
  return Object.freeze({ trackId: artifact.trackId, contentVersion: artifact.contentVersion, artifactSha256: lock.sha256, questions: artifact.questions, packagePin, getQuestionById: (id) => byQuestion.get(id), getQuestionsByNodeId: (id) => byNode.get(id) ?? Object.freeze([]), getQuestionsByMentalUnitId: (id) => byMentalUnit.get(id) ?? Object.freeze([]) });
}
function group(questions: readonly Question[], key: (question: Question) => string): ReadonlyMap<string, readonly Question[]> { const mutable = new Map<string, Question[]>(); for (const question of questions) { const id = key(question); const list = mutable.get(id) ?? []; list.push(question); mutable.set(id, list); } return new Map([...mutable].map(([id, list]) => [id, Object.freeze(list)])); }
