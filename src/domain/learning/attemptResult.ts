import { InvalidAttemptResultError } from "./errors";

export type AttemptResultKind = "correct" | "partial" | "incorrect";

export type AttemptResultComponent = Readonly<{
  id: string;
  earnedPoints: number;
  maxPoints: number;
}>;

export type AttemptResult = Readonly<{
  kind: AttemptResultKind;
  earnedPoints: number;
  maxPoints: number;
  components?: readonly AttemptResultComponent[];
}>;

export function createAttemptResult(input: AttemptResult): AttemptResult {
  if (!Number.isFinite(input.earnedPoints) || !Number.isFinite(input.maxPoints)) {
    throw new InvalidAttemptResultError("Attempt result points must be finite numbers.");
  }
  if (input.maxPoints <= 0) throw new InvalidAttemptResultError("Attempt result maxPoints must be greater than zero.");
  if (input.earnedPoints < 0) throw new InvalidAttemptResultError("Attempt result earnedPoints cannot be negative.");
  if (input.earnedPoints > input.maxPoints) throw new InvalidAttemptResultError("Attempt result earnedPoints cannot exceed maxPoints.");
  if (input.kind === "correct" && input.earnedPoints !== input.maxPoints) {
    throw new InvalidAttemptResultError("A correct result must earn all available points.");
  }
  if (input.kind === "incorrect" && input.earnedPoints !== 0) {
    throw new InvalidAttemptResultError("An incorrect result must earn zero points.");
  }
  if (input.kind === "partial" && (input.earnedPoints === 0 || input.earnedPoints === input.maxPoints)) {
    throw new InvalidAttemptResultError("A partial result must earn more than zero and less than maxPoints.");
  }
  if (input.components) {
    if (input.components.some((component) => component.maxPoints <= 0 || component.earnedPoints < 0 || component.earnedPoints > component.maxPoints)) {
      throw new InvalidAttemptResultError("Attempt result components contain invalid point ranges.");
    }
    const earnedPoints = input.components.reduce((sum, component) => sum + component.earnedPoints, 0);
    const maxPoints = input.components.reduce((sum, component) => sum + component.maxPoints, 0);
    if (earnedPoints !== input.earnedPoints || maxPoints !== input.maxPoints) {
      throw new InvalidAttemptResultError("Attempt result components must sum to the result envelope.");
    }
  }
  return Object.freeze({
    ...input,
    components: input.components ? Object.freeze(input.components.map((component) => Object.freeze({ ...component }))) : undefined,
  });
}
