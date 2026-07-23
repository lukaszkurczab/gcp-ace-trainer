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

function hasExactValues<T>(actual: readonly T[], expected: readonly T[]): boolean {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
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
