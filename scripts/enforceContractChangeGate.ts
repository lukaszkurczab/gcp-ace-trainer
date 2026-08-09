import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import {
  loadCanonicalProductContract,
  type CanonicalProductContract,
} from "./validateCanonicalProductContract";

export type ContractChangeGateInput = Readonly<{
  changedPaths: readonly string[];
  canonicalContractDiff: string;
  contract: CanonicalProductContract;
  commitIds?: readonly string[];
  sourceDiffs?: Readonly<Record<string, string>>;
}>;

const uiRoots = [
  "src/assets/",
  "src/components/",
  "src/features/",
  "src/navigation/",
  "src/preferences/",
  "src/theme/",
] as const;

const canonicalContractPath = "docs/canonical-product-contract.yaml";
const canonicalContractCompanionPaths = [
  "docs/canonical-product-contract.schema.json",
  "scripts/validateCanonicalProductContract.ts",
  "tests/canonicalProductContract.test.ts",
] as const;

const productOwnerDecisionRegisterPath = "docs/product-owner-decision-register.md";
const productOwnerDesignNeutralPlatformMigrationDecision = "PO-057";
const productOwnerDesignNeutralPlatformMigrationCommit = "a5eb8ac14b3753bd443486d94853468183605ad7";
const approvedDesignNeutralPlatformMigrationPaths = [
  "src/components/SettingsBottomSheet.tsx",
  "src/components/SettingsDialog.tsx",
  "src/features/practice/PracticeSessionSurface.tsx",
  "src/features/practice/TopicRoadmapScreen.tsx",
  "src/features/simulation/navigator/SimulationQuestionNavigator.tsx",
] as const;

