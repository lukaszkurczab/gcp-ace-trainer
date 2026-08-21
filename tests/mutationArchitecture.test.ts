import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
function files(path: string): string[] {
  return readdirSync(join(root, path), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(path, entry.name)) : [join(path, entry.name)],
  );
}

test("one journal contract, materializer, verifier, and coordinator remain", () => {
  const journal = read("src/storage/repositories/mutationJournalRepository.ts");
  const completionBuilder = read("src/application/learningMutations/commitSessionLifecycle.ts");
  const verifier = read("src/application/learningMutations/mutationVerifier.ts");
  assert.match(journal, /export type MutationJournalRecord/);
  assert.match(journal, /case "complete_training_session":[\s\S]*?count\("put_session_result"\) === 1/);
  assert.match(completionBuilder, /operation: "complete_training_session"[\s\S]*?writes: \[\{ kind: "put_session_result", record: result \}, \{ kind: "put_session", record: session \}, \{ kind: "clear_active_session", sessionId: session\.id \}\]/);
  assert.match(verifier, /record\.operation === "complete_training_session"[\s\S]*?results\.length !== 1/);
  assert.match(read("src/application/learningMutations/mutationMaterializer.ts"), /export async function materializeMutation/);
  assert.match(verifier, /export async function verifyMutation/);
  assert.match(read("src/application/learningMutations/commitMutation.ts"), /export async function commitMutation/);
  assert.match(read("src/application/learningMutations/recoverPendingMutation.ts"), /export async function recoverPendingMutation/);
});

