import assert from "node:assert/strict";
import test from "node:test";

import { changedPathsFromNameStatus, evaluateContractChangeGate } from "../scripts/enforceContractChangeGate";
import { loadCanonicalProductContract, type CanonicalProductContract } from "../scripts/validateCanonicalProductContract";

const contractPath = "docs/canonical-product-contract.yaml";
const contractCompanionPaths = [
  contractPath,
  "docs/canonical-product-contract.schema.json",
  "scripts/validateCanonicalProductContract.ts",
  "tests/canonicalProductContract.test.ts",
] as const;
const requirementId = "CONTRACT-CHANGE-GATE-001";
const requirementDiff = `+  - id: ${requirementId}\n`;
const trackIdentityRequirementDiff = "+  - id: TRACK-IDENTITY-CUTOVER-001\n";
const trackIdentityRequiredPaths = [
  ...contractCompanionPaths,
  "integration/contracts/content-release/release.lock.json",
  "src/domain/tracks/trackRegistry.ts",
  "tests/storageCutover.test.ts",
] as const;
const approvedDesignNeutralPlatformMigrationCommit = "a5eb8ac14b3753bd443486d94853468183605ad7";
const approvedDesignNeutralPlatformMigrationPaths = [
  "src/components/SettingsBottomSheet.tsx",
  "src/components/SettingsDialog.tsx",
  "src/features/practice/PracticeSessionSurface.tsx",
  "src/features/practice/TopicRoadmapScreen.tsx",
  "src/features/simulation/navigator/SimulationQuestionNavigator.tsx",
] as const;

function exactAbsoluteFillMigrationDiff(path: string): string {
  return `diff --git a/${path} b/${path}\n--- a/${path}\n+++ b/${path}\n@@ -1 +1 @@\n-  target: { ...StyleSheet.absoluteFillObject },\n+  target: { ...StyleSheet.absoluteFill },\n`;
}

function approvedDesignNeutralPlatformMigrationDiffs(): Readonly<Record<string, string>> {
  return Object.fromEntries(approvedDesignNeutralPlatformMigrationPaths.map((path) => [path, exactAbsoluteFillMigrationDiff(path)]));
}

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
    changedPaths: ["src/application/newBehavior.ts", ...contractCompanionPaths, "tests/contractChangeGate.test.ts"],
    canonicalContractDiff: requirementDiff,
    contract: contractWithGateEvidence(),
  });
  assert.deepEqual(validNonUiChange, []);
});

test("requires the canonical test, but not schema/parser churn, for requirement-only contract changes", () => {
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: [contractPath],
    canonicalContractDiff: requirementDiff,
    contract: loadCanonicalProductContract(),
  }), [
    "Canonical contract change requires tests/canonicalProductContract.test.ts to change.",
  ]);
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: [contractPath, "tests/canonicalProductContract.test.ts"],
    canonicalContractDiff: requirementDiff,
    contract: loadCanonicalProductContract(),
  }), []);
});

test("requires the canonical test, but not schema/parser churn, for existing-shape approved design reference records", () => {
  const designReferenceRecordDiff = [
    "+  references:",
    "+    - id: free-package-interactions",
    "+      screenStateTarget: free-package-practice",
    "+      patternPath: docs/designs/free-package-interactions/DESIGN.md",
    "+      version: 1",
    "+      approvalStatus: APPROVED",
    "+      owner: product-owner",
    "+  uiOwnership:",
    "+    - sourcePathPrefix: src/features/practice/",
    "+      designReferenceId: free-package-interactions",
  ].join("\n");
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: [contractPath],
    canonicalContractDiff: designReferenceRecordDiff,
    contract: loadCanonicalProductContract(),
  }), [
    "Canonical contract change requires tests/canonicalProductContract.test.ts to change.",
  ]);
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: [contractPath, "tests/canonicalProductContract.test.ts"],
    canonicalContractDiff: designReferenceRecordDiff,
    contract: loadCanonicalProductContract(),
  }), []);
});

