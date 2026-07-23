import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { GENERATED_BUNDLED_CONTENT_RELEASE } from "../src/content/bundled/generatedArtifacts";

const EXAM_BLUEPRINT = Object.freeze({
  setup_environment: 12,
  planning_implementation: 15,
  access_security: 13,
  operations: 10,
} as const);
const EXAM_LENGTH = 50;
const CLOUD_TRACK_ID = "cloud-certification";
const CLOUD_CONTENT_VERSION = "gcp-ace-0001";
const CLOUD_CHECKSUM = "a52c7c85dd846b27af5fa5ce3bfccb80ae396745b75be5837f45e82822064f43";

type CloudDomain = keyof typeof EXAM_BLUEPRINT;
type CloudQuestion = Readonly<{
  id: string;
  domain: CloudDomain;
  type: "single" | "multiple";
  options: readonly (Readonly<{ id: string }>)[];
  correctOptionIds: readonly string[];
  tags: readonly string[];
}>;
type CloudArtifact = Readonly<{ contentVersion: string; bank: Readonly<{ items: readonly CloudQuestion[] }> }>;
export type GeneratedCloudExam = Readonly<{
  releaseId: string;
  trackId: typeof CLOUD_TRACK_ID;
  contentVersion: string;
  checksumSha256: string;
  itemCount: number;
  requestedLength: typeof EXAM_LENGTH;
  actualLength: typeof EXAM_LENGTH;
  selection: readonly (Readonly<{
    ordinal: number;
    itemId: string;
    domain: CloudDomain;
    tags: readonly string[];
    interactionType: "single" | "multiple";
    optionIds: readonly string[];
    selectedOptionIds: readonly string[];
    expectedResult: "correct" | "incorrect";
  }>)[];
}>;

export function generateCloudExam(): GeneratedCloudExam {
  const reference = GENERATED_BUNDLED_CONTENT_RELEASE.artifacts.find((artifact) => artifact.trackId === CLOUD_TRACK_ID);
  if (!reference) throw new Error("The pinned multi-track release has no Cloud Certification artifact.");
  if (reference.contentVersion !== CLOUD_CONTENT_VERSION || reference.checksumSha256 !== CLOUD_CHECKSUM) {
    throw new Error("The pinned Cloud artifact identity does not match the declared release contract.");
  }
  if (createHash("sha256").update(reference.artifactBytes).digest("hex") !== reference.checksumSha256) {
    throw new Error("The pinned Cloud artifact bytes do not match their declared checksum.");
  }
  const artifact = JSON.parse(reference.artifactBytes) as CloudArtifact;
  if (artifact.contentVersion !== reference.contentVersion || !Array.isArray(artifact.bank.items) || artifact.bank.items.length !== 360) {
    throw new Error("The pinned Cloud artifact must expose exactly 360 validated items.");
  }
  const itemIds = artifact.bank.items.map((item) => item.id);
  if (new Set(itemIds).size !== 360 || itemIds.some((id) => !/^ace-q-\d{4}$/.test(id))) {
    throw new Error("The pinned Cloud artifact has illegal or duplicate item identities.");
  }
  const selected = (Object.entries(EXAM_BLUEPRINT) as readonly [CloudDomain, number][]).flatMap(([domain, count]) =>
    artifact.bank.items.filter((item) => item.domain === domain).sort((left, right) => left.id.localeCompare(right.id)).slice(0, count),
  );
  if (selected.length !== EXAM_LENGTH || new Set(selected.map((item) => item.id)).size !== EXAM_LENGTH) {
    throw new Error("The Cloud Exam selection contract did not produce exactly 50 unique occurrences.");
  }
  const selection = selected.map((item, index) => {
    if (item.type !== "single" && item.type !== "multiple") throw new Error(`Cloud item ${item.id} has an unsupported interaction type.`);
    const optionIds = item.options.map((option) => option.id);
    if (!optionIds.length || new Set(optionIds).size !== optionIds.length || !item.correctOptionIds.length || item.correctOptionIds.some((id) => !optionIds.includes(id))) {
      throw new Error(`Cloud item ${item.id} has an invalid answer contract.`);
    }
    const expectedResult = index < 25 ? "correct" as const : "incorrect" as const;
    const selectedOptionIds = expectedResult === "correct"
      ? [...item.correctOptionIds]
      : [optionIds.find((id) => !item.correctOptionIds.includes(id)) ?? fail(`Cloud item ${item.id} has no explicitly incorrect legal answer.`)];
    return Object.freeze({ ordinal: index + 1, itemId: item.id, domain: item.domain, tags: Object.freeze([...item.tags]), interactionType: item.type, optionIds: Object.freeze(optionIds), selectedOptionIds: Object.freeze(selectedOptionIds), expectedResult });
  });
  if (selection.filter((item) => item.expectedResult === "correct").length < 20 || selection.filter((item) => item.expectedResult === "incorrect").length < 20) {
    throw new Error("The generated Cloud Exam does not cover the required correct and incorrect outcomes.");
  }
  return Object.freeze({ releaseId: GENERATED_BUNDLED_CONTENT_RELEASE.manifest.releaseId, trackId: CLOUD_TRACK_ID, contentVersion: reference.contentVersion, checksumSha256: reference.checksumSha256, itemCount: artifact.bank.items.length, requestedLength: EXAM_LENGTH, actualLength: EXAM_LENGTH, selection: Object.freeze(selection) });
}

