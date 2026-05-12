import type { ExamBlueprint, ExamDomain } from "../types";

export const EXAM_BLUEPRINT: ExamBlueprint = {
  setup_environment: 12,
  planning_implementation: 15,
  operations: 13,
  access_security: 10
};

export const EXAM_QUESTION_COUNT = 50;
export const EXAM_DURATION_MINUTES = 120;

// Training threshold for this local app, not an official Google passing score.
export const TRAINING_PASS_THRESHOLD = 75;

export const EXAM_DOMAIN_LABELS: Record<ExamDomain, string> = {
  setup_environment: "Setting up a cloud solution environment",
  planning_implementation: "Planning and configuring a cloud solution",
  operations: "Ensuring successful operation of a cloud solution",
  access_security: "Configuring access and security"
};
