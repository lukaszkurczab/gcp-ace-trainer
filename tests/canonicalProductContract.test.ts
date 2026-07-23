import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { CanonicalProductContractValidationError, loadCanonicalProductContract, parseCanonicalProductContract } from "../scripts/validateCanonicalProductContract";

const validContract = readFileSync("docs/canonical-product-contract.yaml", "utf8");

test("parses the canonical product contract", () => {
  const contract = loadCanonicalProductContract();
  assert.equal(contract.version, 1);
  assert.equal(contract.authority.normativeSource, "canonical-product-contract");
  assert.equal(contract.authority.narrativeDocuments, "non-normative");
});

test("defines exactly the complete canonical Algorithms mode matrix", () => {
  const contract = loadCanonicalProductContract();

  assert.deepEqual(contract.algorithms.modes, [
    {
      id: "algorithms-learn-approach", label: "Learn Approach", lengths: { default: 10, supported: [10] }, scope: "oneMentalUnit", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: false,
    },
    {
      id: "algorithms-guided-practice", label: "Guided Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "oneMentalUnit", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: true,
    },
    {
      id: "algorithms-custom-practice", label: "Custom Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "guidedPracticeBlueprintForSelectedMentalUnit", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer", "atSessionEnd"] }, timer: { kind: "elapsedForeground" }, reinsert: true,
    },
    {
      id: "algorithms-recognize-patterns", label: "Recognize Patterns", lengths: { default: 20, supported: [10, 20, 40] }, scope: "declaredRecognitionSet", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: false,
    },
    {
      id: "algorithms-contrast-practice", label: "Contrast Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "declaredContrastSet", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: false,
    },
    {
      id: "algorithms-weak-area-review", label: "Weak Area Review", lengths: { default: 10, supported: [10, 20] }, scope: "eligibleDueReviewOrCompletedSessionMisses", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: true,
    },
    {
      id: "algorithms-independent-practice", label: "Independent Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "declaredInterleavedScope", shortening: "blueprintControlled",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: false,
    },
    {
      id: "algorithms-interview-simulation", label: "Interview Simulation", lengths: { default: 40, supported: [40] }, scope: "fixedSimulationBlueprint", shortening: "prohibited",
      feedback: { default: "atSessionEnd", supported: ["atSessionEnd"] }, timer: { kind: "countdownForeground", durationMs: 2_700_000 }, reinsert: false,
    },
  ]);
});

test("locks the Custom Practice contract required by ALGORITHMS-CUSTOM-PRACTICE-001", () => {
  const contract = loadCanonicalProductContract();
  const customPractice = contract.algorithms.modes.find((mode) => mode.id === "algorithms-custom-practice");

  assert.deepEqual(
    contract.requirements.find((requirement) => requirement.id === "ALGORITHMS-CUSTOM-PRACTICE-001"),
    {
      id: "ALGORITHMS-CUSTOM-PRACTICE-001",
      statement: "Custom Practice accepts only 10, 20, or 40 items and explicit afterEachAnswer or atSessionEnd feedback, uses the Guided Practice blueprint for an explicitly selected mental unit, and shares the one-active-session lifecycle with profile-owned reinsert.",
    },
  );
  assert.deepEqual(customPractice, {
    id: "algorithms-custom-practice", label: "Custom Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "guidedPracticeBlueprintForSelectedMentalUnit", shortening: "allowed",
    feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer", "atSessionEnd"] }, timer: { kind: "elapsedForeground" }, reinsert: true,
  });
  assert.deepEqual(contract.algorithms.customPractice, {
    modeId: "algorithms-custom-practice",
    contentBlueprintModeId: "algorithms-guided-practice",
    mentalUnitSelection: "explicit",
    reinsertOwnership: "profile",
    lifecycle: "sharedOneActiveSession",
  });
});

test("defines exactly the complete declared Certification mode matrix", () => {
  const contract = loadCanonicalProductContract();

  assert.deepEqual(
    contract.requirements.find((requirement) => requirement.id === "CERTIFICATION-MODE-MATRIX-001"),
    {
      id: "CERTIFICATION-MODE-MATRIX-001",
      statement: "Certification exposes exactly seven declared modes, each owned by the certification family and cloud-certification track with explicit contract, implementation, and verification status.",
    },
  );
  assert.deepEqual(contract.certification.modes, [
    { id: "certification-diagnostic-baseline", label: "Diagnostic Baseline", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "unavailable", verification: "unverified" } },
    { id: "certification-focus-practice", label: "Focus Practice", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "unavailable", verification: "unverified" } },
    { id: "certification-scenario-practice", label: "Scenario Practice", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "unavailable", verification: "unverified" } },
    { id: "certification-weak-area-review", label: "Weak Area Review", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "unavailable", verification: "unverified" } },
    { id: "certification-mixed-practice", label: "Mixed Practice", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "unavailable", verification: "unverified" } },
    { id: "certification-quick-review", label: "Quick Review", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "unavailable", verification: "unverified" } },
    { id: "certification-exam-simulation", label: "Exam Simulation", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "unavailable", verification: "unverified" } },
  ]);
});