test("does not classify a feature model as a render-owned UI path", () => {
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: ["src/features/home/tabs/progressTabModel.ts", ...contractCompanionPaths, "tests/contractChangeGate.test.ts"],
    canonicalContractDiff: requirementDiff,
    contract: contractWithGateEvidence(),
  }), []);
});

test("requires schema and parser companions for structural contract changes", () => {
  const structuralDiff = "+learningProducts:\n+  additionalAdmissionFact: required\n";
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: [contractPath, "tests/canonicalProductContract.test.ts"],
    canonicalContractDiff: structuralDiff,
    contract: loadCanonicalProductContract(),
  }), [
    "Canonical contract change requires docs/canonical-product-contract.schema.json to change.",
    "Canonical contract change requires scripts/validateCanonicalProductContract.ts to change.",
  ]);
});

test("requires an approved design reference only for UI behavior changes", () => {
  const withoutDesign = evaluateContractChangeGate({
    changedPaths: ["src/features/NewScreen.tsx", ...contractCompanionPaths, "tests/contractChangeGate.test.ts"],
    canonicalContractDiff: requirementDiff,
    contract: contractWithGateEvidence(),
  });
  assert.deepEqual(withoutDesign, ["UI change requires a Product Owner APPROVED design reference mapped to src/features/NewScreen.tsx."]);

  const unrelatedDesign = evaluateContractChangeGate({
    changedPaths: ["src/features/NewScreen.tsx", ...contractCompanionPaths, "tests/contractChangeGate.test.ts"],
    canonicalContractDiff: requirementDiff,
    contract: contractWithGateEvidence(true, "src/components/"),
  });
  assert.deepEqual(unrelatedDesign, ["UI change requires a Product Owner APPROVED design reference mapped to src/features/NewScreen.tsx."]);

  const withDesign = evaluateContractChangeGate({
    changedPaths: ["src/features/NewScreen.tsx", ...contractCompanionPaths, "tests/contractChangeGate.test.ts"],
    canonicalContractDiff: requirementDiff,
    contract: contractWithGateEvidence(true),
  });
  assert.deepEqual(withDesign, []);

  const codexApprovedContract = contractWithGateEvidence(true);
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: ["src/features/NewScreen.tsx", ...contractCompanionPaths, "tests/contractChangeGate.test.ts"],
    canonicalContractDiff: requirementDiff,
    contract: {
      ...codexApprovedContract,
      designReferences: {
        ...codexApprovedContract.designReferences,
        references: codexApprovedContract.designReferences.references.map((reference) => ({ ...reference, owner: "codex" })),
      },
    },
  }), ["UI change requires a Product Owner APPROVED design reference mapped to src/features/NewScreen.tsx."]);

  for (const [changedPath, sourcePathPrefix] of [
    ["src/assets/icons/home.svg", "src/assets/"],
    ["src/content/application/ContentPreparationGate.tsx", "src/content/application/ContentPreparationGate.tsx"],
  ] as const) {
    assert.deepEqual(evaluateContractChangeGate({
      changedPaths: [changedPath, ...contractCompanionPaths, "tests/contractChangeGate.test.ts"],
      canonicalContractDiff: requirementDiff,
      contract: contractWithGateEvidence(true, sourcePathPrefix),
    }), [], changedPath);
  }

  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: ["src/features/foobar/Screen.tsx", ...contractCompanionPaths, "tests/contractChangeGate.test.ts"],
    canonicalContractDiff: requirementDiff,
    contract: contractWithGateEvidence(true, "src/features/foo/"),
  }), ["UI change requires a Product Owner APPROVED design reference mapped to src/features/foobar/Screen.tsx."]);
});