const trackIdentityCutoverRequirement = "TRACK-IDENTITY-CUTOVER-001";
const trackIdentityCutoverRequiredPaths = [
  canonicalContractPath,
  ...canonicalContractCompanionPaths,
  "integration/contracts/content-release/release.lock.json",
  "src/domain/tracks/trackRegistry.ts",
  "tests/storageCutover.test.ts",
] as const;
const trackIdentityCutoverPureRenamePairs = [
  ["src/features/algorithms/session/SessionShell.tsx", "src/features/coding-interview/session/SessionShell.tsx"],
  ["src/features/algorithms/session/sessionAccessibility.ts", "src/features/coding-interview/session/sessionAccessibility.ts"],
] as const;
const trackIdentityCutoverCopyPaths = new Set([
  "src/features/home/HomeScreen.tsx",
  "src/features/home/tabs/ProgressTab.tsx",
  "src/features/home/tabs/progressTabModel.ts",
  "src/features/practice/AlgorithmsScopeSelectionScreen.tsx",
  "src/features/practice/PracticeSessionScreen.tsx",
  "src/features/practice/practiceFlowModel.ts",
  "src/features/practice/practiceSetupModel.ts",
  "src/preferences/translations.ts",
]);
const trackIdentityCutoverCategoryPresentationPath = "src/features/home/SelectTrackScreen.tsx";
const trackIdentityCutoverTranslationAdditions = new Set([
  '  "Coding Interview": "Rozmowa techniczna",',
  '  "Coding Interview: DSA & Problem Solving": "Rozmowa techniczna: DSA i rozwiązywanie problemów",',
]);
const trackIdentityCutoverSeparatedResultPath = "src/features/exam/ResultScreen.tsx";
const trackIdentityCutoverSeparatedResultConst = "GOOGLE_CLOUD_TRACK_ID";
const trackIdentityCutoverSeparatedSelectTrackPath = "src/features/home/SelectTrackScreen.tsx";
const trackIdentityCutoverBooleanSeparations = new Map<string, Readonly<{ constName: string; expression: string; oldExpression: string }>>([
  [trackIdentityCutoverSeparatedSelectTrackPath, {
    constName: "isCertificationTrack",
    expression: "track.id===GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID",
    oldExpression: "track.id===CLOUD_CERTIFICATION_TRACK_ID",
  }],
  ["src/features/home/tabs/HomeTab.tsx", {
    constName: "isCodingInterviewTrack",
    expression: 'activeTrack.id==="coding-interview-dsa-problem-solving"',
    oldExpression: 'activeTrack.id==="algorithms"',
  }],
  ["src/features/home/tabs/ProgressTab.tsx", {
    constName: "isCertificationTrack",
    expression: "activeTrack.id===GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID",
    oldExpression: "activeTrack.id===CLOUD_CERTIFICATION_TRACK_ID",
  }],
  ["src/features/practice/AlgorithmsScopeSelectionScreen.tsx", {
    constName: "codingInterviewTrackId",
    expression: "CODING_INTERVIEW_TRACK_ID",
    oldExpression: "ALGORITHMS_TRACK_ID",
  }],
  ["src/features/practice/PracticeHubScreen.tsx", {
    constName: "isCodingInterviewTrack",
    expression: 'activeTrack.id==="coding-interview-dsa-problem-solving"',
    oldExpression: 'activeTrack.id==="algorithms"',
  }],
  ["src/features/practice/PracticeSessionScreen.tsx", {
    constName: "certificationUnavailableDescription",
    expression: '"Certification has no approved bundled artifact yet. Coding Interview sessions remain available."',
    oldExpression: '"Certification has no approved bundled artifact yet. Algorithms sessions remain available."',
  }],
]);
const trackIdentityCutoverTechnicalPaths = new Set([
  "src/features/analytics/analyticsService.ts",
  "src/features/exam/ResultScreen.tsx",
  "src/features/home/HomeScreen.tsx",
  "src/features/home/SelectTrackScreen.tsx",
  "src/features/home/tabs/HomeTab.tsx",
  "src/features/home/tabs/ProgressTab.tsx",
  "src/features/home/tabs/homeTabModel.ts",
  "src/features/home/tabs/progressTabModel.ts",
  "src/features/practice/AlgorithmsPracticeSummaryScreen.tsx",
  "src/features/practice/AlgorithmsScopeSelectionScreen.tsx",
  "src/features/practice/CertificationPracticeSessionScreen.tsx",
  "src/features/practice/PracticeHubScreen.tsx",
  "src/features/practice/PracticeResponseControls.tsx",
  "src/features/practice/PracticeSessionScreen.tsx",
  "src/features/practice/PracticeSessionSurface.tsx",
  "src/features/practice/PracticeSetupScreen.tsx",
  "src/features/practice/TopicRoadmapScreen.tsx",
  "src/features/practice/practiceFlowModel.ts",
  "src/features/practice/practiceSetupModel.ts",
  "src/features/practice/sessionConfig.ts",
  "src/features/review/AnswerReviewScreen.tsx",
  "src/features/review/reviewQueueModel.ts",
  "src/features/simulation/AlgorithmsInterviewSimulationResultScreen.tsx",
  "src/features/simulation/AlgorithmsInterviewSimulationScreen.tsx",
  "src/features/simulation/SimulationSessionSurface.tsx",
  "src/features/simulation/simulationProjection.ts",
  "src/navigation/types.ts",
  "src/preferences/translations.ts",
]);
const trackIdentityCutoverTechnicalSubstitutions = [
  ["/tracks/cloud-certification", "/tracks/certification"],
  ["/tracks/algorithms", "/tracks/coding-interview"],
  ["/application/algorithms", "/application/coding-interview"],
  ["/features/algorithms", "/features/coding-interview"],
  ["../algorithms/", "../coding-interview/"],
  ["AlgorithmsFamilyRuntime", "CodingInterviewFamilyRuntime"],
  ["createAlgorithmsFamilyRuntime", "createCodingInterviewFamilyRuntime"],
  ["createAlgorithmsRuntime", "createCodingInterviewRuntime"],
  ["AlgorithmsDashboard", "CodingInterviewDashboard"],
  ["loadAlgorithmsDashboard", "loadCodingInterviewDashboard"],
  ["getAlgorithmsDeclaredScopeOptions", "getCodingInterviewDeclaredScopeOptions"],
  ["algorithmsDeclaredScope", "codingInterviewDeclaredScope"],
  ["algorithmsSessionFacade", "codingInterviewSessionFacade"],
  ["algorithmsContentFamilyHandler", "codingInterviewContentFamilyHandler"],
  ["ALGORITHMS_TRACK_ID", "CODING_INTERVIEW_TRACK_ID"],
  ["CLOUD_CERTIFICATION_TRACK_ID", "GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID"],
  ['"algorithms-interview-simulation"', '"coding-interview-simulation"'],
  ['"algorithms-custom-practice"', '"coding-interview-custom-practice"'],
  ['"cloud-certification"', '"google-cloud-associate-cloud-engineer"'],
  ["'cloud-certification'", "'google-cloud-associate-cloud-engineer'"],
] as const;

