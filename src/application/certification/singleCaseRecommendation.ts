import { indexCaseRecipes, type CaseRecipe } from "../../content/canonical/caseRecipe";
import type { TrainingCatalog } from "../trainingLifecycle/contracts";
import { isActiveReviewQueueEntry, type ReviewQueueEntry, type TrainingAttempt } from "../../domain";
import { selectPracticeQuestions } from "../canonical/practiceQuestionSelector";

/** Coverage ordering shared with practice. Does not move due dates or change the day plan. */
export function selectSingleCase(catalog: TrainingCatalog, attempts: readonly TrainingAttempt[], reviews: readonly ReviewQueueEntry[], now: string): Readonly<{ recipe: CaseRecipe; nodeId: string; due: boolean }> | null {
  const cases = indexCaseRecipes(catalog.questions);
  if (!cases.length) return null;
  const due = reviews.filter(r => isActiveReviewQueueEntry(r) && r.dueAt && Date.parse(r.dueAt) <= Date.parse(now) && r.sourceItem.trackId === catalog.trackId && r.sourceItem.contentVersion === catalog.contentVersion && r.sourceItem.artifactSha256 === catalog.artifactSha256).sort((a,b) => a.dueAt!.localeCompare(b.dueAt!) || a.createdAt.localeCompare(b.createdAt));
  const oldestCase = due[0] ? cases.find(c => c.steps.some(s => s.questionId === due[0]!.sourceItem.questionId)) : undefined;
  if (due.length && !oldestCase) return null;
  const dueCases = oldestCase ? [oldestCase] : [];
  // A case cannot claim due success for assisted contrast steps; ordinary due work stays in Review.
  const candidates = dueCases.length ? dueCases : cases;
  const owners = candidates.map(c => catalog.getQuestion(c.steps[0]!.questionId)!);
  const ranked = selectPracticeQuestions(owners, attempts, catalog, owners.length);
  const recipe = candidates.find(c => c.steps[0]!.questionId === ranked[0]?.questionId);
  return recipe ? { recipe, due: dueCases.length > 0, nodeId: catalog.getQuestion(recipe.steps[0]!.questionId)!.nodeId } : null;
}
