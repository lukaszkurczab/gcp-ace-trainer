import Ajv2020 from "ajv/dist/2020";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "yaml";

import schema from "../docs/canonical-product-contract.schema.json";

export type CanonicalAlgorithmModeId =
  | "algorithms-learn-approach"
  | "algorithms-guided-practice"
  | "algorithms-custom-practice"
  | "algorithms-recognize-patterns"
  | "algorithms-contrast-practice"
  | "algorithms-weak-area-review"
  | "algorithms-independent-practice"
  | "algorithms-interview-simulation";

export type CanonicalAlgorithmModeLabel =
  | "Learn Approach"
  | "Guided Practice"
  | "Custom Practice"
  | "Recognize Patterns"
  | "Contrast Practice"
  | "Weak Area Review"
  | "Independent Practice"
  | "Interview Simulation";

export type CanonicalCertificationModeId =
  | "certification-diagnostic-baseline"
  | "certification-focus-practice"
  | "certification-scenario-practice"
  | "certification-weak-area-review"
  | "certification-mixed-practice"
  | "certification-quick-review"
  | "certification-exam-simulation";

export type CanonicalCertificationModeLabel =
  | "Diagnostic Baseline"
  | "Focus Practice"
  | "Scenario Practice"
  | "Weak Area Review"
  | "Mixed Practice"
  | "Quick Review"
  | "Exam Simulation";

export type CanonicalUserCommandId =
  | "submit"
  | "next"
  | "save"
  | "save-and-continue"
  | "navigator-jump"
  | "finish"
  | "leave-resumable"
  | "abandon"
  | "recover"
  | "resume";

export type CanonicalSessionCtaId =
  | "practice-submit"
  | "practice-next"
  | "practice-finish"
  | "practice-leave-resumable"
  | "practice-abandon"
  | "practice-recover"
  | "simulation-save"
  | "simulation-navigator-jump"
  | "simulation-finish"
  | "simulation-leave-resumable"
  | "simulation-abandon"
  | "simulation-recover"
  | "session-resume";

export type CanonicalSimulationMutationKind =
  | "save"
  | "navigation"
  | "timer-checkpoint"
  | "foreground-transition"
  | "finalization"
  | "abandonment";

export type CanonicalPracticeSessionState =
  | "unanswered" | "submitting_before_journal" | "submit_journal_failed" | "commit_pending"
  | "commit_materialization_failed" | "commit_verification_failed" | "verified_pending_clear" | "recovery_required"
  | "feedback" | "advancing" | "advance_failed" | "completing" | "completion_failed" | "completed"
  | "abandoning" | "abandonment_failed_before_journal" | "abandonment_recovery_required" | "abandoned";

export type CanonicalSimulationSessionState =
  | "editable" | "saving" | "save_failed" | "stale_revision" | "navigating" | "navigation_failed"
  | "frozen" | "finalization_journal_pending" | "finalization_journal_failed" | "materializing"
  | "materialization_failed" | "verifying" | "verification_failed" | "verified_pending_clear"
  | "recovery_required" | "timer_recovery_failed" | "missing_draft" | "version_mismatch" | "corrupt_state"
  | "abandoning" | "abandonment_failed_before_journal" | "abandonment_recovery_required" | "abandoned" | "completed";

export type CanonicalSessionStateMachineTrigger =
  | "submit" | "next" | "save" | "navigator_jump" | "finish" | "abandon" | "recover"
  | "validation_rejected" | "journal_write_failed" | "submit_verified" | "advance_verified" | "advance_failed"
  | "completion_verified" | "completion_failed" | "abandonment_verified" | "abandonment_before_journal_failed"
  | "abandonment_recovery_required" | "save_verified" | "save_failed" | "stale_revision" | "navigation_verified"
  | "navigation_failed" | "reconstruct" | "finalization_started" | "finalization_verified" | "materialization_failed"
  | "materialization_verified" | "verification_failed" | "verification_verified";

export type CanonicalSessionTransition<State extends string> = Readonly<{
  from: State;
  trigger: CanonicalSessionStateMachineTrigger;
  condition?: "durable_state_not_durable" | "journal_status_durable" | "journal_status_materialized" | "journal_status_verified_pending_clear" | "recovered_active_session";
  to: State;
}>;

export type CanonicalAlgorithmScope =
  | "oneMentalUnit"
  | "guidedPracticeBlueprintForSelectedMentalUnit"
  | "declaredRecognitionSet"
  | "declaredContrastSet"
  | "eligibleDueReviewOrCompletedSessionMisses"
  | "declaredInterleavedScope"
  | "fixedSimulationBlueprint";

