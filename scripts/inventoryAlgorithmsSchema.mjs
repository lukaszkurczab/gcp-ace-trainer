import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repositoryRoot = process.cwd();
const itemsRoot = path.join(repositoryRoot, "src/tracks/algorithms/content/items");

function relative(file) {
  return path.relative(repositoryRoot, file).split(path.sep).join("/");
}

function isQuestion(value) {
  return value && typeof value === "object" && typeof value.id === "string" && typeof value.prompt === "string";
}

async function importModule(file) {
  return import(pathToFileURL(file).href);
}

async function sourceFilesByItemId() {
  const result = new Map();
  const files = readdirSync(itemsRoot, { recursive: true })
    .filter((entry) => typeof entry === "string" && entry.endsWith(".ts") && !entry.endsWith("index.ts"));

  for (const entry of files) {
    const file = path.join(itemsRoot, entry);
    const module = await importModule(file);
    for (const value of Object.values(module)) {
      if (!Array.isArray(value)) continue;
      for (const question of value) {
        if (isQuestion(question)) result.set(question.id, relative(file));
      }
    }
  }

  const mixedFile = path.join(itemsRoot, "mixed-pattern-practice/questions.json");
  if (existsSync(mixedFile)) {
    for (const question of JSON.parse(readFileSync(mixedFile, "utf8"))) {
      if (isQuestion(question)) result.set(question.id, relative(mixedFile));
    }
  }
  return result;
}

async function activeItems() {
  const questions = [];
  const directories = readdirSync(itemsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  for (const directory of directories) {
    const indexFile = path.join(itemsRoot, directory.name, "index.ts");
    let values;
    try {
      values = Object.values(await importModule(indexFile));
    } catch (error) {
      if (directory.name !== "mixed-pattern-practice") throw error;
      values = [JSON.parse(readFileSync(path.join(itemsRoot, directory.name, "questions.json"), "utf8"))];
    }
    const group = values.find((value) => Array.isArray(value) && value.every(isQuestion));
    if (!group) throw new Error(`No Algorithms question array exported from ${relative(indexFile)}.`);
    questions.push(...group);
  }
  return questions;
}

function shapeOf(question) {
  if (Array.isArray(question.options) && question.options.every((option) => typeof option.isCorrect === "boolean")) {
    return "rootChoiceIsCorrect";
  }
  if (typeof question.correctOptionId === "string") return "rootChoiceCorrectOptionId";
  if (question.responseSpec) return "responseSpecChoice";
  if (Array.isArray(question.staticMicroChecks)) return "nestedStaticMicroChecks";
  if (Array.isArray(question.subgoals) && Array.isArray(question.correctOrder)) return "rootOrdering";
  if (question.correctComplexity) return "rootComplexity";
  return "unknownOrUnsupported";
}

const idsToFiles = await sourceFilesByItemId();
const questions = await activeItems();
const shapeNames = [
  "rootChoiceIsCorrect",
  "rootChoiceCorrectOptionId",
  "nestedStaticMicroChecks",
  "responseSpecChoice",
  "rootOrdering",
  "rootComplexity",
  "unknownOrUnsupported",
];
const filesByShape = Object.fromEntries(shapeNames.map((shape) => [shape, new Set()]));
const counts = Object.fromEntries(shapeNames.map((shape) => [shape, 0]));

for (const question of questions) {
  const shape = shapeOf(question);
  counts[shape] += 1;
  const sourceId = question.id.endsWith("-check") ? question.id.slice(0, -6) : question.id;
  const file = idsToFiles.get(question.id) ?? idsToFiles.get(sourceId);
  if (!file) throw new Error(`Source file not found for ${question.id}.`);
  filesByShape[shape].add(file);
}

const report = {
  sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  generatedAt: new Date().toISOString(),
  totalActiveItems: questions.length,
  ...counts,
  filesByShape: Object.fromEntries(
    Object.entries(filesByShape).map(([shape, files]) => [shape, [...files].sort()]),
  ),
};

const output = `${JSON.stringify(report, null, 2)}\n`;
const outputFlag = process.argv.indexOf("--write");
if (outputFlag >= 0) {
  const outputFile = process.argv[outputFlag + 1];
  if (!outputFile) throw new Error("--write requires a repository-relative output path.");
  writeFileSync(path.resolve(repositoryRoot, outputFile), output);
} else {
  process.stdout.write(output);
}
