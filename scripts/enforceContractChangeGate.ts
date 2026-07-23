import { execFileSync } from "node:child_process";

import {
  loadCanonicalProductContract,
  type CanonicalProductContract,
} from "./validateCanonicalProductContract";

export type ContractChangeGateInput = Readonly<{
  changedPaths: readonly string[];
  canonicalContractDiff: string;
  contract: CanonicalProductContract;
}>;

const uiRoots = [
  "src/assets/",
  "src/components/",
  "src/content/application/",
  "src/features/",
  "src/navigation/",
  "src/preferences/",
  "src/theme/",
] as const;

const canonicalContractPath = "docs/canonical-product-contract.yaml";

function isBehaviorPath(path: string): boolean {
  return path.startsWith("src/")
    && !path.startsWith("src/testing/")
    && !path.startsWith("src/types/")
    && !path.endsWith(".d.ts");
}

function isUiPath(path: string): boolean {
  return path.endsWith(".tsx") || uiRoots.some((root) => path.startsWith(root));
}

function addedRequirementIds(diff: string): readonly string[] {
  return [...diff.matchAll(/^\+\s*-\s+id:\s*([A-Z][A-Z0-9-]*[A-Z0-9])\s*$/gm)].map((match) => match[1]!);
}

/**
 * Rejects behavior changes that do not add a contract requirement with a changed
 * mapped test. UI changes additionally require an approved design reference.
 */
export function evaluateContractChangeGate(input: ContractChangeGateInput): readonly string[] {
  const behaviorChanged = input.changedPaths.some(isBehaviorPath);
  if (!behaviorChanged) return [];

  const errors: string[] = [];
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

  for (const changedPath of input.changedPaths.filter(isUiPath)) {
    const mappedReference = input.contract.designReferences.uiOwnership
      .filter((ownership) => changedPath.startsWith(ownership.sourcePathPrefix))
      .sort((left, right) => right.sourcePathPrefix.length - left.sourcePathPrefix.length)[0];
    const reference = mappedReference && input.contract.designReferences.references.find((candidate) => candidate.id === mappedReference.designReferenceId);
    if (!reference || reference.approvalStatus !== "APPROVED") {
      errors.push(`UI change requires an APPROVED design reference mapped to ${changedPath}.`);
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
  const errors = evaluateContractChangeGate({ changedPaths, canonicalContractDiff, contract: loadCanonicalProductContract() });

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