export type CanonicalAlgorithmTimer =
  | Readonly<{ kind: "elapsedForeground" }>
  | Readonly<{ kind: "countdownForeground"; durationMs: 2_700_000 }>;

export type CanonicalCustomPracticeContract = Readonly<{
  modeId: "algorithms-custom-practice";
  contentBlueprintModeId: "algorithms-guided-practice";
  mentalUnitSelection: "explicit";
  reinsertOwnership: "profile";
  lifecycle: "sharedOneActiveSession";
}>;

export type CanonicalAlgorithmMode = Readonly<{
  id: CanonicalAlgorithmModeId;
  label: CanonicalAlgorithmModeLabel;
  lengths: Readonly<{
    default: 10 | 20 | 40;
    supported: readonly (10 | 20 | 40)[];
  }>;
  scope: CanonicalAlgorithmScope;
  shortening: "allowed" | "blueprintControlled" | "prohibited";
  feedback: Readonly<{
    default: "afterEachAnswer" | "atSessionEnd";
    supported: readonly ("afterEachAnswer" | "atSessionEnd")[];
  }>;
  timer: CanonicalAlgorithmTimer;
  reinsert: boolean;
}>;

export type CanonicalCertificationMode = Readonly<{
  id: CanonicalCertificationModeId;
  label: CanonicalCertificationModeLabel;
  owner: Readonly<{
    familyId: "certification";
    trackId: "cloud-certification";
  }>;
  status: Readonly<{
    contract: "declared";
    implementation: "unavailable";
    verification: "unverified";
  }>;
}>;

export type CanonicalProductContract = Readonly<{
  version: number;
  contractId: "patternly-product-contract";
  authority: Readonly<{
    normativeSource: "canonical-product-contract";
    narrativeDocuments: "non-normative";
  }>;
  requirements: readonly Readonly<{
    id: string;
    statement: string;
  }>[];
  userCommands: Readonly<{
    commands: readonly Readonly<{ id: CanonicalUserCommandId }>[];
    sessionCtaMappings: readonly Readonly<{
      ctaId: CanonicalSessionCtaId;
      commandId: CanonicalUserCommandId;
    }>[];
  }>;
  sessionStateMachine: Readonly<{
    practice: Readonly<{
      initialState: "unanswered";
      states: readonly CanonicalPracticeSessionState[];
      transitions: readonly CanonicalSessionTransition<CanonicalPracticeSessionState>[];
    }>;
    simulation: Readonly<{
      initialState: "editable";
      states: readonly CanonicalSimulationSessionState[];
      transitions: readonly CanonicalSessionTransition<CanonicalSimulationSessionState>[];
    }>;
  }>;
  simulationConcurrency: Readonly<{
    scope: "oneActiveSession";
    queueDiscipline: "fifo";
    maxInFlight: 1;
    revalidateActiveSessionAtExecution: true;
    mutationKinds: readonly CanonicalSimulationMutationKind[];
  }>;
  algorithms: Readonly<{
    customPractice: CanonicalCustomPracticeContract;
    modes: readonly CanonicalAlgorithmMode[];
  }>;
  certification: Readonly<{
    modes: readonly CanonicalCertificationMode[];
  }>;
}>;

export class CanonicalProductContractValidationError extends Error {
  override name = "CanonicalProductContractValidationError";
}

const validateSchema = new Ajv2020({ allErrors: true, strict: true }).compile(schema);

const algorithmModeLabels: Readonly<Record<CanonicalAlgorithmModeId, CanonicalAlgorithmModeLabel>> = {
  "algorithms-learn-approach": "Learn Approach",
  "algorithms-guided-practice": "Guided Practice",
  "algorithms-custom-practice": "Custom Practice",
  "algorithms-recognize-patterns": "Recognize Patterns",
  "algorithms-contrast-practice": "Contrast Practice",
  "algorithms-weak-area-review": "Weak Area Review",
  "algorithms-independent-practice": "Independent Practice",
  "algorithms-interview-simulation": "Interview Simulation",
};

const certificationModeLabels: Readonly<Record<CanonicalCertificationModeId, CanonicalCertificationModeLabel>> = {
  "certification-diagnostic-baseline": "Diagnostic Baseline",
  "certification-focus-practice": "Focus Practice",
  "certification-scenario-practice": "Scenario Practice",
  "certification-weak-area-review": "Weak Area Review",
  "certification-mixed-practice": "Mixed Practice",
  "certification-quick-review": "Quick Review",
  "certification-exam-simulation": "Exam Simulation",
};

