import assert from "node:assert/strict";
import test from "node:test";

import { changedPathsFromNameStatus, evaluateContractChangeGate } from "../scripts/enforceContractChangeGate";
import { loadCanonicalProductContract, type CanonicalProductContract } from "../scripts/validateCanonicalProductContract";

const contractPath = "docs/canonical-product-contract.yaml";
const requirementId = "CONTRACT-CHANGE-GATE-001";
const requirementDiff = `+  - id: ${requirementId}\n`;

function contractWithGateEvidence(approvedDesignReference = false, sourcePathPrefix = "src/features/"): CanonicalProductContract {
  const contract = loadCanonicalProductContract();
  return {
    ...contract,
    requirements: [...contract.requirements, { id: requirementId, statement: "Gate fixture requirement." }],
    requirementTestCoverage: {
      ...contract.requirementTestCoverage,
      tests: [...contract.requirementTestCoverage.tests, {
        id: "contract-change-gate-fixture",
        testPath: "tests/contractChangeGate.test.ts",
        testName: "enforces contract changes for behavior changes",
        requirementIds: [requirementId],
      }],
    },
    designReferences: {
      ...contract.designReferences,
      references: approvedDesignReference ? [{
        id: "approved-gate-fixture",
        screenStateTarget: "gate-fixture-screen",
        patternPath: "docs/designs/product-direction-options/DESIGN.md",
        version: 1,
        approvalStatus: "APPROVED",
        owner: "product-owner",
      }] : [],
      uiOwnership: approvedDesignReference ? [{ sourcePathPrefix, designReferenceId: "approved-gate-fixture" }] : [],
    },
  };
}

test("enforces contract changes for behavior changes", () => {
  const missingEvidence = evaluateContractChangeGate({
    changedPaths: ["src/application/newBehavior.ts"],
    canonicalContractDiff: "",
    contract: loadCanonicalProductContract(),
  });
  assert.deepEqual(missingEvidence, [
    "Behavior change requires docs/canonical-product-contract.yaml to change.",
    "Behavior change requires at least one added canonical requirement ID.",
  ]);

  const validNonUiChange = evaluateContractChangeGate({
    changedPaths: ["src/application/newBehavior.ts", contractPath, "tests/contractChangeGate.test.ts"],
    canonicalContractDiff: requirementDiff,
    contract: contractWithGateEvidence(),
  });
  assert.deepEqual(validNonUiChange, []);
});

test("requires an approved design reference only for UI behavior changes", () => {
  const withoutDesign = evaluateContractChangeGate({
    changedPaths: ["src/features/NewScreen.tsx", contractPath, "tests/contractChangeGate.test.ts"],
    canonicalContractDiff: requirementDiff,
    contract: contractWithGateEvidence(),
  });
  assert.deepEqual(withoutDesign, ["UI change requires an APPROVED design reference mapped to src/features/NewScreen.tsx."]);

  const unrelatedDesign = evaluateContractChangeGate({
    changedPaths: ["src/features/NewScreen.tsx", contractPath, "tests/contractChangeGate.test.ts"],
    canonicalContractDiff: requirementDiff,
    contract: contractWithGateEvidence(true, "src/components/"),
  });
  assert.deepEqual(unrelatedDesign, ["UI change requires an APPROVED design reference mapped to src/features/NewScreen.tsx."]);

  const withDesign = evaluateContractChangeGate({
    changedPaths: ["src/features/NewScreen.tsx", contractPath, "tests/contractChangeGate.test.ts"],
    canonicalContractDiff: requirementDiff,
    contract: contractWithGateEvidence(true),
  });
  assert.deepEqual(withDesign, []);

  for (const [changedPath, sourcePathPrefix] of [
    ["src/assets/icons/home.svg", "src/assets/"],
    ["src/content/application/ContentPreparationGate.tsx", "src/content/application/"],
  ] as const) {
    assert.deepEqual(evaluateContractChangeGate({
      changedPaths: [changedPath, contractPath, "tests/contractChangeGate.test.ts"],
      canonicalContractDiff: requirementDiff,
      contract: contractWithGateEvidence(true, sourcePathPrefix),
    }), [], changedPath);
  }

  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: ["src/features/foobar/Screen.tsx", contractPath, "tests/contractChangeGate.test.ts"],
    canonicalContractDiff: requirementDiff,
    contract: contractWithGateEvidence(true, "src/features/foo/"),
  }), ["UI change requires an APPROVED design reference mapped to src/features/foobar/Screen.tsx."]);
});

test("treats every runtime source path and deleted paths as behavior changes", () => {
  for (const changedPath of [
    "src/theme/tokens.ts",
    "src/preferences/useNotificationSettings.ts",
    "src/infrastructure/storage/mmkvClient.ts",
    "src/content/application/ContentPreparationGate.tsx",
    "src/application/deletedBehavior.ts",
  ]) {
    const errors = evaluateContractChangeGate({ changedPaths: [changedPath], canonicalContractDiff: "", contract: loadCanonicalProductContract() });
    assert.ok(errors.some((error) => error.startsWith("Behavior change requires docs/canonical-product-contract.yaml")), changedPath);
  }
  assert.deepEqual(changedPathsFromNameStatus("D\tsrc/application/deletedBehavior.ts\nR100\tsrc/features/OldScreen.tsx\tdocs/old-screen.md\n"), [
    "src/application/deletedBehavior.ts", "src/features/OldScreen.tsx", "docs/old-screen.md",
  ]);
});

test("does not require contract evidence for test-only or documentation-only changes", () => {
  for (const changedPaths of [["tests/contractChangeGate.test.ts"], ["docs/17-training-runtime-and-interaction-spec.md"]]) {
    assert.deepEqual(evaluateContractChangeGate({ changedPaths, canonicalContractDiff: "", contract: loadCanonicalProductContract() }), []);
  }
});