test("accepts only the complete PO-057 design-neutral platform migration", () => {
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: approvedDesignNeutralPlatformMigrationPaths,
    canonicalContractDiff: "",
    contract: loadCanonicalProductContract(),
    commitIds: [approvedDesignNeutralPlatformMigrationCommit],
    sourceDiffs: approvedDesignNeutralPlatformMigrationDiffs(),
  }), []);

  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: approvedDesignNeutralPlatformMigrationPaths,
    canonicalContractDiff: "",
    contract: loadCanonicalProductContract(),
    commitIds: ["a5eb8ac"],
    sourceDiffs: approvedDesignNeutralPlatformMigrationDiffs(),
  }), [
    "Behavior change requires docs/canonical-product-contract.yaml to change.",
    "Behavior change requires at least one added canonical requirement ID.",
    `UI change requires a Product Owner APPROVED design reference mapped to ${approvedDesignNeutralPlatformMigrationPaths[0]}.`,
  ]);

  const incompletePaths = approvedDesignNeutralPlatformMigrationPaths.slice(0, -1);
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: incompletePaths,
    canonicalContractDiff: "",
    contract: loadCanonicalProductContract(),
    sourceDiffs: approvedDesignNeutralPlatformMigrationDiffs(),
  }), [
    "Behavior change requires docs/canonical-product-contract.yaml to change.",
    "Behavior change requires at least one added canonical requirement ID.",
    `UI change requires a Product Owner APPROVED design reference mapped to ${incompletePaths[0]}.`,
  ]);

  const arbitraryStyleChange = {
    ...approvedDesignNeutralPlatformMigrationDiffs(),
    [approvedDesignNeutralPlatformMigrationPaths[0]]: `${exactAbsoluteFillMigrationDiff(approvedDesignNeutralPlatformMigrationPaths[0])}+  unrelated: true\n`,
  };
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: approvedDesignNeutralPlatformMigrationPaths,
    canonicalContractDiff: "",
    contract: loadCanonicalProductContract(),
    sourceDiffs: arbitraryStyleChange,
  }), [
    "Behavior change requires docs/canonical-product-contract.yaml to change.",
    "Behavior change requires at least one added canonical requirement ID.",
    `UI change requires a Product Owner APPROVED design reference mapped to ${approvedDesignNeutralPlatformMigrationPaths[0]}.`,
  ]);

  const ordinaryUiChange = "src/features/NewScreen.tsx";
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: [...approvedDesignNeutralPlatformMigrationPaths, ordinaryUiChange],
    canonicalContractDiff: "",
    contract: loadCanonicalProductContract(),
    commitIds: [approvedDesignNeutralPlatformMigrationCommit],
    sourceDiffs: approvedDesignNeutralPlatformMigrationDiffs(),
  }), [
    "Behavior change requires docs/canonical-product-contract.yaml to change.",
    "Behavior change requires at least one added canonical requirement ID.",
    `UI change requires a Product Owner APPROVED design reference mapped to ${ordinaryUiChange}.`,
  ]);
});

