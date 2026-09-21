import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { Question } from "../../content/canonical";
import { openCanonicalSourceLink, projectCanonicalSourceLinks } from "./canonicalSourceLinks";

function question(sourceRefs: readonly string[] | undefined, details: unknown): Question {
  return { questionId: "q", trackId: "t", nodeId: "n", mentalUnitId: "m", prompt: "Prompt", difficulty: null, ...(sourceRefs ? { sourceRefs } : {}), interaction: { type: "choice_single", scoringMethod: "exact_selected_set", options: [{ optionId: "a", text: "A" }, { optionId: "b", text: "B" }] }, answer: { type: "choice_single", optionId: "a" }, feedback: { type: "choice_single", reason: "Reason", details: details as never } };
}

test("projects exact HTTPS sources in authored order without normalizing query or hash", () => {
  const direct = "https://docs.example/path?raw=%2F#section";
  const detail = "https://other.example/exact";
  assert.deepEqual(projectCanonicalSourceLinks(question([direct, "registry-id", direct], { url: detail })), [
    { host: "docs.example", url: direct },
    { host: "other.example", url: detail },
  ]);
});

test("rejects non-HTTPS, malformed and missing sources without inventing a fallback", () => {
  assert.deepEqual(projectCanonicalSourceLinks(question(["http://unsafe.example", "registry-id", "not a URL"], { url: "file:///tmp/source" })), []);
  assert.deepEqual(projectCanonicalSourceLinks(question(undefined, { other: "value" })), []);
});

test("opens the exact projected URL and reports success or failure explicitly", async () => {
  const source = { host: "docs.example", url: "https://docs.example/path?raw=%2F#section" };
  const opened: string[] = [];
  assert.equal(await openCanonicalSourceLink(source, async (url) => { opened.push(url); }), "opened");
  assert.deepEqual(opened, [source.url]);
  assert.equal(await openCanonicalSourceLink(source, async () => { throw new Error("unavailable"); }), "failed");
});

test("projects the exact URL from an accepted certification artifact without changing the artifact", () => {
  const artifact = JSON.parse(readFileSync("src/content/generated/canonical-content/claude-certified-architect-professional-certification.json", "utf8")) as { questions: Question[] };
  const accepted = artifact.questions.find((candidate) => candidate.questionId === "CCARP-D01-O01-boundary");
  assert.ok(accepted);
  assert.deepEqual(projectCanonicalSourceLinks(accepted), [
    { host: "www.anthropic.com", url: "https://www.anthropic.com/engineering/building-effective-agents" },
  ]);
});