export function renderCloudExamFlow(exam: GeneratedCloudExam, recoveryAfter?: number): string {
  if (recoveryAfter !== undefined && (!Number.isInteger(recoveryAfter) || recoveryAfter < 1 || recoveryAfter >= EXAM_LENGTH)) throw new Error("Cloud Exam recovery checkpoints must be between item 1 and item 49.");
  const session = "certification:cloud-exam-simulation:[0-9]+";
  const lines = [
    "appId: com.lkurczab.gcpacetrainer",
    "---",
    '- tapOn:', '    id: "main-tab-bar-practice"',
    '- tapOn:', '    id: "patternly:practice:mode-card:cloud-exam-simulation"',
    '- extendedWaitUntil:', '    visible:', `      id: "patternly:simulation:root:${session}"`, '    timeout: 10000',
  ];
  for (const item of exam.selection) {
    lines.push('- assertVisible:', `    id: "patternly:simulation:question:${item.itemId}"`);
    lines.push('- assertVisible:', `    id: "patternly:session:counter:${session}:ordinal:${item.ordinal}:length:50"`);
    for (const optionId of item.selectedOptionIds) lines.push('- tapOn:', `    id: "patternly:simulation:option:${item.itemId}:${optionId.toLowerCase()}"`);
    lines.push('- assertNotVisible:', `    id: "patternly:session:feedback:${item.itemId}"`);
    lines.push(`- takeScreenshot: c3-item-${String(item.ordinal).padStart(2, "0")}-${item.itemId}`);
    if (item.ordinal < EXAM_LENGTH) {
      lines.push('- tapOn:', `    id: "patternly:simulation:action:${session}:next"`);
      if (recoveryAfter === item.ordinal) {
        lines.push("- killApp", "- launchApp", '- tapOn:', '    id: "main-tab-bar-practice"', '- tapOn:', '    id: "patternly:practice:mode-card:cloud-exam-simulation"');
      }
    }
  }
  lines.push('- tapOn:', `    id: "patternly:simulation:action:${session}:finish"`, '- assertVisible: "Session complete"', '- tapOn: "Review answers"', '- assertVisible: "Back to practice"');
  return `${lines.join("\n")}\n`;
}

function fail(message: string): never { throw new Error(message); }

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function write(path: string, value: string) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, value, "utf8"); }

if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  const output = argument("--output");
  const expected = argument("--expected");
  if (!output || !expected) throw new Error("Usage: node --import tsx scripts/generateCloudExamMaestro.ts --output <flow.yaml> --expected <expected-cloud-exam.json> [--recovery-after <ordinal>]");
  const recoveryRaw = argument("--recovery-after");
  const recoveryAfter = recoveryRaw === undefined ? undefined : Number(recoveryRaw);
  const exam = generateCloudExam();
  write(resolve(output), renderCloudExamFlow(exam, recoveryAfter));
  write(resolve(expected), `${JSON.stringify({ ...exam, ...(recoveryAfter === undefined ? {} : { recoveryAfter }) }, null, 2)}\n`);
}
