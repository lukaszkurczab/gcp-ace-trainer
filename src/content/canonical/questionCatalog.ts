import { markStartup } from "../../infrastructure/diagnostics/startupTrace";
import type { PackageCompletionRule } from "../../domain/learning/packageCompletionRule";
import type { ContentArtifactMetadata } from "../contracts";
import type { CanonicalArtifact, CanonicalContentLockRecord, CanonicalProductSimulationProfile, Question } from "./questionTypes";
import type { LearningPlanningPolicy } from "./planningPolicy";
import { validateCanonicalArtifact } from "./questionValidation";
import { canonicalInteractionRegistry, type CanonicalInteractionRegistry } from "./interactions/registry";

export type CanonicalQuestionCatalog = Readonly<{
  trackId: string;
  contentVersion: string;
  artifactSha256: string;
  questions: readonly Question[];
  approachChallengeProblems?: readonly import("./approachChallengeProblem").ApproachChallengeProblem[];
  completionRule?: PackageCompletionRule;
  simulationProfiles?: readonly CanonicalProductSimulationProfile[];
  planningPolicy?: LearningPlanningPolicy;
  artifactMetadata: ContentArtifactMetadata;
  getQuestionById(questionId: string): Question | undefined;
  getQuestionsByNodeId(nodeId: string): readonly Question[];
  getQuestionsByMentalUnitId(mentalUnitId: string): readonly Question[];
}>;

export type Sha256Utf8 = (canonicalUtf8: string) => Promise<string>;

export async function createCanonicalQuestionCatalog(value: unknown, lock: CanonicalContentLockRecord, expectedTrackId: string, sha256Utf8: Sha256Utf8, interactionRegistry: CanonicalInteractionRegistry = canonicalInteractionRegistry): Promise<CanonicalQuestionCatalog> {
  // Structural validation intentionally precedes the sole integrity boundary below.
  markStartup("artifact_validate", "begin");
  let artifact: CanonicalArtifact;
  try { artifact = validateCanonicalArtifact(value, lock, expectedTrackId, interactionRegistry); }
  finally { markStartup("artifact_validate", "end"); }
  markStartup("artifact_stringify", "begin");
  let serialized: string;
  try { serialized = JSON.stringify(artifact); }
  finally { markStartup("artifact_stringify", "end"); }
  markStartup("artifact_hash", "begin");
  let actualSha256: string;
  try { actualSha256 = await sha256Utf8(serialized); }
  finally { markStartup("artifact_hash", "end"); }
  if (actualSha256 !== lock.sha256) throw new Error(`Canonical artifact ${expectedTrackId} SHA-256 does not match its lock record.`);
  return indexCanonicalArtifact(artifact, lock);
}

/**
 * Trusted path (D5, T1.4): the build-time trust manifest proved that this exact bundled artifact passed
 * `validateCanonicalArtifact` and hashes to `lock.sha256`, so runtime only re-checks cheap identity fields
 * and indexes. Full validation stays in `createCanonicalQuestionCatalog` (recovery, retained resolve).
 */
export function createTrustedCanonicalQuestionCatalog(value: unknown, lock: CanonicalContentLockRecord, expectedTrackId: string): CanonicalQuestionCatalog {
  const source = value as Record<string, unknown> | null;
  if (!source || typeof source !== "object" || Array.isArray(source) || source.trackId !== expectedTrackId || lock.trackId !== expectedTrackId
    || source.contentVersion !== lock.contentVersion || !Array.isArray(source.questions) || source.questions.length !== lock.questionCount
    || (source.schemaVersion !== "patternly-content-artifact-v1" && source.schemaVersion !== "patternly-content-artifact-v2")) {
    throw new Error(`Canonical artifact ${expectedTrackId} does not match its trusted lock record.`);
  }
  // Artifact metadata (profiles, rules, policy, paired problems) is small and deep-frozen as on the full path.
  // Question records are frozen shallowly: deep-freezing all 54 MB of question trees alone would cost ~150 ms in Hermes.
  for (const [key, child] of Object.entries(source)) if (key !== "questions") deepFreeze(child);
  for (const question of source.questions as object[]) Object.freeze(question);
  Object.freeze(source.questions);
  const trusted: CanonicalArtifact = Object.freeze(source) as CanonicalArtifact;
  return indexCanonicalArtifact(trusted, lock);
}

function indexCanonicalArtifact(artifact: CanonicalArtifact, lock: CanonicalContentLockRecord): CanonicalQuestionCatalog {
  markStartup("artifact_index", "begin");
  const byQuestion = new Map(artifact.questions.map((question) => [question.questionId, question]));
  const byNode = group(artifact.questions, (question) => question.nodeId);
  const byMentalUnit = group(artifact.questions, (question) => question.mentalUnitId);
  markStartup("artifact_index", "end");
  const artifactMetadata: ContentArtifactMetadata = Object.freeze({ artifactSha256: lock.sha256, contentVersion: artifact.contentVersion, contentReleaseId: "canonical-content-v1" });
  return Object.freeze({ trackId: artifact.trackId, contentVersion: artifact.contentVersion, artifactSha256: lock.sha256, questions: artifact.questions,
    ...(artifact.approachChallengeProblems ? { approachChallengeProblems: artifact.approachChallengeProblems } : {}),
    ...(artifact.completionRule ? { completionRule: artifact.completionRule } : {}), ...(artifact.simulationProfiles ? { simulationProfiles: artifact.simulationProfiles } : {}), ...(artifact.planningPolicy ? { planningPolicy: artifact.planningPolicy as LearningPlanningPolicy } : {}), artifactMetadata, getQuestionById: (id) => byQuestion.get(id), getQuestionsByNodeId: (id) => byNode.get(id) ?? Object.freeze([]), getQuestionsByMentalUnitId: (id) => byMentalUnit.get(id) ?? Object.freeze([]) });
}
function group(questions: readonly Question[], key: (question: Question) => string): ReadonlyMap<string, readonly Question[]> { const mutable = new Map<string, Question[]>(); for (const question of questions) { const id = key(question); const list = mutable.get(id) ?? []; list.push(question); mutable.set(id, list); } return new Map([...mutable].map(([id, list]) => [id, Object.freeze(list)])); }
function deepFreeze(value: unknown): void { if (value && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value)) deepFreeze(child); Object.freeze(value); } }
