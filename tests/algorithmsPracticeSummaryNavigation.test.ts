import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

test("completed Algorithms practice replaces its runner with the session-keyed summary route", () => {
  const routes = source("src/constants/routes.ts");
  const navigation = source("src/navigation/types.ts");
  const rootNavigator = source("src/navigation/RootNavigator.tsx");
  const session = source("src/features/practice/PracticeSessionScreen.tsx");

  assert.match(routes, /ALGORITHMS_PRACTICE_SUMMARY: "AlgorithmsPracticeSummary"/);
  assert.match(navigation, /\[ROUTES\.ALGORITHMS_PRACTICE_SUMMARY\]: \{ sessionId: string \}/);
  assert.match(rootNavigator, /name=\{ROUTES\.ALGORITHMS_PRACTICE_SUMMARY\}[\s\S]*component=\{AlgorithmsPracticeSummaryScreen\}/);
  assert.match(session, /navigation\.replace\(ROUTES\.ALGORITHMS_PRACTICE_SUMMARY, \{ sessionId: result\.sessionId \}\)/);
  assert.doesNotMatch(session, /setState\(\{ kind: "result"/);
});

test("practice summary reloads the immutable canonical result and terminal recovery keeps the session identity", () => {
  const summary = source("src/features/practice/AlgorithmsPracticeSummaryScreen.tsx");
  const session = source("src/features/practice/PracticeSessionScreen.tsx");

  assert.match(summary, /await getAlgorithmsPracticeResultProjection\(sessionId\)/);
  assert.match(summary, /<Text style=\{styles\.resultTitle\} testID=\{runtimeSelectors\.summary\.root\(result\.sessionId\)\}>/);
  assert.doesNotMatch(summary, /<View style=\{styles\.result\} testID=\{runtimeSelectors\.summary\.root/);
  assert.match(summary, /runtimeSelectors\.summary\.backToPractice\(result\.sessionId\)/);
  assert.match(summary, /runtimeSelectors\.summary\.configuration\(result\.sessionId, result\.configuration\.actualLength, result\.configuration\.feedbackTiming\)/);
  assert.match(summary, /result\.feedbackItems\.map/);
  assert.match(summary, /PracticeFeedbackBlock/);
  assert.match(summary, /<PracticeFeedbackBlock itemId=\{item\.occurrenceId\}/);
  assert.doesNotMatch(summary, /itemId=\{`\$\{result\.sessionId\}:\$\{item\.occurrenceId\}`\}/);
  assert.match(summary, /result\.score\.correctCount\} \{t\("correct"\)\} · \{missedCount\} \{t\("Missed"\)\}/);
  assert.doesNotMatch(summary, /result\.score\.partialCount\} \{t\("partial"\)\}|result\.score\.incorrectCount\} \{t\("incorrect"\)\}/);
  assert.match(session, /if \(!await loadActiveTrainingSession\(\)\) \{[\s\S]*navigation\.replace\(ROUTES\.ALGORITHMS_PRACTICE_SUMMARY, \{ sessionId: projection\.session\.id \}\)/);
  assert.match(session, /getAlgorithmsPracticeResultProjection\(projection\.session\.id\)\.catch\(\(\) => null\)/);
});
