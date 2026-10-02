import type { Question } from "../../content/canonical/questionTypes";
import type { ResolvedContentRef } from "../../domain";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";

const isChoice = (question: Question) => question.interaction.type === "choice_single" || question.interaction.type === "choice_multiple";

function controlIds(question: Question): string[] {
  if ("options" in question.interaction) return question.interaction.options.map((option) => option.optionId);
  if (question.interaction.type === "ordering") return question.interaction.elements.map((element) => element.elementId);
  return question.interaction.dimensions.map((dimension) => dimension.dimensionId);
}

/** Prepare once. Runtime occurrence IDs include the existing unique session ID. */
export function prepareCanonicalOptionOrder(question: Question, occurrenceId: string, pin: Pick<ResolvedContentRef, "contentVersion" | "artifactSha256">): readonly string[] {
  const ids = controlIds(question);
  if (!isChoice(question)) return Object.freeze(ids);
  const ranked = ids.map((id) => ({ id, rank: sha256Utf8(JSON.stringify(["canonical-choice-order-v1", occurrenceId, question.trackId, question.questionId, pin.contentVersion, pin.artifactSha256, id])) }));
  ranked.sort((a, b) => a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return Object.freeze(ranked.map(({ id }) => id));
}

/** Validate persisted membership, never regenerate an already prepared order. */
export function isCanonicalOptionOrder(question: Question, order: unknown): order is readonly string[] {
  const ids = controlIds(question);
  if (!Array.isArray(order) || order.length !== ids.length || new Set(order).size !== ids.length || ids.some((_, index) => !Object.hasOwn(order, index))) return false;
  return isChoice(question) ? order.every((id) => typeof id === "string" && ids.includes(id)) : ids.every((id, index) => order[index] === id);
}