const canonicalSessionCtaCommands: Readonly<Record<CanonicalSessionCtaId, CanonicalUserCommandId>> = {
  "practice-submit": "submit",
  "practice-next": "next",
  "practice-finish": "finish",
  "practice-leave-resumable": "leave-resumable",
  "practice-abandon": "abandon",
  "practice-recover": "recover",
  "simulation-save": "save",
  "simulation-navigator-jump": "navigator-jump",
  "simulation-finish": "finish",
  "simulation-leave-resumable": "leave-resumable",
  "simulation-abandon": "abandon",
  "simulation-recover": "recover",
  "session-resume": "resume",
};

const canonicalPracticeSessionStates: readonly CanonicalPracticeSessionState[] = [
  "unanswered", "submitting_before_journal", "submit_journal_failed", "commit_pending", "commit_materialization_failed", "commit_verification_failed", "verified_pending_clear", "recovery_required", "feedback", "advancing", "advance_failed", "completing", "completion_failed", "completed", "abandoning", "abandonment_failed_before_journal", "abandonment_recovery_required", "abandoned",
];

const canonicalSimulationSessionStates: readonly CanonicalSimulationSessionState[] = [
  "editable", "saving", "save_failed", "stale_revision", "navigating", "navigation_failed", "frozen", "finalization_journal_pending", "finalization_journal_failed", "materializing", "materialization_failed", "verifying", "verification_failed", "verified_pending_clear", "recovery_required", "timer_recovery_failed", "missing_draft", "version_mismatch", "corrupt_state", "abandoning", "abandonment_failed_before_journal", "abandonment_recovery_required", "abandoned", "completed",
];

const canonicalSimulationMutationKinds: readonly CanonicalSimulationMutationKind[] = [
  "save", "navigation", "timer-checkpoint", "foreground-transition", "finalization", "abandonment",
];

const canonicalPracticeSessionTransitions: readonly CanonicalSessionTransition<CanonicalPracticeSessionState>[] = [
  { from: "unanswered", trigger: "submit", to: "submitting_before_journal" }, { from: "unanswered", trigger: "abandon", to: "abandoning" },
  { from: "submitting_before_journal", trigger: "validation_rejected", to: "unanswered" }, { from: "submitting_before_journal", trigger: "journal_write_failed", to: "submit_journal_failed" }, { from: "submitting_before_journal", trigger: "materialization_failed", to: "commit_materialization_failed" }, { from: "submitting_before_journal", trigger: "verification_failed", to: "commit_verification_failed" }, { from: "submitting_before_journal", trigger: "submit_verified", to: "feedback" },
  { from: "submit_journal_failed", trigger: "submit", to: "submitting_before_journal" },
  { from: "commit_pending", trigger: "recover", to: "unanswered" }, { from: "commit_materialization_failed", trigger: "recover", to: "feedback" }, { from: "commit_verification_failed", trigger: "recover", to: "feedback" }, { from: "verified_pending_clear", trigger: "recover", to: "feedback" }, { from: "recovery_required", trigger: "recover", to: "unanswered" },
  { from: "feedback", trigger: "next", to: "advancing" }, { from: "feedback", trigger: "abandon", to: "abandoning" },
  { from: "advancing", trigger: "advance_verified", to: "unanswered" }, { from: "advancing", trigger: "advance_failed", to: "advance_failed" }, { from: "advance_failed", trigger: "next", to: "advancing" },
  { from: "abandoning", trigger: "abandonment_verified", to: "abandoned" }, { from: "abandoning", trigger: "abandonment_before_journal_failed", to: "abandonment_failed_before_journal" }, { from: "abandoning", trigger: "abandonment_recovery_required", to: "abandonment_recovery_required" }, { from: "abandonment_failed_before_journal", trigger: "abandon", to: "abandoning" },
];

