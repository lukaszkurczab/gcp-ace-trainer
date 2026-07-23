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
    modes: readonly CanonicalAlgorithmMode[];
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

  return contract as CanonicalProductContract;
}

export function loadCanonicalProductContract(): CanonicalProductContract {
  const contractPath = resolve(dirname(fileURLToPath(import.meta.url)), "../docs/canonical-product-contract.yaml");
  return parseCanonicalProductContract(readFileSync(contractPath, "utf8"));
}