function isExactAbsoluteFillMigration(diff: string | undefined): boolean {
  if (!diff) return false;
  const changedLines = diff.split("\n").filter((line) =>
    (line.startsWith("+") && !line.startsWith("+++")) || (line.startsWith("-") && !line.startsWith("---")),
  );
  if (changedLines.length !== 2) return false;
  const removed = changedLines.find((line) => line.startsWith("-"));
  const added = changedLines.find((line) => line.startsWith("+"));
  return Boolean(removed && added
    && removed.includes("StyleSheet.absoluteFillObject")
    && !removed.includes("StyleSheet.absoluteFillObject", removed.indexOf("StyleSheet.absoluteFillObject") + 1)
    && added === removed
      .replace(/^-/, "+")
      .replace("StyleSheet.absoluteFillObject", "StyleSheet.absoluteFill"));
}

/**
 * PO-057 is a closed historical exception for the React Native 0.86 API removal.
 * It deliberately recognizes only the complete, exact five-file token migration.
 */
function approvedDesignNeutralPlatformMigrationPathsFor(input: ContractChangeGateInput): ReadonlySet<string> {
  const decisionIsDocumented = readFileSync(productOwnerDecisionRegisterPath, "utf8").includes(
    `## ${productOwnerDesignNeutralPlatformMigrationDecision} —`,
  );
  const isExactHistoricalCommit = input.commitIds?.length === 1
    && input.commitIds[0] === productOwnerDesignNeutralPlatformMigrationCommit;
  if (!decisionIsDocumented || !isExactHistoricalCommit || !input.sourceDiffs) return new Set();

  const matchesCompleteApprovedMigration = approvedDesignNeutralPlatformMigrationPaths.every((path) =>
    input.changedPaths.includes(path) && isExactAbsoluteFillMigration(input.sourceDiffs![path]),
  );
  return matchesCompleteApprovedMigration ? new Set(approvedDesignNeutralPlatformMigrationPaths) : new Set();
}

function isForbiddenTrackIdentityLine(line: string): boolean {
  return line.includes("navigation.navigate") || /<Icon\w*\b/.test(line) || /\bname\s*=/.test(line);
}

function normalizeAllowedTrackIdentityTokens(path: string, line: string): string {
  if (!trackIdentityCutoverTechnicalPaths.has(path)) return line;
  let normalized = line;
  for (const [oldToken, newToken] of trackIdentityCutoverTechnicalSubstitutions) {
    normalized = normalized.replaceAll(oldToken, newToken);
  }
  if (path === "src/features/practice/practiceFlowModel.ts"
    && (/kind: "algorithms"/.test(normalized) || /case "algorithms"/.test(normalized) || /return "algorithms"/.test(normalized))) {
    return normalized.replaceAll('"algorithms"', '"coding_interview"');
  }
  return normalized
    .replaceAll('"algorithms"', '"coding-interview-dsa-problem-solving"')
    .replaceAll("'algorithms'", "'coding-interview-dsa-problem-solving'");
}

function normalizeTrackIdentityLine(path: string, line: string): string {
  return isForbiddenTrackIdentityLine(line) ? line : normalizeAllowedTrackIdentityTokens(path, line);
}

function normalizeCanonicalTrackNameInStringLiterals(line: string): string {
  let normalized = "";
  let quote: '"' | "'" | "`" | null = null;
  let literal = "";
  let escaped = false;
  for (const character of line) {
    if (quote === null) {
      normalized += character;
      if (character === '"' || character === "'" || character === "`") {
        quote = character;
      }
      continue;
    }
    if (escaped) {
      literal += character;
      escaped = false;
      continue;
    }
    if (character === "\\") {
      literal += character;
      escaped = true;
      continue;
    }
    if (character !== quote) {
      literal += character;
      continue;
    }
    normalized += literal
      .replaceAll("an Algorithms", "a Coding Interview")
      .replaceAll("Algorithms", "Coding Interview");
    normalized += character;
    quote = null;
    literal = "";
  }
  if (quote !== null) return line;
  return normalized;
}

