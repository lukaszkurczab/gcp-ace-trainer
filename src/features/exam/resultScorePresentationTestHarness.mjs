// Verification-only harness: execute actual ResultScreen and SessionResultOverview
// functions with controlled hooks and host identities. This is not a React mount,
// native layout or SDK test.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import runtimeCatalogModule from "../../content/canonical/runtimeCatalog.ts";
import certificationModesModule from "../../tracks/certification/domain/certificationModes.ts";
import designModesModule from "../../tracks/design-interview/designModes.ts";
import questionScoringModule from "../../content/canonical/questionScoring.ts";
import certificationPracticeFixtureModule from "../../testing/certificationPracticeAnswerFixture.ts";
import sessionResultPresentationModule from "./sessionResultPresentation.ts";
import profileReadFenceModule from "../../application/profileReadFence.ts";

const { loadCanonicalRuntimeCatalog } = runtimeCatalogModule;
const { isCertificationPracticeModeId } = certificationModesModule;
const { isDesignInterviewModeId } = designModesModule;
const { scoreCanonicalQuestion } = questionScoringModule;
const { createCertificationPracticeAnswerFixture } = certificationPracticeFixtureModule;
const { normalizeSessionResultDetails } = sessionResultPresentationModule;
const { ProfileReadFenceChangedError } = profileReadFenceModule;
export { ProfileReadFenceChangedError };

const require = createRequire(import.meta.url);
const jsxRuntime = require("react/jsx-runtime");