const canonicalSimulationSessionTransitions: readonly CanonicalSessionTransition<CanonicalSimulationSessionState>[] = [
  { from: "editable", trigger: "save", to: "saving" }, { from: "editable", trigger: "navigator_jump", to: "navigating" }, { from: "editable", trigger: "finish", to: "frozen" }, { from: "editable", trigger: "abandon", to: "abandoning" },
  { from: "saving", trigger: "save_verified", to: "editable" }, { from: "saving", trigger: "save_failed", to: "save_failed" }, { from: "saving", trigger: "stale_revision", to: "stale_revision" }, { from: "save_failed", trigger: "save", to: "saving" }, { from: "stale_revision", trigger: "save", to: "saving" },
  { from: "navigating", trigger: "navigation_verified", to: "editable" }, { from: "navigating", trigger: "navigation_failed", to: "navigation_failed" }, { from: "navigation_failed", trigger: "navigator_jump", condition: "durable_state_not_durable", to: "navigating" }, { from: "navigation_failed", trigger: "reconstruct", condition: "journal_status_durable", to: "materializing" }, { from: "navigation_failed", trigger: "reconstruct", condition: "journal_status_materialized", to: "verifying" }, { from: "navigation_failed", trigger: "reconstruct", condition: "journal_status_verified_pending_clear", to: "verified_pending_clear" },
  { from: "frozen", trigger: "finalization_started", to: "finalization_journal_pending" }, { from: "finalization_journal_pending", trigger: "finalization_verified", to: "completed" }, { from: "finalization_journal_pending", trigger: "journal_write_failed", to: "finalization_journal_failed" }, { from: "finalization_journal_pending", trigger: "materialization_failed", to: "materialization_failed" }, { from: "finalization_journal_pending", trigger: "verification_failed", to: "verification_failed" }, { from: "finalization_journal_failed", trigger: "finish", to: "frozen" }, { from: "materializing", trigger: "recover", condition: "recovered_active_session", to: "editable" }, { from: "verifying", trigger: "recover", condition: "recovered_active_session", to: "editable" }, { from: "verified_pending_clear", trigger: "recover", condition: "recovered_active_session", to: "editable" },
  { from: "abandoning", trigger: "abandonment_verified", to: "abandoned" }, { from: "abandoning", trigger: "abandonment_before_journal_failed", to: "abandonment_failed_before_journal" }, { from: "abandoning", trigger: "abandonment_recovery_required", to: "abandonment_recovery_required" }, { from: "abandonment_failed_before_journal", trigger: "abandon", to: "abandoning" }, { from: "abandonment_recovery_required", trigger: "reconstruct", condition: "journal_status_durable", to: "materializing" }, { from: "abandonment_recovery_required", trigger: "reconstruct", condition: "journal_status_materialized", to: "verifying" }, { from: "abandonment_recovery_required", trigger: "reconstruct", condition: "journal_status_verified_pending_clear", to: "verified_pending_clear" },
];