test("mutation failure has one boundary owner and presentation cannot recreate durable state", () => {
  const source = files("src").map(read).join("\n");
  assert.equal((source.match(/class MutationCommitFailure/g) ?? []).length, 1);
  assert.doesNotMatch(read("src/application/trainingLifecycle/contracts.ts"), /MutationCommitFailure|MutationCommitPhase|journalDurable/);
  assert.doesNotMatch(read("src/application/learningMutations/commitMutation.ts"), /trainingLifecycle\/contracts/);
  const screen = read("src/features/simulation/AlgorithmsInterviewSimulationScreen.tsx");
  assert.doesNotMatch(screen, /type Operation|setOperation|finalizationFailure|abandonmentFailure|unavailableState|message\.toLowerCase|message\.includes|error\.message ===/);
  assert.doesNotMatch(screen, /OperationProjectionStore/);
  for (const path of files("src/features")) assert.doesNotMatch(read(path), /from\s+["'][^"']*(?:storage\/repositories|infrastructure\/storage)[^"']*["']/);
});

test("features and track semantics cannot import storage or repository implementations", () => {
  for (const path of [...files("src/features"), ...files("src/tracks")]) {
    const source = read(path);
    assert.doesNotMatch(source, /from\s+["'][^"']*(?:\/storage(?:\/|["'])|storage\/repositories)[^"']*["']/, `direct persistence import in ${path}`);
  }
});

test("Algorithms runtime composition has no persistence binding", () => {
  const runtime = read("src/application/coding-interview/CodingInterviewFamilyRuntime.ts");
  const composition = read("src/application/contentPackageRuntimeOwner.ts");
  assert.equal(existsSync(join(root, "src/application/coding-interview/createCodingInterviewRuntime.ts")), false);
  assert.doesNotMatch(runtime, /storage\/repositories|react-native-mmkv|from\s+["']react/);
  assert.doesNotMatch(runtime, /\b(commit|save|getActive|recover|materialize|verify)[A-Z]/);
  assert.doesNotMatch(composition, /storage|repositories|saveTrainingSession|saveTrainingSessionDraft|getActiveTrainingSession|commitMutation/);
});

test("Coding Interview read projections do not create a barrel cycle through the session facade", () => {
  const reads = read("src/application/learningReadModels.ts");
  assert.doesNotMatch(reads, /from\s+["']\.\/coding-interview["']/);
  assert.match(reads, /from\s+["']\.\/coding-interview\/codingInterviewDeclaredScope["']/);
  assert.doesNotMatch(
    read("src/application/coding-interview/codingInterviewDeclaredScope.ts"),
    /learningReadModels|codingInterviewSessionFacade/,
  );
});

test("one family-neutral foreground timer is bound only in application composition, never in presentation", () => {
  const timer = read("src/application/trainingLifecycle/ForegroundSessionTimerFacade.ts");
  const runtimeTimer = read("src/application/runtime/ForegroundSessionTimer.ts");
  const composition = read("src/application/bootstrap/trainingLifecycleComposition.ts");
  assert.equal(existsSync(join(root, "src/application/coding-interview/AlgorithmsForegroundTimerFacade.ts")), false);
  assert.doesNotMatch(timer, /storage\/repositories|getActiveForegroundTimer|saveActiveForegroundTimer/);
  assert.doesNotMatch(timer, /familyId\s*!==\s*["']algorithms["']|familyId:\s*["']algorithms["']|assertForegroundTimedAlgorithmsSession/);
  assert.match(composition, /getActiveForegroundTimer/);
  assert.match(composition, /saveActiveForegroundTimer/);
  assert.equal((composition.match(/installForegroundSessionTimerFacade\(/g) ?? []).length, 1);
  for (const path of files("src/features")) {
    const source = read(path);
    assert.doesNotMatch(source, /getActiveForegroundTimer|saveActiveForegroundTimer|checkpointForExpiry|checkpointForegroundTime/,
      `presentation owns timer persistence or expiry in ${path}`);
  }
  const screen = read("src/features/simulation/AlgorithmsInterviewSimulationScreen.tsx");
  assert.doesNotMatch(screen, /setInterval|setTimeout|Date\.now|remainingForegroundMs\s*[-+]/,
    "simulation screen must not own a countdown source");
  const certificationScreen = read("src/features/practice/CertificationPracticeSessionScreen.tsx");
  const algorithmsFacade = read("src/application/coding-interview/codingInterviewSessionFacade.ts");
  const certificationFacade = read("src/application/certification/certificationSessionFacade.ts");
  const preparationGate = read("src/content/application/ContentPreparationGate.tsx");
  assert.match(certificationFacade, /startCertificationPracticeSession[\s\S]*?getForegroundSessionTimerFacade\(\)\.initialize\(prepared\.session\)/);
  assert.match(certificationFacade, /checkpointForResponseSave\(await requireCertificationPractice\(\)\)/);
  const terminalPracticeSection = (source: string, start: string, end: string): string => {
    const startIndex = source.indexOf(start);
    assert.ok(startIndex >= 0);
    const endIndex = source.indexOf(end, startIndex + start.length);
    assert.ok(endIndex >= 0);
    return source.slice(startIndex, endIndex);
  };
  for (const [family, completion] of [
    ["Algorithms", terminalPracticeSection(algorithmsFacade, "export async function completeAlgorithmsPracticeSession", "export async function getAlgorithmsSimulationProjection")],
    ["Certification", terminalPracticeSection(certificationFacade, "export async function completeCertificationPracticeSession", "export async function abandonCertificationSession")],
  ] as const) {
    assert.match(completion, /const session = await require(?:AlgorithmsSession|CertificationPractice)\(\)/, `${family} completion captures the active session`);
    assert.match(completion, /timer\.completePracticeAfterCheckpoint\(session, \(\) => lifecycle\.completeActivePracticeSession\(session\.id\)\)/, `${family} completion delegates one shared checkpoint-to-result handoff`);
    assert.doesNotMatch(completion, /timer\.checkpointForPracticeCompletion\(session\)|timer\.releaseAfterVerifiedPracticeCompletion\(session\.id\)/, `${family} cannot recreate the shared handoff around the lifecycle`);
  }
  const sharedCompletion = terminalPracticeSection(timer, "async completePracticeAfterCheckpoint", "async retryPracticeCompletionCheckpointAfterFailure");
  assert.match(sharedCompletion, /const existing = this\.practiceCompletions\.get\(session\.id\);[\s\S]*?if \(existing\) return existing/);
  const checkpointIndex = sharedCompletion.indexOf("await this.checkpointForPracticeCompletionInLane(session)");
  const completionIndex = sharedCompletion.indexOf("const result = await complete()");
  const releaseIndex = sharedCompletion.indexOf("this.releaseAfterTerminalSuccess(session.id)");
  assert.ok(checkpointIndex >= 0 && completionIndex > checkpointIndex && releaseIndex > completionIndex, "shared handoff must freeze time, await verified completion, then release once");
  assert.match(runtimeTimer, /async checkpointForPracticeCompletion\(\): Promise<ForegroundTimerState> \{ return this\.persist\(false\); \}/);
  assert.match(timer, /if \(this\.foregroundSessionId !== sessionId\) return;[\s\S]*?checkpointIfDue/);
  assert.match(timer, /private releaseAfterTerminalSuccess\(sessionId: string\)/);
  assert.match(certificationScreen, /AppState\.addEventListener/);
  assert.match(certificationScreen, /subscribeCertificationPracticeProjectionRefresh/);
  assert.match(certificationScreen, /formatPracticeElapsedTime\(projection\.elapsedForegroundMs\)/);
  assert.doesNotMatch(certificationScreen, /formatPracticeElapsedTime\(projection\.session\.activeForegroundMs\)/);
  assert.doesNotMatch(certificationScreen, /setInterval|setTimeout|Date\.now|activeForegroundMs\s*[-+]/,
    "Certification practice screen must not own a foreground-time source");
  assert.match(preparationGate, /getForegroundSessionTimerFacade\(\)\.restoreForResume\(session\)/);
  assert.doesNotMatch(preparationGate, /session\.trackId\s*===\s*["']algorithms["']/);
});

test("training-session identity has one lifecycle authority and no obsolete runtime port", () => {
  assert.equal(existsSync(join(root, "src/application/coding-interview/AlgorithmsSessionRuntimePorts.ts")), false);
  const lifecycle = read("src/application/trainingLifecycle/TrainingLifecycleUseCases.ts");
  const algorithmsFacade = read("src/application/coding-interview/codingInterviewSessionFacade.ts");
  const certificationFacade = read("src/application/certification/certificationSessionFacade.ts");
  const algorithmsBarrel = read("src/application/coding-interview/index.ts");
  const source = files("src/application").map(read).join("\n");

  assert.match(lifecycle, /ports\.sessionIds\.create\(\{ trackId: input\.trackId, modeId: input\.modeId \}\)/);
  assert.match(lifecycle, /\{ \.\.\.input\.request, sessionId \}/);
  assert.doesNotMatch(algorithmsFacade, /AlgorithmsSessionRuntimePorts|sessionIds\.next|randomUUID|Math\.random|Date\.now/);
  assert.doesNotMatch(certificationFacade, /nextSessionId|\blet sequence\b|randomUUID|Math\.random|Date\.now/);
  assert.doesNotMatch(algorithmsBarrel, /AlgorithmsSessionRuntimePorts/);
  assert.equal((source.match(/\.sessionIds\.create\(/g) ?? []).length, 1);
});

test("old active exam persistence owner and feature services are deleted", () => {
  assert.equal(existsSync(join(root, "src/storage/repositories/activeSessionRuntimeRepository.ts")), false);
  assert.equal(existsSync(join(root, "src/features/exam/examService.ts")), false);
  assert.equal(existsSync(join(root, "src/features/practice/practiceService.ts")), false);
  const source = files("src").map(read).join("\n");
  assert.doesNotMatch(source, /ACTIVE_SESSION_RUNTIME|clear_active_exam|saveActiveSessionRuntime|getActiveSessionRuntime/);
});

test("Certification answers cannot recreate the deleted selector or competing writer", () => {
  const deletedModule = ["certification", "Practice", "UseCases.ts"].join("");
  assert.equal(existsSync(join(root, "src/application", deletedModule)), false);
  const source = files("src").map(read).join("\n");
  const obsoleteSymbols = [
    ["save", "PracticeAnswer"],
    ["load", "PracticeQuestions"],
    ["shuffle", "QuestionOptions"],
    ["get", "PracticeDomainCounts"],
    ["Practice", "QuestionCount"],
  ].map((parts) => parts.join(""));
  for (const obsolete of obsoleteSymbols) {
    assert.doesNotMatch(source, new RegExp(`\\b${obsolete}\\b`));
  }
  const certification = read("src/application/certification/CertificationFamilyRuntime.ts");
  const facade = read("src/application/certification/certificationSessionFacade.ts");
  assert.match(certification, /async submitPractice\(/);
  assert.match(facade, /getTrainingLifecycleUseCases\(\)\.submitPracticeResponse\(response\)/);
  assert.doesNotMatch(facade, /commitTrainingOutcome|createTrainingAttempt|scoreCertificationQuestion/);
});

test("Certification presentation reads materialized feedback without owning family scoring", () => {
  const screen = read("src/features/practice/CertificationPracticeSessionScreen.tsx");
  const facade = read("src/application/certification/certificationSessionFacade.ts");
  const runtime = read("src/application/certification/CertificationFamilyRuntime.ts");
  for (const path of files("src/features")) {
    assert.doesNotMatch(read(path), /scoreCertificationQuestion|certificationScoring/,
      `Certification scoring leaked into presentation at ${path}`);
  }
  for (const path of files("src/application").filter((path) => path !== "src/application/certification/CertificationFamilyRuntime.ts")) {
    assert.doesNotMatch(read(path), /scoreCertificationQuestion|certificationScoring/,
      `Certification scoring leaked outside its family runtime at ${path}`);
  }
  assert.match(runtime, /result: scoreCertificationQuestion\(question, response\)/);
  assert.match(facade, /const feedback = materializedAttempt \? Object\.freeze\(\{ result: materializedAttempt\.result\.kind, reason: question\.feedback\.reason, details: question\.feedback\.details \}\) : null/);
  assert.match(screen, /const feedback = projection\.feedback/);
  assert.doesNotMatch(screen, /correctOptionIds|question\.feedback|const result = submitted|feedback[^;]*selected/);
});

test("Certification durable Practice state has one exact projection, recovery command, and shared notice mapper", () => {
  const facade = read("src/application/certification/certificationSessionFacade.ts");
  const certification = read("src/features/practice/CertificationPracticeSessionScreen.tsx");
  const algorithms = read("src/features/practice/PracticeSessionScreen.tsx");
  const presentation = read("src/features/practice/practiceSessionPresentation.ts");
  assert.doesNotMatch(facade, /committedResponse/);
  assert.match(facade, /pending\?\.practiceOutcome\?\.attempt\.sessionId === session\.id && pending\.practiceOutcome\.attempt\.occurrenceId === occurrence\.occurrenceId/);
  assert.match(facade, /const responseAttempt = materializedAttempt \?\? committedAttempt/);
  assert.match(facade, /source: materializedAttempt \? "materialized" as const : "committed" as const/);
  assert.match(facade, /lifecycle\.getPracticeOperationState\(session, Boolean\(materializedAttempt\)\)/);
  assert.match(facade, /recoverCertificationPracticeOperation[\s\S]*?recoverActiveTrainingOperation\(\)/);
  assert.equal((facade.match(/recoverCertificationPracticeOperation/g) ?? []).length, 1);
  assert.equal((presentation.match(/function noticeForPracticeOperation/g) ?? []).length, 1);
  assert.doesNotMatch(algorithms, /function noticeForPracticeOperation/);
  assert.doesNotMatch(certification, /function noticeForPracticeOperation/);
  assert.match(algorithms, /noticeForPracticeOperation\(renderedCompletionOperation \?\? projection\.operation\)/);
  assert.match(certification, /noticeForPracticeOperation\(renderedCompletionOperation \?\? projection\.operation\)/);
  assert.match(certification, /const editable = !exitFailure && !completionFailure && allowsPracticeResponseEditing\(projection\.operation\.kind\)/);
  assert.match(presentation, /function allowsPracticeResponseEditing[\s\S]*?return phase === "unanswered" \|\| phase === "submit_journal_failed";/);
  assert.match(certification, /setSelection\(\(current\) => reconcilePracticeChoiceSelection\(\{[\s\S]*?durableSelectedOptionIds: next\.response\?\.value\.selectedOptionIds \?\? null,[\s\S]*?occurrenceId: next\.occurrenceId,[\s\S]*?sessionId: next\.session\.id/);
  assert.match(certification, /"error" in projection\.operation && projection\.operation\.error\.allowedAction === "recover"/);
  assert.match(certification, /if \(!editable\) return;/);
  assert.match(certification, /if \(!canRecover\) return;/);
  assert.match(certification, /if \(!canAdvance\) return;/);
  const advanceRetry = certification.slice(certification.indexOf('if (projection.operation.kind === "advance_failed")'), certification.indexOf("if (projection.ordinal === projection.total)"));
  assert.match(advanceRetry, /advanceCertificationPracticeSession\(\)/);
  assert.doesNotMatch(advanceRetry, /submitCertificationPracticeResponse|completeCertificationPracticeSession/);
  assert.match(certification, /catch \{ await refreshAfterCommand\("The answer state could not be refreshed\."\); return; \}/);
  const endSession = certification.slice(certification.indexOf("const endSession = async () =>"), certification.indexOf("const recoverAbandonment"));
  assert.match(endSession, /result\.kind === "retry_same_command"[\s\S]*?result\.retry === "foreground_checkpoint" \? "retry_checkpoint" : "retry_abandon"/);
  assert.match(endSession, /result\.kind === "recovery_required"[\s\S]*?result\.recovery === "abandonment" \? "recover_abandon" : "recover_operation"/);
  assert.match(endSession, /catch \(cause\) \{[\s\S]*?setError\(describeOperationalFailure\(cause, "The session end state could not be verified\."\)\);[\s\S]*?\}/);
  assert.doesNotMatch(endSession, /catch[^}]*setExitFailure/);
  const preAbandonmentRecovery = facade.slice(facade.indexOf("export async function recoverCertificationPreAbandonmentCheckpoint"), facade.indexOf("async function abandonCertificationSessionAfterTimerLeave"));
  const recoverIndex = preAbandonmentRecovery.indexOf("await lifecycle.recoverActiveTrainingOperation()");
  const verifyIndex = preAbandonmentRecovery.indexOf("session.id !== expectedSessionId");
  const timerRetryIndex = preAbandonmentRecovery.indexOf("retryLeaveForegroundAfterCheckpointFailure(session)");
  const reconstructIndex = preAbandonmentRecovery.indexOf("await lifecycle.reconstructOperationProjection(session)");
  assert.ok(recoverIndex >= 0 && verifyIndex > recoverIndex && timerRetryIndex > verifyIndex && reconstructIndex > timerRetryIndex);
  const verifiedCompletion = certification.slice(certification.indexOf("const applyCompletionResult"), certification.indexOf("const retryOrRecoverCompletion"));
  assert.match(verifiedCompletion, /if \(result\.kind !== "verified"\) \{ setCompletionFailure\(result\); return; \}/);
  assert.doesNotMatch(verifiedCompletion, /applyProjection|setProjection|setSelected/);
  assert.match(verifiedCompletion, /navigation\.replace\(ROUTES\.RESULT, \{ sessionId: result\.value\.session\.id \}\)/);
  const completionRecovery = certification.slice(certification.indexOf("const retryOrRecoverCompletion"), certification.indexOf("const leaveRunner"));
  assert.match(completionRecovery, /recoverCertificationPracticeCompletion\(completionFailure\.expectedSessionId\)/);
  assert.match(completionRecovery, /navigation\.replace\(ROUTES\.RESULT, \{ sessionId: result\.session\.id \}\)/);
  assert.doesNotMatch(completionRecovery, /getCertificationPracticeResult|getTrainingSessionResult|catch[^}]*navigation\.replace/);
  assert.match(certification, /return <PracticeSessionSurface[\s\S]*?phase=\{phase\}/);
  assert.doesNotMatch(certification, /<Pressable|<Card|createStyles|function formatElapsed/);
  assert.doesNotMatch(certification, /setSubmitted|\bsubmitted\b|committedResponse/);
});

test("Certification route handoffs use exact resume intent and cannot hide failures behind start fallbacks", () => {
  const facade = read("src/application/certification/certificationSessionFacade.ts");
  const practice = read("src/features/practice/CertificationPracticeSessionScreen.tsx");
  const exam = read("src/features/exam/ExamScreen.tsx");
  const config = read("src/features/practice/sessionConfig.ts");
  const home = read("src/features/home/HomeScreen.tsx");
  const homeModel = read("src/features/home/tabs/homeTabModel.ts");
  const homeTab = read("src/features/home/tabs/HomeTab.tsx");
  assert.match(facade, /cause instanceof TrainingApplicationFailure[\s\S]*?cause\.code !== "active_session_conflict"[\s\S]*?const raced = await loadActiveTrainingSession\(\)/);
  assert.equal((facade.match(/const raced = await loadActiveTrainingSession\(\)/g) ?? []).length, 1);
  assert.match(practice, /openCertificationPracticeSession/);
  assert.doesNotMatch(practice, /getCertificationPracticeProjection\(\)\.catch\(\(\) => null\)|if \(!active\) await startCertificationSession/);
  assert.match(practice, /expectedSessionId: conflict\.id/);
  assert.match(exam, /if \(expectedSessionId\)[\s\S]*?resumeExpectedCertificationExam\(expectedSessionId\)[\s\S]*?return;[\s\S]*?startCertificationExam\(\)/);
  assert.match(config, /Partial<Omit<PracticeSessionRouteParams, "expectedSessionId">>/);
  assert.match(config, /buildCertificationPracticeResumeRoute\(session: TrainingSession\)/);
  assert.match(config, /expectedSessionId: session\.id/);
  assert.match(home, /loadActiveTrainingSession\(\)/);
  assert.match(home, /session\.id !== action\.sessionId \|\| session\.trackId !== "google-cloud-associate-cloud-engineer" \|\| session\.modeId !== action\.modeId/);
  assert.match(home, /buildCertificationPracticeResumeRoute\(session\)/);
  assert.match(homeModel, /session\.trackId !== input\.activeTrack\.id/);
  assert.match(homeModel, /buildDesignInterviewPracticeResumeRoute\(session\)/);
  assert.equal((homeTab.match(/runtimeSelectors\.resume\.card/g) ?? []).length, 1);
  assert.equal((homeTab.match(/styles\.decisionCard/g) ?? []).length, 1);
  assert.doesNotMatch(facade, /catch\([^)]*\)[^{]*\{[^}]*return null|catch\([^)]*\)[^{]*\{[^}]*startCertificationSession/);
});

test("presentation routes use application ports without persistence internals", () => {
  const features = files("src/features").map(read).join("\n");
  assert.doesNotMatch(features, /mutationJournalRepository|mutationMaterializer|mutationVerifier|persistMutationJournal|clearMutationJournal/);
  assert.match(read("src/features/practice/PracticeSessionScreen.tsx"), /application\/coding-interview/);
  assert.match(read("src/features/simulation\/AlgorithmsInterviewSimulationScreen.tsx"), /application\/coding-interview/);
});

test("startup recovery uses canonical bootstrap recovery", () => assert.match(read("src/content/application/ContentPreparationGate.tsx"), /bootstrapApplication/));
