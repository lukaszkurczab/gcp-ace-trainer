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
  assert.match(session, /navigation\.replace\(ROUTES\.ALGORITHMS_PRACTICE_SUMMARY, \{ sessionId: result\.session\.id \}\)/);
  assert.doesNotMatch(session, /setState\(\{ kind: "result"/);
});

test("practice summary reloads the immutable result and runner navigation requires verified completion", () => {
  const facade = source("src/application/coding-interview/codingInterviewSessionFacade.ts");
  const summary = source("src/features/practice/AlgorithmsPracticeSummaryScreen.tsx");
  const session = source("src/features/practice/PracticeSessionScreen.tsx");

  assert.match(summary, /await getAlgorithmsPracticeSummaryProjection\(sessionId\)/);
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
  const verifiedCompletion = session.slice(session.indexOf("async function applyCompletionResult"), session.indexOf("async function retryOrRecoverCompletion"));
  assert.match(verifiedCompletion, /if \(result\.kind !== "verified"\) \{ setCompletionFailure\(result\); return; \}/);
  assert.doesNotMatch(verifiedCompletion, /setState|setLocalResponse/);
  assert.match(verifiedCompletion, /navigation\.replace\(ROUTES\.ALGORITHMS_PRACTICE_SUMMARY, \{ sessionId: result\.value\.session\.id \}\)/);
  const completionRecovery = session.slice(session.indexOf("async function retryOrRecoverCompletion"), session.indexOf("async function abandon"));
  assert.match(completionRecovery, /recoverAlgorithmsPracticeCompletion\(completionFailure\.expectedSessionId\)/);
  assert.match(completionRecovery, /navigation\.replace\(ROUTES\.ALGORITHMS_PRACTICE_SUMMARY, \{ sessionId: result\.session\.id \}\)/);
  assert.doesNotMatch(session, /getAlgorithmsPracticeResultProjection|catch\(\(\) => null\)/);
  const completeHandoff = facade.slice(facade.indexOf("export async function completeAlgorithmsPracticeSession"), facade.indexOf("export async function retryAlgorithmsPracticeCompletionCheckpoint"));
  assert.match(completeHandoff, /kind: "verified", value: finalized/);
  assert.doesNotMatch(completeHandoff, /getAlgorithmsPracticeResultProjection/);
  const recoveryHandoff = facade.slice(facade.indexOf("export async function recoverAlgorithmsPracticeCompletion(expectedSessionId"), facade.indexOf("export async function getAlgorithmsSimulationProjection"));
  assert.match(recoveryHandoff, /return finalized/);
  assert.doesNotMatch(recoveryHandoff, /getAlgorithmsPracticeResultProjection/);
  const summaryReader = facade.slice(facade.indexOf("export async function getAlgorithmsPracticeSummaryProjection"));
  assert.match(summaryReader, /session\.status === "completed"\) return getAlgorithmsPracticeResultProjection\(sessionId\)/);
  assert.match(session, /navigation\.replace\(ROUTES\.ALGORITHMS_PRACTICE_SUMMARY, \{ sessionId: abandoned\.id \}\)/);
  assert.match(summary, /result\.completionKind === "completed" \? "Session complete" : "Session ended early"/);
});