function compileFunction(sourcePath, functionNames, contextValues) {
  const source = readFileSync(new URL(sourcePath, import.meta.url), "utf8");
  const ast = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = new Set(functionNames);
  const subjects = ast.statements.filter((node) => ts.isFunctionDeclaration(node) && names.has(node.name?.text));
  assert.equal(subjects.length, names.size, `Expected actual functions ${[...names].join(", ")} in ${sourcePath}`);
  const code = ts.transpileModule(`${subjects.map((node) => node.getText(ast)).join("\n")}\nmodule.exports = ${functionNames.at(0)};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = {
    module: { exports: {} },
    exports: {},
    require: (id) => id === "react/jsx-runtime" ? jsxRuntime : require(id),
    ...contextValues,
  };
  vm.runInNewContext(code, context, { filename: `actual-${functionNames[0]}.cjs` });
  return context.module.exports;
}

function renderTree(element) {
  const nodes = [];
  const visibleText = [];
  function visit(value) {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object" || !("type" in value)) return;
    let node = value;
    while (typeof node.type === "function") node = node.type(node.props ?? {});
    nodes.push(node);
    if (node.type === "Text" || node.type === "ResultText") collectText(node.props?.children);
    visit(node.props?.children);
  }
  function collectText(value) {
    if (Array.isArray(value)) return value.forEach(collectText);
    if (typeof value === "string" || typeof value === "number") visibleText.push(String(value));
    else if (value && typeof value === "object" && "type" in value) visit(value);
  }
  visit(element);
  return { nodes, text: visibleText.join(" "), byType: (type) => nodes.filter((node) => node.type === type) };
}

function createOverview({ locale = "en" } = {}) {
  const overviewSource = "../../components/SessionResultOverview.tsx";
  const host = (type) => type;
  const translations = JSON.parse(readFileSync(new URL(`../../locales/${locale}/common.json`, import.meta.url), "utf8"));
  const Overview = compileFunction(overviewSource, ["SessionResultOverview", "Metric", "OutcomeStat", "ResultText"], {
    View: host("View"), Text: host("Text"), Card: host("Card"), Button: host("Button"),
    useThemedStyles: () => ({}),
    createStyles: () => ({}),
    useWindowDimensions: () => ({ fontScale: 1 }),
    useTranslation: () => ({ t: (key) => translations[key] ?? key }),
  });
  return Overview;
}

export async function runActualResultScreen({ projectionFails = false, projectionError = null, genericMode = false, diagnosticReport = null } = {}) {
  const catalog = await loadCanonicalRuntimeCatalog();
  let fixture;
  let track;
  let session;
  let result;
  if (diagnosticReport) {
    track = catalog.getTrack("google-cloud-associate-cloud-engineer");
    const diagnosticMode = track.getMode("certification-diagnostic-baseline");
    assert.equal(diagnosticMode.selection.kind, "exact_ordered_questions");
    const items = diagnosticMode.selection.questionIds.map((questionId, index) => ({
      occurrenceId: "gcp-diagnostic-presentation:occurrence:" + index,
      item: { trackId: track.trackId, questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 },
    }));
    const points = diagnosticMode.selection.questionIds.reduce((sum, questionId) => sum + scoreCanonicalQuestion(track.getQuestion(questionId), track.getQuestion(questionId).answer).earnedPoints, 0);
    const maxPoints = diagnosticMode.selection.questionIds.reduce((sum, questionId) => sum + scoreCanonicalQuestion(track.getQuestion(questionId), track.getQuestion(questionId).answer).maxPoints, 0);
    session = {
      id: "gcp-diagnostic-presentation", trackId: track.trackId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256,
      modeId: diagnosticMode.modeId, status: "completed", completedAt: "2026-10-08T10:00:00.000Z", activeForegroundMs: 20_000,
      actualLength: items.length, requestedLength: items.length, itemOrder: items,
      configurationSnapshot: { kind: "practice", feedbackMode: "afterEachAnswer", answerChanges: "none", submission: "perItem", timer: "elapsedForeground", reinsertEnabled: false },
    };
    result = {
      sessionId: session.id, trackId: track.trackId, completedAt: session.completedAt, totalOccurrences: items.length,
      answeredOccurrenceIds: items.map((item) => item.occurrenceId), unansweredOccurrenceIds: [],
      evidence: { familyId: "certification", details: { activeForegroundMs: 20_000, correctCount: items.length, partialCount: 0, incorrectCount: 0, pointsEarned: points, maxPoints } },
    };
  } else if (genericMode) {
    track = catalog.getTrack("object-oriented-design-interview");
    const sessionId = "generic-history-points-consumer-test";
    const correctQuestion = track.questions.find((question) => scoreCanonicalQuestion(question, question.answer).kind === "correct");
    assert.ok(correctQuestion, "Expected a second real Design Interview question with a correct score.");
    const correctScore = scoreCanonicalQuestion(correctQuestion, correctQuestion.answer);
    const wrongQuestion = track.questions.find((question) => question.questionId !== correctQuestion.questionId
      && question.interaction.type === "choice_single"
      && question.interaction.options.some((option) => option.optionId !== question.answer.optionId));
    assert.ok(wrongQuestion, "Expected a second real Design Interview single-choice question with a wrong response.");
    const wrongOption = wrongQuestion.interaction.options.find((option) => option.optionId !== wrongQuestion.answer.optionId);
    const wrongScore = scoreCanonicalQuestion(wrongQuestion, { type: "choice_single", optionId: wrongOption.optionId });
    const itemOrder = [correctQuestion, wrongQuestion].map((question, index) => ({
      occurrenceId: `${sessionId}:occurrence:${index}`,
      item: { trackId: track.trackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 },
    }));
    session = {
      id: sessionId, trackId: track.trackId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256,
      modeId: "design-interview-learn-framework", status: "completed", completedAt: "2026-10-05T10:00:00.000Z",
      activeForegroundMs: 30_000, actualLength: 2, requestedLength: 2, itemOrder,
      configurationSnapshot: { kind: "practice", feedbackMode: "atSessionEnd", sectionPresentation: [] },
    };
    result = {
      sessionId, trackId: track.trackId, completedAt: session.completedAt, totalOccurrences: 2,
      answeredOccurrenceIds: itemOrder.map((item) => item.occurrenceId), unansweredOccurrenceIds: [],
      evidence: { familyId: "design_interview", details: { correctCount: 1, partialCount: 0, incorrectCount: 1, pointsEarned: correctScore.earnedPoints + wrongScore.earnedPoints, maxPoints: correctScore.maxPoints + wrongScore.maxPoints } },
    };
  } else {
    fixture = await createCertificationPracticeAnswerFixture();
    session = fixture.session;
    result = fixture.result;
    track = catalog.getTrack(session.trackId);
  }
  const sessionId = session.id;
  let state = null;
  let effectStarted = false;
  const overview = createOverview();
  const Routes = { PRACTICE_HUB: "practice-hub", EXAM_REVIEW: "exam-review", DESIGN_INTERVIEW_SIMULATION_RESULT: "design-simulation-result" };
  const Result = compileFunction("./ResultScreen.tsx", ["ResultScreen", "formatMode", "CloudDiagnosticReportCard"], {
    useState: (initial) => [state ?? (state = initial), (next) => { state = next; }],
    useEffect: (callback) => { if (!effectStarted) { effectStarted = true; callback(); } },
    useTranslation: () => ({ t: (key, parameters) => key.replace(/{{(\w+)}}/g, (_match, name) => String(parameters?.[name] ?? "")) }),
    formatMode: (modeId) => modeId,
    getTrainingLifecycleUseCases: () => ({
      loadSummary: async () => result,
      loadSessionRecord: async () => session,
    }),
    describeOperationalFailure: (_error, fallback) => fallback,
    Screen: "Screen", EmptyState: "EmptyState", SkeletonShape: "SkeletonShape", SessionResultOverview: overview,
    Text: "Text", View: "View", Card: "Card", Button: "Button",
    createStyles: () => ({}),
    ExamResultLoadingSkeleton: "ExamResultLoadingSkeleton", useThemedStyles: () => ({}), useSkeletonGlassMotion: () => ({}),
    ROUTES: { ...Routes, PRACTICE_SETUP: "practice-setup" },
    getTrackDisplay: () => ({ title: "Cloud certification" }),
    runtimeSelectors: { summary: { backToPractice: () => "back", configuration: () => "configuration", diagnosticReport: () => "diagnostic-report", diagnosticRecommendation: () => "diagnostic-recommendation", reviewAnswers: () => "review", root: () => "result" } },
    formatSessionTopic: (_trackId, value) => value === "organization_projects_policies_services_quotas_and_assets" ? "Organization, projects, policies, services, quotas and assets" : "Unavailable",
    formatElapsed: () => "00:30",
    normalizeSessionResultDetails,
    ProfileReadFenceChangedError,
    contentPackageRuntimeOwner: {
      resolveExactArtifact: async ({ trackId, contentVersion, artifactSha256 }) => {
        assert.equal(trackId, track.trackId);
        assert.equal(contentVersion, track.contentVersion);
        assert.equal(artifactSha256, track.artifactSha256);
        return { track };
      },
    },
    getDesignModeTitle: (key) => key,
    isDesignInterviewModeId,
    isCertificationPracticeModeId,
    scoreCanonicalQuestion,
    getCertificationExamReviewProjection: async () => null,
    getCertificationPracticeReviewProjection: async () => {
      if (projectionFails) throw new Error("optional exact-points projection unavailable");
      if (projectionError) throw projectionError;
      if (diagnosticReport) return { overallPointsEarned: result.evidence.details.pointsEarned, diagnosticReport };
      return { overallPointsEarned: fixture.projection.overallPointsEarned };
    },
    formatDomains: () => "domains",
  });

  const navigationCalls = [];
  const props = { route: { params: { sessionId } }, navigation: { navigate: (...args) => navigationCalls.push(args), replace: (...args) => navigationCalls.push(args) } };
  Result(props);
  for (let attempt = 0; attempt < 20 && state?.kind !== "ready" && state?.kind !== "unavailable"; attempt += 1) await new Promise((resolve) => setTimeout(resolve, 0));
  const screen = Result(props);
  return { ...renderTree(screen), navigationCalls, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 };
}