function stripWhitespaceOutsideStringLiterals(source: string): string {
  let normalized = "";
  let quote: '"' | "'" | "`" | null = null;
  let escaped = false;
  for (const character of source) {
    if (quote === null) {
      if (/\s/.test(character)) continue;
      normalized += character;
      if (character === '"' || character === "'" || character === "`") quote = character;
      continue;
    }
    normalized += character;
    if (escaped) {
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === quote) {
      quote = null;
    }
  }
  return quote === null ? normalized : source;
}

function isExactResultScreenTrackIdSeparation(diff: string): boolean {
  const removed = diff.split("\n")
    .filter((line) => line.startsWith("-") && !line.startsWith("---"))
    .map((line) => line.slice(1))
    .join("\n");
  const added = diff.split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.slice(1))
    .join("\n");
  const oldLiteral = '"cloud-certification"';
  const newLiteral = '"google-cloud-associate-cloud-engineer"';
  const compactRemoved = stripWhitespaceOutsideStringLiterals(removed);
  let compactAdded = stripWhitespaceOutsideStringLiterals(added);
  const declaration = `const${trackIdentityCutoverSeparatedResultConst}=${newLiteral};`;
  if (compactRemoved.split(oldLiteral).length !== 2 || compactAdded.split(declaration).length !== 2) return false;
  compactAdded = compactAdded.replace(declaration, "");
  return compactRemoved.replace(oldLiteral, "__CANONICAL_TRACK_ID__")
    === compactAdded.replace(trackIdentityCutoverSeparatedResultConst, "__CANONICAL_TRACK_ID__");
}

function normalizeAllSanctionedTrackIdentityTokens(path: string, line: string): string {
  let normalized = normalizeAllowedTrackIdentityTokens(path, line);
  if (path === trackIdentityCutoverCategoryPresentationPath) {
    normalized = normalized.replaceAll("track.categoryLabel", "track.shortTitle");
  }
  return trackIdentityCutoverCopyPaths.has(path)
    ? normalizeCanonicalTrackNameInStringLiterals(normalized)
    : normalized;
}

function isExactBooleanTrackIdentitySeparation(path: string, diff: string): boolean {
  const separation = trackIdentityCutoverBooleanSeparations.get(path);
  if (!separation) return false;
  const removedLines = diff.split("\n")
    .filter((line) => line.startsWith("-") && !line.startsWith("---"))
    .map((line) => line.slice(1));
  const addedLines = diff.split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.slice(1));
  const forbiddenRemoved = removedLines.filter(isForbiddenTrackIdentityLine);
  const forbiddenAdded = addedLines.filter(isForbiddenTrackIdentityLine);
  if (forbiddenRemoved.length !== forbiddenAdded.length || forbiddenRemoved.some((line, index) =>
    stripWhitespaceOutsideStringLiterals(line)
      !== stripWhitespaceOutsideStringLiterals(forbiddenAdded[index]!.replaceAll(separation.constName, separation.oldExpression)),
  )) return false;
  const removed = removedLines
    .filter((line) => !isForbiddenTrackIdentityLine(line))
    .map((line) => normalizeAllSanctionedTrackIdentityTokens(path, line))
    .join("\n");
  const added = addedLines
    .filter((line) => !isForbiddenTrackIdentityLine(line))
    .map((line) => normalizeAllSanctionedTrackIdentityTokens(path, line))
    .join("\n");
  const declaration = `const${separation.constName}=${separation.expression};`;
  const compactRemoved = stripWhitespaceOutsideStringLiterals(removed);
  let compactAdded = stripWhitespaceOutsideStringLiterals(added);
  if (compactAdded.split(declaration).length !== 2) return false;
  compactAdded = compactAdded.replace(declaration, "").replaceAll(separation.constName, separation.expression);
  return compactRemoved === compactAdded;
}

