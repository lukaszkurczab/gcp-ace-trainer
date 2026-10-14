import { indexCaseRecipes, type CaseRecipe } from "../../content/canonical/caseRecipe";
import type { TrainingAttempt } from "../../domain";
import type { TrainingCatalog, TrainingQuestionSummary } from "../trainingLifecycle/contracts";
import { selectPracticeQuestions } from "../canonical/practiceQuestionSelector";

/** Uses the existing coverage ranking; a recipe is one indivisible ordered block. */
export function selectCaseBlocks(input: Readonly<{
  catalog: TrainingCatalog;
  pool: readonly TrainingQuestionSummary[];
  attempts: readonly TrainingAttempt<unknown>[];
  requestedLength: number;
  coverageTargets?: ReadonlySet<string>;
}>): Readonly<{ questions: readonly TrainingQuestionSummary[]; recipes: readonly CaseRecipe[] }> {
  const recipes = indexCaseRecipes(input.catalog.questions);
  const poolById = new Map(input.pool.map(question => [question.questionId, question]));
  const byQuestion = new Map(recipes.flatMap(recipe => recipe.steps.map(step => [step.questionId, recipe] as const)));
  const ranked = selectPracticeQuestions(input.pool, input.attempts, input.catalog, input.pool.length, input.coverageTargets);
  const handled = new Set<string>(), selected: TrainingQuestionSummary[] = [], selectedRecipes: CaseRecipe[] = [];
  for (const question of ranked) {
    if (handled.has(question.questionId)) continue;
    const recipe = byQuestion.get(question.questionId);
    if (!recipe) {
      if (selected.length < input.requestedLength) selected.push(poolById.get(question.questionId)!);
      handled.add(question.questionId);
      continue;
    }
    for (const step of recipe.steps) handled.add(step.questionId);
    if (selected.length + recipe.steps.length > input.requestedLength || recipe.steps.some(step => !poolById.has(step.questionId))) continue;
    selected.push(...recipe.steps.map(step => poolById.get(step.questionId)!));
    selectedRecipes.push(recipe);
  }
  return Object.freeze({ questions: Object.freeze(selected), recipes: Object.freeze(selectedRecipes) });
}