test("rejects canonical product contracts with unknown fields, missing version, empty requirements, or duplicate requirement identifiers", () => {
  const cases: readonly [string, string, RegExp][] = [
    ["unknown field", `${validContract}unexpected: value\n`, /must NOT have additional properties/],
    ["missing version", validContract.replace("version: 1\n", ""), /must have required property 'version'/],
    ["empty requirements", validContract.replace(/requirements:\n(?:  - .*\n    .*\n)+/, "requirements: []\n"), /must NOT have fewer than 1 items/],
    ["duplicate identifier", validContract.replace("    statement: Product behavior is normative only when defined by this contract.\n", "    statement: Product behavior is normative only when defined by this contract.\n  - id: CONTRACT-AUTHORITY-001\n    statement: A second requirement with the same identifier.\n"), /Duplicate canonical product contract requirement identifier/],
    ["duplicate Algorithms mode identifier", validContract.replace("    - id: algorithms-guided-practice", "    - id: algorithms-learn-approach"), /Duplicate canonical product contract Algorithms mode identifier/],
    ["mismatched Algorithms mode label", validContract.replace("label: Learn Approach", "label: Interview Simulation"), /Algorithms mode label does not match its identifier/],
    ["missing Algorithms mode field", validContract.replace("      reinsert: false\n", ""), /must have required property 'reinsert'/],
    ["duplicate supported length", validContract.replace("supported: [10]", "supported: [10, 10]"), /must NOT have duplicate items/],
    ["duplicate supported feedback", validContract.replace("supported: [afterEachAnswer]", "supported: [afterEachAnswer, afterEachAnswer]"), /must NOT have duplicate items/],
    ["unsupported default length", validContract.replace("      label: Guided Practice\n      lengths:\n        default: 20\n        supported: [10, 20, 40]", "      label: Guided Practice\n      lengths:\n        default: 20\n        supported: [10]"), /Algorithms mode default length must be supported/],
    ["unsupported default feedback", validContract.replace("        default: atSessionEnd\n        supported: [atSessionEnd]", "        default: atSessionEnd\n        supported: [afterEachAnswer]"), /Algorithms mode default feedback must be supported/],
    ["missing Custom Practice contract", validContract.replace("  customPractice:\n    modeId: algorithms-custom-practice\n    contentBlueprintModeId: algorithms-guided-practice\n    mentalUnitSelection: explicit\n    reinsertOwnership: profile\n    lifecycle: sharedOneActiveSession\n", ""), /must have required property 'customPractice'/],
    ["unknown Custom Practice contract field", validContract.replace("    lifecycle: sharedOneActiveSession\n", "    lifecycle: sharedOneActiveSession\n    extra: value\n"), /must NOT have additional properties/],
    ["changed Custom Practice mental-unit selection", validContract.replace("mentalUnitSelection: explicit", "mentalUnitSelection: inferred"), /must be equal to constant/],
    ["changed Custom Practice feedback options", validContract.replace("supported: [afterEachAnswer, atSessionEnd]", "supported: [afterEachAnswer]"), /Custom Practice mode must preserve its declared lengths, feedback, Guided Practice mental-unit blueprint, and reinsert profile/],
    ["missing Certification contract", validContract.replace(/certification:\n(?:  .*\n|    .*\n|      .*\n|        .*\n)+$/, ""), /must have required property 'certification'/],
    ["duplicate Certification mode identifier", validContract.replace("    - id: certification-focus-practice", "    - id: certification-diagnostic-baseline"), /Duplicate canonical product contract Certification mode identifier/],
    ["mismatched Certification mode label", validContract.replace("label: Diagnostic Baseline", "label: Exam Simulation"), /Certification mode label does not match its identifier/],
    ["missing Certification mode owner", validContract.replace("      owner:\n        familyId: certification\n        trackId: cloud-certification\n", ""), /must have required property 'owner'/],
    ["changed Certification implementation status", validContract.replace("        implementation: unavailable", "        implementation: available"), /must be equal to constant/],
  ];

  for (const [label, source, message] of cases) {
    assert.throws(() => parseCanonicalProductContract(source), (error: unknown) => error instanceof CanonicalProductContractValidationError && message.test(error.message), label);
  }
});