function normalizeTrackIdentityMaintenanceLine(path: string, line: string): string {
  let normalized = normalizeTrackIdentityLine(path, line);
  if (isForbiddenTrackIdentityLine(line)) return normalized;
  if (path === trackIdentityCutoverCategoryPresentationPath) {
    normalized = normalized.replaceAll("track.categoryLabel", "track.shortTitle");
  }
  return trackIdentityCutoverCopyPaths.has(path)
    ? normalizeCanonicalTrackNameInStringLiterals(normalized)
    : normalized;
}

function isExactTrackIdentityMaintenanceDiff(path: string, diff: string | undefined): boolean {
  if (!diff) return false;
  if (path === trackIdentityCutoverSeparatedResultPath && isExactResultScreenTrackIdSeparation(diff)) return true;
  if (isExactBooleanTrackIdentitySeparation(path, diff)) return true;
  const changedLines = diff.split("\n").filter((line) =>
    (line.startsWith("+") && !line.startsWith("+++")) || (line.startsWith("-") && !line.startsWith("---")),
  ).filter((line) => !(path === "src/preferences/translations.ts"
    && line.startsWith("+")
    && trackIdentityCutoverTranslationAdditions.has(line.slice(1))));
  if (changedLines.length === 0) return false;
  const removed = changedLines.filter((line) => line.startsWith("-")).map((line) => normalizeTrackIdentityMaintenanceLine(path, line.slice(1))).sort();
  const added = changedLines.filter((line) => line.startsWith("+")).map((line) => normalizeTrackIdentityMaintenanceLine(path, line.slice(1))).sort();
  return removed.length === added.length && removed.every((line, index) => line === added[index]);
}

function isExactPureRenamePair(input: ContractChangeGateInput, oldPath: string, newPath: string): boolean {
  if (!input.changedPaths.includes(oldPath) || !input.changedPaths.includes(newPath)) return false;
  const oldDiff = input.sourceDiffs?.[oldPath];
  const newDiff = input.sourceDiffs?.[newPath];
  if (!oldDiff || !newDiff) return false;
  const removed = oldDiff.split("\n")
    .filter((line) => line.startsWith("-") && !line.startsWith("---"))
    .map((line) => line.slice(1));
  const oldAdded = oldDiff.split("\n").filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const added = newDiff.split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.slice(1));
  const newRemoved = newDiff.split("\n").filter((line) => line.startsWith("-") && !line.startsWith("---"));
  return oldAdded.length === 0 && newRemoved.length === 0
    && removed.length > 0 && removed.length === added.length
    && removed.every((line, index) => line === added[index]);
}

/** Closed TRACK-01 maintenance classification: identities/copy labels only, with no new UI or structural diff. */
function approvedTrackIdentityMaintenancePathsFor(input: ContractChangeGateInput): ReadonlySet<string> {
  const isDocumentedCutover = input.canonicalContractDiff.includes(`+  - id: ${trackIdentityCutoverRequirement}`)
    && trackIdentityCutoverRequiredPaths.every((path) => input.changedPaths.includes(path));
  if (!isDocumentedCutover || !input.sourceDiffs) return new Set();
  const approvedPaths = new Set(input.changedPaths.filter((path) =>
    isUiPath(path) && isExactTrackIdentityMaintenanceDiff(path, input.sourceDiffs![path]),
  ));
  for (const [oldPath, newPath] of trackIdentityCutoverPureRenamePairs) {
    if (isExactPureRenamePair(input, oldPath, newPath)) {
      approvedPaths.add(oldPath);
      approvedPaths.add(newPath);
    }
  }
  return approvedPaths;
}

function isBehaviorPath(path: string): boolean {
  return path.startsWith("src/")
    && !path.startsWith("src/testing/")
    && !path.startsWith("src/types/")
    && !path.endsWith(".d.ts");
}

function isUiPath(path: string): boolean {
  return path.endsWith(".tsx") || uiRoots.some((root) => path.startsWith(root));
}

function matchesUiOwnership(changedPath: string, sourcePathPrefix: string): boolean {
  return sourcePathPrefix.endsWith("/")
    ? changedPath.startsWith(sourcePathPrefix)
    : changedPath === sourcePathPrefix;
}

function addedRequirementIds(diff: string): readonly string[] {
  return [...diff.matchAll(/^\+\s*-\s+id:\s*([A-Z][A-Z0-9-]*[A-Z0-9])\s*$/gm)].map((match) => match[1]!);
}