test("accepts only documented design-neutral TRACK-01 identity maintenance", () => {
  const identityUiPath = "src/features/home/HomeScreen.tsx";
  const exactIdentityDiff = `diff --git a/${identityUiPath} b/${identityUiPath}\n--- a/${identityUiPath}\n+++ b/${identityUiPath}\n@@ -1 +1 @@\n-  const trackId = ALGORITHMS_TRACK_ID;\n+  const trackId = CODING_INTERVIEW_TRACK_ID;\n`;
  const changedPaths = [identityUiPath, ...trackIdentityRequiredPaths];

  assert.deepEqual(evaluateContractChangeGate({
    changedPaths,
    canonicalContractDiff: trackIdentityRequirementDiff,
    contract: loadCanonicalProductContract(),
    sourceDiffs: { [identityUiPath]: exactIdentityDiff },
  }), []);

  const exactHomePresentationDiff = `diff --git a/${identityUiPath} b/${identityUiPath}\n--- a/${identityUiPath}\n+++ b/${identityUiPath}\n@@ -1 +1 @@\n-  const unavailable = "Algorithms recommendation is unavailable.";\n+  const unavailable = "Coding Interview recommendation is unavailable.";\n@@ -4 +4 @@\n-  throw new Error("The active Algorithms session changed before it could be resumed.");\n+  throw new Error("The active Coding Interview session changed before it could be resumed.");\n`;
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths,
    canonicalContractDiff: trackIdentityRequirementDiff,
    contract: loadCanonicalProductContract(),
    sourceDiffs: { [identityUiPath]: exactHomePresentationDiff },
  }), []);

  const categoryPresentationPath = "src/features/home/SelectTrackScreen.tsx";
  const categoryPresentationDiff = `diff --git a/${categoryPresentationPath} b/${categoryPresentationPath}\n--- a/${categoryPresentationPath}\n+++ b/${categoryPresentationPath}\n@@ -1 +1 @@\n-  return track.categoryLabel;\n+  return track.shortTitle;\n`;
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: [categoryPresentationPath, ...trackIdentityRequiredPaths],
    canonicalContractDiff: trackIdentityRequirementDiff,
    contract: loadCanonicalProductContract(),
    sourceDiffs: { [categoryPresentationPath]: categoryPresentationDiff },
  }), []);

  const exactSeparatedSelectTrackDiff = `diff --git a/${categoryPresentationPath} b/${categoryPresentationPath}\n--- a/${categoryPresentationPath}\n+++ b/${categoryPresentationPath}\n@@ -1,3 +1,4 @@\n-  name={track.id === CLOUD_CERTIFICATION_TRACK_ID ? "cloud" : "route"}\n-  tone={track.id === CLOUD_CERTIFICATION_TRACK_ID ? "info" : "primary"}\n-  return track.categoryLabel;\n+  const isCertificationTrack = track.id === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID;\n+  name={isCertificationTrack ? "cloud" : "route"}\n+  tone={isCertificationTrack ? "info" : "primary"}\n+  return track.shortTitle;\n`;
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: [categoryPresentationPath, ...trackIdentityRequiredPaths],
    canonicalContractDiff: trackIdentityRequirementDiff,
    contract: loadCanonicalProductContract(),
    sourceDiffs: { [categoryPresentationPath]: exactSeparatedSelectTrackDiff },
  }), []);

  const changedIconSeparatedSelectTrackDiff = exactSeparatedSelectTrackDiff.replace('? "cloud" : "route"', '? "star" : "route"');
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: [categoryPresentationPath, ...trackIdentityRequiredPaths],
    canonicalContractDiff: trackIdentityRequirementDiff,
    contract: loadCanonicalProductContract(),
    sourceDiffs: { [categoryPresentationPath]: changedIconSeparatedSelectTrackDiff },
  }), [
    `UI change requires a Product Owner APPROVED design reference mapped to ${categoryPresentationPath}.`,
  ]);

  const progressPresentationPath = "src/features/home/tabs/ProgressTab.tsx";
  const exactSeparatedProgressDiff = `diff --git a/${progressPresentationPath} b/${progressPresentationPath}\n--- a/${progressPresentationPath}\n+++ b/${progressPresentationPath}\n@@ -1,2 +1,3 @@\n-  name={activeTrack.id === CLOUD_CERTIFICATION_TRACK_ID ? "cloud" : "route"}\n-  return "Start an Algorithms session to record local roadmap progress.";\n+  const isCertificationTrack = activeTrack.id === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID;\n+  name={isCertificationTrack ? "cloud" : "route"}\n+  return "Start a Coding Interview session to record local roadmap progress.";\n`;
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: [progressPresentationPath, ...trackIdentityRequiredPaths],
    canonicalContractDiff: trackIdentityRequirementDiff,
    contract: loadCanonicalProductContract(),
    sourceDiffs: { [progressPresentationPath]: exactSeparatedProgressDiff },
  }), []);

  const changedProgressIconDiff = exactSeparatedProgressDiff.replace('? "cloud" : "route"', '? "star" : "route"');
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: [progressPresentationPath, ...trackIdentityRequiredPaths],
    canonicalContractDiff: trackIdentityRequirementDiff,
    contract: loadCanonicalProductContract(),
    sourceDiffs: { [progressPresentationPath]: changedProgressIconDiff },
  }), [
    `UI change requires a Product Owner APPROVED design reference mapped to ${progressPresentationPath}.`,
  ]);

  const identityAndStyleDiff = `${exactIdentityDiff}@@ -4 +4 @@\n-  const cardOpacity = 0.8;\n+  const cardOpacity = 0.9;\n`;
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths,
    canonicalContractDiff: trackIdentityRequirementDiff,
    contract: loadCanonicalProductContract(),
    sourceDiffs: { [identityUiPath]: identityAndStyleDiff },
  }), []);

  const categoryOutsidePresentationPathDiff = `diff --git a/${identityUiPath} b/${identityUiPath}\n--- a/${identityUiPath}\n+++ b/${identityUiPath}\n@@ -1 +1 @@\n-  return track.categoryLabel;\n+  return track.shortTitle;\n`;
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths,
    canonicalContractDiff: trackIdentityRequirementDiff,
    contract: loadCanonicalProductContract(),
    sourceDiffs: { [identityUiPath]: categoryOutsidePresentationPathDiff },
  }), []);

  const arbitraryCopyDiff = `diff --git a/${identityUiPath} b/${identityUiPath}\n--- a/${identityUiPath}\n+++ b/${identityUiPath}\n@@ -1 +1 @@\n-  const unavailable = "Algorithms recommendation is unavailable.";\n+  const unavailable = "Coding Interview dashboard is unavailable.";\n`;
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths,
    canonicalContractDiff: trackIdentityRequirementDiff,
    contract: loadCanonicalProductContract(),
    sourceDiffs: { [identityUiPath]: arbitraryCopyDiff },
  }), []);

  const unrelatedUiPath = "src/features/NewTrackCard.tsx";
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: [...changedPaths, unrelatedUiPath],
    canonicalContractDiff: trackIdentityRequirementDiff,
    contract: loadCanonicalProductContract(),
    sourceDiffs: {
      [identityUiPath]: exactIdentityDiff,
      [unrelatedUiPath]: "+  return <NewTrackCard />;\n",
    },
  }), [
    `UI change requires a Product Owner APPROVED design reference mapped to ${unrelatedUiPath}.`,
  ]);

  const familyNavigationDiff = `diff --git a/${unrelatedUiPath} b/${unrelatedUiPath}\n--- a/${unrelatedUiPath}\n+++ b/${unrelatedUiPath}\n@@ -1 +1 @@\n-  navigation.navigate("algorithms");\n+  navigation.navigate("coding_interview");\n`;
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: [unrelatedUiPath, ...trackIdentityRequiredPaths],
    canonicalContractDiff: trackIdentityRequirementDiff,
    contract: loadCanonicalProductContract(),
    sourceDiffs: { [unrelatedUiPath]: familyNavigationDiff },
  }), [
    `UI change requires a Product Owner APPROVED design reference mapped to ${unrelatedUiPath}.`,
  ]);

  const iconCopyDiff = `diff --git a/${identityUiPath} b/${identityUiPath}\n--- a/${identityUiPath}\n+++ b/${identityUiPath}\n@@ -1 +1 @@\n-  return <Icon name="Algorithms" />;\n+  return <Icon name="Coding Interview" />;\n`;
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths,
    canonicalContractDiff: trackIdentityRequirementDiff,
    contract: loadCanonicalProductContract(),
    sourceDiffs: { [identityUiPath]: iconCopyDiff },
  }), []);

  const separatedResultPath = "src/features/exam/ResultScreen.tsx";
  const removedResultLine = 'export function ResultScreen() { const certification = result.trackId === "cloud-certification"; return <Button onPress={() => navigation.navigate(ROUTES.RESULT)}>{t("Done")}</Button>; }';
  const exactSeparatedResultDiff = `diff --git a/${separatedResultPath} b/${separatedResultPath}\n--- a/${separatedResultPath}\n+++ b/${separatedResultPath}\n@@ -1 +1,5 @@\n-${removedResultLine}\n+const GOOGLE_CLOUD_TRACK_ID = "google-cloud-associate-cloud-engineer";\n+export function ResultScreen() {\n+  const certification = result.trackId === GOOGLE_CLOUD_TRACK_ID;\n+  return <Button onPress={() => navigation.navigate(ROUTES.RESULT)}>{t("Done")}</Button>;\n+}\n`;
  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: [separatedResultPath, ...trackIdentityRequiredPaths],
    canonicalContractDiff: trackIdentityRequirementDiff,
    contract: loadCanonicalProductContract(),
    sourceDiffs: { [separatedResultPath]: exactSeparatedResultDiff },
  }), []);

  const contractWithResultDesign = loadCanonicalProductContract();
  const contractWithoutResultDesign: CanonicalProductContract = {
    ...contractWithResultDesign,
    designReferences: {
      ...contractWithResultDesign.designReferences,
      uiOwnership: contractWithResultDesign.designReferences.uiOwnership
        .filter((ownership) => ownership.sourcePathPrefix !== separatedResultPath),
    },
  };
  for (const unsafeAddedLine of [
    '  return <Button onPress={() => navigation.navigate(ROUTES.HOME)}>{t("Done")}</Button>;',
    '  return <Button onPress={() => navigation.navigate(ROUTES.RESULT)} style={styles.changed}>{t("Done")}</Button>;',
    '  return <Button onPress={() => navigation.navigate(ROUTES.RESULT)}>{t("Continue")}</Button>;',
  ]) {
    const unsafeSeparatedResultDiff = exactSeparatedResultDiff.replace(
      '  return <Button onPress={() => navigation.navigate(ROUTES.RESULT)}>{t("Done")}</Button>;',
      unsafeAddedLine,
    );
    assert.deepEqual(evaluateContractChangeGate({
      changedPaths: [separatedResultPath, ...trackIdentityRequiredPaths],
      canonicalContractDiff: trackIdentityRequirementDiff,
      contract: contractWithoutResultDesign,
      sourceDiffs: { [separatedResultPath]: unsafeSeparatedResultDiff },
    }), [
      `UI change requires a Product Owner APPROVED design reference mapped to ${separatedResultPath}.`,
    ], unsafeAddedLine);
  }
});

test("prefers a longer exact-file UI owner over a matching directory owner", () => {
  const contract = contractWithGateEvidence(true, "src/content/application/ContentPreparationGate.tsx");
  const exactReference = contract.designReferences.references[0]!;
  const contractWithCompetingOwners: CanonicalProductContract = {
    ...contract,
    designReferences: {
      references: [{
        id: "pending-directory-fixture",
        screenStateTarget: "pending-directory-screen",
        patternPath: "docs/designs/product-direction-options/DESIGN.md",
        version: 1,
        approvalStatus: "PENDING",
        owner: "product-owner",
      }, exactReference],
      uiOwnership: [{
        sourcePathPrefix: "src/content/application/",
        designReferenceId: "pending-directory-fixture",
      }, {
        sourcePathPrefix: "src/content/application/ContentPreparationGate.tsx",
        designReferenceId: exactReference.id,
      }],
      version: contract.designReferences.version,
    },
  };

  assert.deepEqual(evaluateContractChangeGate({
    changedPaths: ["src/content/application/ContentPreparationGate.tsx", ...contractCompanionPaths, "tests/contractChangeGate.test.ts"],
    canonicalContractDiff: requirementDiff,
    contract: contractWithCompetingOwners,
  }), []);
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
