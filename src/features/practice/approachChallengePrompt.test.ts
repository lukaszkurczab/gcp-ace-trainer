import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { approachPromptConstraints, approachPromptParagraphs, formatApproachExample, parseApproachChallengePrompt } from "./approachChallengePrompt";

test("all 944 current stage prompts retain every authored word and assumption when sectioned", () => {
  const bank = JSON.parse(readFileSync(new URL("../../content/generated/canonical-content/coding-interview-dsa-problem-solving.json", import.meta.url), "utf8"));
  assert.equal(bank.approachChallengeProblems.length, 472);
  const normalize = (text: string) => text.replace(/\s+/gu, " ").trim();
  for (const problem of bank.approachChallengeProblems) for (const question of [problem.approachQuestion, problem.complexityQuestion]) {
    const result = parseApproachChallengePrompt(question.prompt);
    const reconstructed = [result.title ?? "", ...result.parts.map(part => `${part.sourceLabel ?? part.label} ${part.text}`)].join(" ");
    assert.equal(normalize(reconstructed), normalize(question.prompt), question.questionId);
  }
});

test("real plural examples are independent input/output pairs and the task stays outside the example", () => {
  const bank = JSON.parse(readFileSync(new URL("../../content/generated/canonical-content/coding-interview-dsa-problem-solving.json", import.meta.url), "utf8"));
  for (const id of ["acm-b05-01", "acm-b07-01"]) {
    const problem = bank.approachChallengeProblems.find((item: { problemId: string }) => item.problemId === id);
    const document = parseApproachChallengePrompt(problem.approachQuestion.prompt);
    const examples = document.parts.filter(part => part.kind === "example");
    assert.equal(examples.length, 2, id);
    for (const example of examples) {
      const pair = formatApproachExample(example.text);
      assert.ok(pair, id);
      assert.equal(pair.output.includes("Choose"), false);
      assert.equal(pair.input.includes("2. "), false);
    }
    assert.ok(document.parts.some(part => part.kind === "paragraph" && part.text.startsWith("Choose")));
  }
  assert.equal(formatApproachExample("[OPEN_A, CLOSE_A] returns true. [OPEN_A] returns false."), null, "ambiguous combined cases retain their authored prose");
});

test("real embedded limits merge with unique assumptions once without conflating decimals or identifiers", () => {
  const prompt = "Readings\n\nReturn the difference. Limits: 2 ≤ n ≤ 200,000; -1 ≤ x ≤ 1. Example: [0,1] → 1.";
  const values = approachPromptConstraints(parseApproachChallengePrompt(prompt), ["2 ≤ n ≤ 200,000.", "-1 ≤ x ≤ 1.", "Keep the input unchanged.", "x=1.25.", "x=12.5.", "X=1.25."]);
  assert.equal(values.filter(value => value.startsWith("2 ≤ n")).length, 1);
  assert.equal(values.filter(value => value.startsWith("-1 ≤ x")).length, 1);
  assert.ok(values.includes("Keep the input unchanged."));
  assert.ok(values.includes("x=1.25.") && values.includes("x=12.5.") && values.includes("X=1.25."));
});

test("numbered and edge-case examples get separate sections, preserving inline limits", () => {
  const result = parseApproachChallengePrompt("Route markers\n\nReturn the count. Constraints: n >= 0. Example 1: [(0,0)] -> 0. Example 2 (edge case): [] -> 0.");
  assert.equal(result.title, "Route markers");
  assert.deepEqual(result.parts.map(part => [part.kind, part.label]), [["paragraph", ""], ["constraints", "Constraints:"], ["example", "Example 1:"], ["example", "Example 2 (edge case):"]]);
});

test("input/output formatting does not mistake linked-list input arrows for the result separator", () => {
  assert.deepEqual(formatApproachExample("4 -> 9 -> 2 -> null returns 2 -> 9 -> 4 -> null."), {
    input: "4 -> 9 -> 2 -> null", output: "2 -> 9 -> 4 -> null.", following: null,
  });
  assert.deepEqual(formatApproachExample("values=[4,-2,7,3], left=1, right=3 returns 8. Which method fits?"), {
    input: "values=[4,-2,7,3], left=1, right=3", output: "8.", following: "Which method fits?",
  });
  assert.equal(formatApproachExample("A tree has level sums 5, 10, and 8, so return depth 1."), null);
  assert.deepEqual(formatApproachExample("scores=[5,5,5,1,8,2], k=2 → [8,5]. Which approach returns the required list?"), {
    input: "scores=[5,5,5,1,8,2], k=2", output: "[8,5].", following: "Which approach returns the required list?",
  });
});

test("paragraph breaks preserve decimal values, punctuation and all text", () => {
  const text = "Costs may be 1.25 or 2.75. Return the smallest total. The input may contain repeated identifiers. ".repeat(3).trim();
  const result = approachPromptParagraphs(text);
  assert.ok(result.length > 1);
  assert.equal(result.join(" "), text);
});