/**
 * Rejects behavior changes that do not add a contract requirement with a changed
 * mapped test. UI changes additionally require an approved design reference.
 */
export function evaluateContractChangeGate(input: ContractChangeGateInput): readonly string[] {
  const approvedMaintenancePaths = new Set([
    ...approvedDesignNeutralPlatformMigrationPathsFor(input),
    ...approvedTrackIdentityMaintenancePathsFor(input),
  ]);
  const behaviorChanged = input.changedPaths.some((path) => isBehaviorPath(path) && !approvedMaintenancePaths.has(path));
  const errors: string[] = [];
  if (input.changedPaths.includes(canonicalContractPath)) {
    for (const companionPath of canonicalContractCompanionPaths) {
      if (!input.changedPaths.includes(companionPath)) {
        errors.push(`Canonical contract change requires ${companionPath} to change.`);
      }
    }
  }
  if (!behaviorChanged) return errors;

  if (!input.changedPaths.includes(canonicalContractPath)) {
    errors.push("Behavior change requires docs/canonical-product-contract.yaml to change.");
  }

  const requirementIds = addedRequirementIds(input.canonicalContractDiff);
  if (requirementIds.length === 0) {
    errors.push("Behavior change requires at least one added canonical requirement ID.");
  }

  for (const requirementId of requirementIds) {
    const mappedTests = input.contract.requirementTestCoverage.tests.filter((test) => test.requirementIds.includes(requirementId));
    if (mappedTests.length === 0) {
      errors.push(`Added requirement ${requirementId} has no mapped canonical test.`);
      continue;
    }
    if (!mappedTests.some((test) => input.changedPaths.includes(test.testPath))) {
      errors.push(`Added requirement ${requirementId} requires a change to one of its mapped test files.`);
    }
  }

  for (const changedPath of input.changedPaths.filter((path) => isUiPath(path) && !approvedMaintenancePaths.has(path))) {
    const mappedReference = input.contract.designReferences.uiOwnership
      .filter((ownership) => matchesUiOwnership(changedPath, ownership.sourcePathPrefix))
      .sort((left, right) => right.sourcePathPrefix.length - left.sourcePathPrefix.length)[0];
    const reference = mappedReference && input.contract.designReferences.references.find((candidate) => candidate.id === mappedReference.designReferenceId);
    if (!reference || reference.approvalStatus !== "APPROVED" || reference.owner !== "product-owner") {
      errors.push(`UI change requires a Product Owner APPROVED design reference mapped to ${changedPath}.`);
      break;
    }
  }

  return errors;
}

function git(args: readonly string[]): string {
  return execFileSync("git", args, { encoding: "utf8" });
}

export function changedPathsFromNameStatus(output: string): readonly string[] {
  const paths = new Set<string>();
  for (const line of output.trim().split("\n").filter(Boolean)) {
    const [status, firstPath, secondPath] = line.split("\t");
    if (!status || !firstPath) continue;
    paths.add(firstPath);
    if (secondPath) paths.add(secondPath);
  }
  return [...paths];
}

function main(): void {
  const range = process.argv[2] ?? "--staged";
  const staged = range === "--staged";
  const diffPrefix = staged ? ["diff", "--cached"] : ["diff", range];
  const changedPaths = changedPathsFromNameStatus(git([...diffPrefix, "--name-status", "--find-renames"]));
  const canonicalContractDiff = git([...diffPrefix, "--unified=0", "--", canonicalContractPath]);
  const commitIds = staged
    ? []
    : git(["rev-list", "--reverse", range]).trim().split("\n").filter(Boolean);
  const sourceDiffPaths = new Set([...approvedDesignNeutralPlatformMigrationPaths, ...changedPaths.filter(isUiPath)]);
  const sourceDiffs = Object.fromEntries([...sourceDiffPaths].map((path) => [path, git([...diffPrefix, "--unified=0", "--", path])]));
  const errors = evaluateContractChangeGate({ changedPaths, canonicalContractDiff, contract: loadCanonicalProductContract(), commitIds, sourceDiffs });

  if (errors.length > 0) {
    console.error("CONTRACT_CHANGE_GATE=failed");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log("CONTRACT_CHANGE_GATE=passed");
  console.log(`CONTRACT_CHANGE_CHANGED_PATHS=${changedPaths.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
