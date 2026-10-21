import { canonicalSerialize } from "../../domain/identity/canonicalSerialization";
import type { CompletionCreditClassifier } from "../../domain/learning/packageCompletionRule";
import type { CanonicalQuestionCatalog } from "./questionCatalog";

type VerifiedCreditCatalog = Pick<CanonicalQuestionCatalog, "trackId" | "contentVersion" | "artifactSha256" | "questions">;
const pin = (value: Pick<VerifiedCreditCatalog, "contentVersion" | "artifactSha256">) => JSON.stringify([value.contentVersion, value.artifactSha256]);

/** Inputs have already passed exact artifact admission; this is not an admission bypass. */
export function createCompletionCreditClassifier(current: VerifiedCreditCatalog, predecessors: readonly VerifiedCreditCatalog[]): CompletionCreditClassifier {
  const currentQuestions = new Map(current.questions.map(question => [question.questionId, canonicalSerialize(question)]));
  const equivalentByPin = new Map<string, ReadonlySet<string>>();
  for (const source of [current, ...predecessors]) {
    if (source.trackId !== current.trackId) throw new Error("Completion credit predecessor belongs to another track.");
    const equivalent = new Set(source.questions.filter(question => currentQuestions.get(question.questionId) === canonicalSerialize(question)).map(question => question.questionId));
    const key = pin(source);
    if (equivalentByPin.has(key)) throw new Error("Completion credit predecessor identity is duplicated.");
    equivalentByPin.set(key, equivalent);
  }
  return item => {
    if (item.trackId !== current.trackId || !currentQuestions.has(item.questionId)) return "different";
    const known = equivalentByPin.get(pin(item));
    return known === undefined ? "unavailable" : known.has(item.questionId) ? "equivalent" : "different";
  };
}
