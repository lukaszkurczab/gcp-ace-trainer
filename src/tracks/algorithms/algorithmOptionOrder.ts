import {
  isAlgorithmChoiceQuestion,
  isAlgorithmComplexityQuestion,
  isAlgorithmOrderingQuestion,
  type AlgorithmQuestion,
} from "./algorithmQuestionTypes";

/** Builds the immutable display order stored with a prepared session. */
export function createAlgorithmOptionOrder(
  question: AlgorithmQuestion,
  occurrenceId: string,
): readonly string[] {
  if (isAlgorithmChoiceQuestion(question)) {
    return Object.freeze(shuffleDeterministically(
      question.interaction.options.map((option) => option.id),
      occurrenceId,
    ));
  }

  if (isAlgorithmOrderingQuestion(question)) {
    return Object.freeze(question.interaction.elements.map((element) => element.id));
  }

  if (isAlgorithmComplexityQuestion(question)) return Object.freeze([]);

  return assertUnreachableQuestion(question);
}

function shuffleDeterministically(values: readonly string[], seed: string): string[] {
  const shuffled = [...values];
  let state = hash(seed);
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = next(state);
    const target = state % (index + 1);
    [shuffled[index], shuffled[target]] = [shuffled[target]!, shuffled[index]!];
  }
  return shuffled;
}

function hash(value: string): number {
  let result = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16_777_619);
  }
  return result >>> 0;
}

function next(value: number): number {
  let result = value || 0x9e3779b9;
  result ^= result << 13;
  result ^= result >>> 17;
  result ^= result << 5;
  return result >>> 0;
}

function assertUnreachableQuestion(question: never): never {
  throw new Error(`Unsupported Algorithms question interaction: ${JSON.stringify(question)}`);
}