function hasExactValues<T>(actual: readonly T[], expected: readonly T[]): boolean {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function hasExactTransitions<State extends string>(actual: readonly CanonicalSessionTransition<State>[], expected: readonly CanonicalSessionTransition<State>[]): boolean {
  return actual.length === expected.length && actual.every((transition, index) => {
    const expectedTransition = expected[index];
    return expectedTransition !== undefined && transition.from === expectedTransition.from && transition.trigger === expectedTransition.trigger && transition.condition === expectedTransition.condition && transition.to === expectedTransition.to;
  });
}

export type CanonicalSessionTransitionInput =
  | Readonly<{ family: "practice"; from: CanonicalPracticeSessionState; trigger: CanonicalSessionStateMachineTrigger; condition?: CanonicalSessionTransition<string>["condition"]; to: CanonicalPracticeSessionState }>
  | Readonly<{ family: "simulation"; from: CanonicalSimulationSessionState; trigger: CanonicalSessionStateMachineTrigger; condition?: CanonicalSessionTransition<string>["condition"]; to: CanonicalSimulationSessionState }>;

export type CanonicalSimulationMutationAdmissionInput = Readonly<{
  kind: string;
  inFlightKinds: readonly string[];
}>;

/** A transition is valid only when the closed contract declares its complete edge. */
export function isDeclaredCanonicalSessionTransition(contract: CanonicalProductContract, input: CanonicalSessionTransitionInput): boolean {
  const transitions = input.family === "practice" ? contract.sessionStateMachine.practice.transitions : contract.sessionStateMachine.simulation.transitions;
  return transitions.some((transition) => transition.from === input.from && transition.trigger === input.trigger && transition.condition === input.condition && transition.to === input.to);
}

/** A simulation mutation may start only when its one active-session lane is empty. */
export function canStartCanonicalSimulationMutation(contract: CanonicalProductContract, input: CanonicalSimulationMutationAdmissionInput): boolean {
  const concurrency = contract.simulationConcurrency;
  const isKnownKind = (kind: string): kind is CanonicalSimulationMutationKind => concurrency.mutationKinds.includes(kind as CanonicalSimulationMutationKind);
  return concurrency.scope === "oneActiveSession"
    && concurrency.queueDiscipline === "fifo"
    && concurrency.maxInFlight === 1
    && concurrency.revalidateActiveSessionAtExecution
    && isKnownKind(input.kind)
    && input.inFlightKinds.every(isKnownKind)
    && input.inFlightKinds.length < concurrency.maxInFlight;
}

export function parseCanonicalProductContract(source: string): CanonicalProductContract {
  const document = parseDocument(source, { uniqueKeys: true });
  if (document.errors.length > 0) {
    throw new CanonicalProductContractValidationError(`Invalid canonical product contract YAML: ${document.errors.map((error) => error.message).join("; ")}`);
  }

  const contract: unknown = document.toJS();
  if (!validateSchema(contract)) {
    throw new CanonicalProductContractValidationError(`Invalid canonical product contract: ${validateSchema.errors?.map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`).join("; ")}`);
  }

  const requirementIds = (contract as CanonicalProductContract).requirements.map((requirement) => requirement.id);
  const duplicateIds = requirementIds.filter((id, index) => requirementIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    throw new CanonicalProductContractValidationError(`Duplicate canonical product contract requirement identifier: ${duplicateIds[0]}`);
  }

  const userCommandIds = (contract as CanonicalProductContract).userCommands.commands.map((command) => command.id);
  const duplicateUserCommandIds = userCommandIds.filter((id, index) => userCommandIds.indexOf(id) !== index);
  if (duplicateUserCommandIds.length > 0) {
    throw new CanonicalProductContractValidationError(`Duplicate canonical product contract user command identifier: ${duplicateUserCommandIds[0]}`);
  }

  const sessionCtaMappings = (contract as CanonicalProductContract).userCommands.sessionCtaMappings;
  const sessionCtaIds = sessionCtaMappings.map((mapping) => mapping.ctaId);
  const duplicateSessionCtaIds = sessionCtaIds.filter((id, index) => sessionCtaIds.indexOf(id) !== index);
  if (duplicateSessionCtaIds.length > 0) {
    throw new CanonicalProductContractValidationError(`Duplicate canonical product contract session CTA identifier: ${duplicateSessionCtaIds[0]}`);
  }

  const mappingWithUnknownCommand = sessionCtaMappings.find((mapping) => !userCommandIds.includes(mapping.commandId));
  if (mappingWithUnknownCommand) {
    throw new CanonicalProductContractValidationError(`Canonical session CTA must reference a declared user command: ${mappingWithUnknownCommand.ctaId}`);
  }

  const missingSessionCta = (Object.keys(canonicalSessionCtaCommands) as CanonicalSessionCtaId[]).find(
    (ctaId) => !sessionCtaIds.includes(ctaId),
  );
  if (missingSessionCta) {
    throw new CanonicalProductContractValidationError(`Canonical session CTA is missing exactly one command mapping: ${missingSessionCta}`);
  }

  const sessionCtaWithWrongCommand = sessionCtaMappings.find(
    (mapping) => canonicalSessionCtaCommands[mapping.ctaId] !== mapping.commandId,
  );
  if (sessionCtaWithWrongCommand) {
    throw new CanonicalProductContractValidationError(`Canonical session CTA command mapping does not match its intent: ${sessionCtaWithWrongCommand.ctaId}`);
  }

  const stateMachine = (contract as CanonicalProductContract).sessionStateMachine;
  if (!hasExactValues(stateMachine.practice.states, canonicalPracticeSessionStates)) {
    throw new CanonicalProductContractValidationError("Canonical Practice session state machine must declare exactly the durable operation states in canonical order");
  }
  if (!hasExactValues(stateMachine.simulation.states, canonicalSimulationSessionStates)) {
    throw new CanonicalProductContractValidationError("Canonical Simulation session state machine must declare exactly the durable operation states in canonical order");
  }
  if (!hasExactTransitions(stateMachine.practice.transitions, canonicalPracticeSessionTransitions)) {
    throw new CanonicalProductContractValidationError("Canonical Practice session state machine must declare exactly its allowed triggered transitions");
  }
  if (!hasExactTransitions(stateMachine.simulation.transitions, canonicalSimulationSessionTransitions)) {
    throw new CanonicalProductContractValidationError("Canonical Simulation session state machine must declare exactly its allowed triggered transitions");
  }

  const simulationConcurrency = (contract as CanonicalProductContract).simulationConcurrency;
  if (!hasExactValues(simulationConcurrency.mutationKinds, canonicalSimulationMutationKinds)) {
    throw new CanonicalProductContractValidationError("Canonical Simulation concurrency contract must declare exactly its serialized mutation kinds in canonical order");
  }

  const algorithmModeIds = (contract as CanonicalProductContract).algorithms.modes.map((mode) => mode.id);
  const duplicateAlgorithmModeIds = algorithmModeIds.filter((id, index) => algorithmModeIds.indexOf(id) !== index);
  if (duplicateAlgorithmModeIds.length > 0) {
    throw new CanonicalProductContractValidationError(`Duplicate canonical product contract Algorithms mode identifier: ${duplicateAlgorithmModeIds[0]}`);
  }

  const modeWithMismatchedLabel = (contract as CanonicalProductContract).algorithms.modes.find(
    (mode) => algorithmModeLabels[mode.id] !== mode.label,
  );
  if (modeWithMismatchedLabel) {
    throw new CanonicalProductContractValidationError(`Algorithms mode label does not match its identifier: ${modeWithMismatchedLabel.id}`);
  }

  const certificationModeIds = (contract as CanonicalProductContract).certification.modes.map((mode) => mode.id);
  const duplicateCertificationModeIds = certificationModeIds.filter((id, index) => certificationModeIds.indexOf(id) !== index);
  if (duplicateCertificationModeIds.length > 0) {
    throw new CanonicalProductContractValidationError(`Duplicate canonical product contract Certification mode identifier: ${duplicateCertificationModeIds[0]}`);
  }

  const certificationModeWithMismatchedLabel = (contract as CanonicalProductContract).certification.modes.find(
    (mode) => certificationModeLabels[mode.id] !== mode.label,
  );
  if (certificationModeWithMismatchedLabel) {
    throw new CanonicalProductContractValidationError(`Certification mode label does not match its identifier: ${certificationModeWithMismatchedLabel.id}`);
  }

  const modeWithUnsupportedDefaultLength = (contract as CanonicalProductContract).algorithms.modes.find(
    (mode) => !mode.lengths.supported.includes(mode.lengths.default),
  );
  if (modeWithUnsupportedDefaultLength) {
    throw new CanonicalProductContractValidationError(`Algorithms mode default length must be supported: ${modeWithUnsupportedDefaultLength.id}`);
  }

  const modeWithUnsupportedDefaultFeedback = (contract as CanonicalProductContract).algorithms.modes.find(
    (mode) => !mode.feedback.supported.includes(mode.feedback.default),
  );
  if (modeWithUnsupportedDefaultFeedback) {
    throw new CanonicalProductContractValidationError(`Algorithms mode default feedback must be supported: ${modeWithUnsupportedDefaultFeedback.id}`);
  }

  const customPractice = (contract as CanonicalProductContract).algorithms.customPractice;
  const customPracticeMode = (contract as CanonicalProductContract).algorithms.modes.find(
    (mode) => mode.id === customPractice.modeId,
  );
  if (!customPracticeMode) {
    throw new CanonicalProductContractValidationError("Custom Practice contract must reference its declared Algorithms mode");
  }

  const customPracticeHasExpectedModeConfiguration =
    hasExactValues(customPracticeMode.lengths.supported, [10, 20, 40]) &&
    customPracticeMode.lengths.default === 20 &&
    hasExactValues(customPracticeMode.feedback.supported, ["afterEachAnswer", "atSessionEnd"]) &&
    customPracticeMode.feedback.default === "afterEachAnswer" &&
    customPracticeMode.scope === "guidedPracticeBlueprintForSelectedMentalUnit" &&
    customPracticeMode.reinsert;
  if (!customPracticeHasExpectedModeConfiguration) {
    throw new CanonicalProductContractValidationError("Custom Practice mode must preserve its declared lengths, feedback, Guided Practice mental-unit blueprint, and reinsert profile");
  }

  return contract as CanonicalProductContract;
}

export function loadCanonicalProductContract(): CanonicalProductContract {
  const contractPath = resolve(dirname(fileURLToPath(import.meta.url)), "../docs/canonical-product-contract.yaml");
  return parseCanonicalProductContract(readFileSync(contractPath, "utf8"));
}
