import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { Question } from "../../content/canonical";
import { openCanonicalSourceLink, projectCanonicalSourceLinks } from "./canonicalSourceLinks";

function question(sourceRefs: readonly string[] | undefined, details: unknown, course?: Question["feedback"]["course"]): Question {
  return { questionId: "q", trackId: "t", nodeId: "n", mentalUnitId: "m", prompt: "Prompt", difficulty: null, ...(sourceRefs ? { sourceRefs } : {}), interaction: { type: "choice_single", scoringMethod: "exact_selected_set", options: [{ optionId: "a", text: "A" }, { optionId: "b", text: "B" }] }, answer: { type: "choice_single", optionId: "a" }, feedback: { type: "choice_single", reason: "Reason", details: details as never, ...(course ? { course } : {}) } };
}

test("projects exact HTTPS sources in authored order without normalizing query or hash", () => {
  const direct = "https://docs.example/path?raw=%2F#section";
  const detail = "https://other.example/exact";
  assert.deepEqual(projectCanonicalSourceLinks(question([direct, "registry-id", direct], { url: detail })), [
    { host: "docs.example", url: direct, role: "documentation" },
    { host: "other.example", url: detail, role: "documentation" },
  ]);
});

test("course-backed questions project exactly documentation first and the titled account-gated lesson second", () => {
  const documentationUrl = "https://docs.example/official-guide";
  const courseUrl = "https://anthropic-partners.skilljar.com/lesson/agent-design";
  const projected = projectCanonicalSourceLinks(question(
    ["https://docs.example/extra-ref", documentationUrl],
    { url: documentationUrl, mechanism: "authoritative source" },
    { title: "Claude Certified Architect – Professional", url: courseUrl, section: "Module 2 · Tool use", requiresAccount: true },
  ));
  assert.deepEqual(projected, [
    { host: "docs.example", url: documentationUrl, role: "documentation" },
    { host: "anthropic-partners.skilljar.com", url: courseUrl, role: "course", title: "Claude Certified Architect – Professional", section: "Module 2 · Tool use", requiresAccount: true },
  ]);
});

test("same-URL documentation and course links remain distinct source roles", () => {
  const sharedUrl = "https://anthropic-partners.skilljar.com/lesson/agent-design";
  assert.deepEqual(projectCanonicalSourceLinks(question(undefined, { url: sharedUrl }, {
    title: "Claude Certified Architect – Professional",
    url: sharedUrl,
    section: "Module 2 · Tool use",
    requiresAccount: true,
  })), [
    { host: "anthropic-partners.skilljar.com", url: sharedUrl, role: "documentation" },
    { host: "anthropic-partners.skilljar.com", url: sharedUrl, role: "course", title: "Claude Certified Architect – Professional", section: "Module 2 · Tool use", requiresAccount: true },
  ]);
});

test("rejects non-HTTPS, malformed and missing sources without inventing a fallback", () => {
  assert.deepEqual(projectCanonicalSourceLinks(question(["http://unsafe.example", "registry-id", "not a URL", " https://docs.example/leading", "https://docs.example/trailing ", "https://docs.example/embedded path"], { url: "file:///tmp/source" })), []);
  assert.deepEqual(projectCanonicalSourceLinks(question(undefined, { other: "value" })), []);
});

test("opens the exact projected URL and reports success or failure explicitly", async () => {
  const source = { host: "docs.example", url: "https://docs.example/path?raw=%2F#section", role: "documentation" as const };
  const opened: string[] = [];
  assert.equal(await openCanonicalSourceLink(source, async (url) => { opened.push(url); }), "opened");
  assert.deepEqual(opened, [source.url]);
  assert.equal(await openCanonicalSourceLink(source, async () => { throw new Error("unavailable"); }), "failed");
});

test("rejects unsafe or malformed source URLs without calling the opener", async () => {
  let calls = 0;
  const openUrl = async () => { calls += 1; };
  for (const url of ["http://docs.example/path", "file:///tmp/source", "javascript:alert(1)", "not a URL", " https://docs.example/leading", "https://docs.example/trailing ", "https://docs.example/embedded path"]) {
    assert.equal(await openCanonicalSourceLink({ host: "docs.example", url, role: "documentation" }, openUrl), "failed");
  }
  assert.equal(calls, 0);
});

test("projects the exact URL from an accepted certification artifact without changing the artifact", () => {
  const artifact = JSON.parse(readFileSync("src/content/generated/canonical-content/claude-certified-architect-professional-certification.json", "utf8")) as { questions: Question[] };
  const accepted = artifact.questions.find((candidate) => candidate.questionId === "CCARP-D01-O01-boundary");
  assert.ok(accepted);
  assert.deepEqual(projectCanonicalSourceLinks(accepted), [
    { host: "www.anthropic.com", url: "https://www.anthropic.com/engineering/building-effective-agents", role: "documentation" },
    { host: "anthropic-partners.skilljar.com", url: "https://anthropic-partners.skilljar.com/path/claude-certified-architect-professional/claude-platform-solution-design", role: "course", title: "Module 1 · Claude Platform & Solution Design: Architect", section: "M1-S10: Decompose the request", requiresAccount: true },
  ]);
});
