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
  assert.match(summary, /runtimeSelectors\.summary\.root\(result\.sessionId\)/);
  assert.match(session, /if \(!await loadActiveTrainingSession\(\)\) \{[\s\S]*navigation\.replace\(ROUTES\.ALGORITHMS_PRACTICE_SUMMARY, \{ sessionId: projection\.session\.id \}\)/);
  assert.match(session, /getAlgorithmsPracticeResultProjection\(projection\.session\.id\)\.catch\(\(\) => null\)/);
});
