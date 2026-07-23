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

test("rejects canonical product contracts with unknown fields, missing version, empty requirements, or duplicate requirement identifiers", () => {
  const cases: readonly [string, string, RegExp][] = [
    ["unknown field", `${validContract}unexpected: value\n`, /must NOT have additional properties/],
    ["missing version", validContract.replace("version: 1\n", ""), /must have required property 'version'/],
    ["empty requirements", validContract.replace(/requirements:\n(?:  - .*\n    .*\n)+/, "requirements: []\n"), /must NOT have fewer than 1 items/],
    ["duplicate identifier", validContract.replace("    statement: Product behavior is normative only when defined by this contract.\n", "    statement: Product behavior is normative only when defined by this contract.\n  - id: CONTRACT-AUTHORITY-001\n    statement: A second requirement with the same identifier.\n"), /Duplicate canonical product contract requirement identifier/],
    ["duplicate Algorithms mode identifier", validContract.replace("algorithms-guided-practice", "algorithms-learn-approach"), /Duplicate canonical product contract Algorithms mode identifier/],
    ["mismatched Algorithms mode label", validContract.replace("label: Learn Approach", "label: Interview Simulation"), /Algorithms mode label does not match its identifier/],
    ["missing Algorithms mode field", validContract.replace("      reinsert: false\n", ""), /must have required property 'reinsert'/],
    ["duplicate supported length", validContract.replace("supported: [10]", "supported: [10, 10]"), /must NOT have duplicate items/],
    ["duplicate supported feedback", validContract.replace("supported: [afterEachAnswer]", "supported: [afterEachAnswer, afterEachAnswer]"), /must NOT have duplicate items/],
    ["unsupported default length", validContract.replace("      label: Guided Practice\n      lengths:\n        default: 20\n        supported: [10, 20, 40]", "      label: Guided Practice\n      lengths:\n        default: 20\n        supported: [10]"), /Algorithms mode default length must be supported/],
    ["unsupported default feedback", validContract.replace("        default: atSessionEnd\n        supported: [atSessionEnd]", "        default: atSessionEnd\n        supported: [afterEachAnswer]"), /Algorithms mode default feedback must be supported/],
  ];

  for (const [label, source, message] of cases) {
    assert.throws(() => parseCanonicalProductContract(source), (error: unknown) => error instanceof CanonicalProductContractValidationError && message.test(error.message), label);
  }
});
