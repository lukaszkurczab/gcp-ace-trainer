import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { readFileSync } from "node:fs";
import type { ComponentType, ReactNode } from "react";

const require = createRequire(import.meta.url);
const React = require("react");
const { act, create } = require("react-test-renderer");
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const storage = require("../../infrastructure/storage/mmkvClient.ts");
const preferences = require("../../application/appPreferences.ts");
const settingsRepository = require("../../storage/repositories/settingsRepository.ts");
const profileStorageRouter = require("../../infrastructure/storage/profileStorageRouter.ts");
const { sha256Utf8 } = require("../../infrastructure/identity/sha256.ts");

function loadComponent(path: string, dependencies: Record<string, unknown>) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} as Record<string, unknown> };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name: string) => name in dependencies ? dependencies[name] : require(name),
  });
  return module.exports;
}

const preferencesContext = loadComponent("../../preferences/appPreferencesContext.tsx", {
  react: React,
  "../theme/tokens": require("../../theme/tokens.ts"),
  "./localeResolver": require("../../preferences/localeResolver.ts"),
});
const preferencesProvider = loadComponent("../../preferences/AppPreferencesProvider.tsx", {
  react: React,
  "react-native": { useColorScheme: () => "light" },
  "../i18n": { __esModule: true, default: { changeLanguage: async () => undefined } },
  "../application/appPreferences": preferences,
  "../infrastructure/storage/mmkvClient": storage,
  "../application/profileReadFence": require("../../application/profileReadFence.ts"),
  "../storage/errors": require("../../storage/errors.ts"),
  "./appPreferencesContext": preferencesContext,
}) as {
  AppPreferencesProvider: ComponentType<{ children?: ReactNode }>;
  useAppPreferences: () => { ready: boolean; settings: Record<string, any>; settingsUnavailable: boolean };
};

const exitService = {
  endApproachChallengeSession: async (_id: string, _action?: string, _assertCurrent?: () => void): Promise<any> => { throw Error("unexpected_end"); },
  pauseApproachChallengeSession: async (_id: string, _action?: string, _assertCurrent?: () => void): Promise<any> => { throw Error("unexpected_pause"); },
};
let removalGuard: { enabled: boolean; callback: (event: any) => void };
const native = {
  ActivityIndicator: "ActivityIndicator",
  Modal: "Modal",
  ScrollView: "ScrollView",
  Platform: { OS: "ios" },
  Pressable: "Pressable",
  useWindowDimensions: () => ({ fontScale: 1, scale: 3, width: 390 }),
  StyleSheet: { create: (value: unknown) => value, hairlineWidth: 1 },
  Text: "Text",
  View: "View",
};
const host = (name: string) => ({ children, ...props }: Record<string, unknown>) => React.createElement(name, props, children);
const screenHost = ({ children, footer, ...props }: Record<string, unknown>) => React.createElement("Screen", props, children, footer);
const components = { ...Object.fromEntries(["AnswerOption", "Button", "Card", "DetailsDisclosure", "EmptyState", "Icon", "InfoBlock", "ScreenHeader"].map((name) => [name, host(name)])), Screen: screenHost };
const interpolation = (value: string, values?: Record<string, unknown>) => Object.entries(values ?? {}).reduce(
  (text, [key, replacement]) => text.replaceAll(`{{${key}}}`, String(replacement)), value,
);
const codingArtifact = JSON.parse(readFileSync(new URL("../../content/generated/canonical-content/coding-interview-dsa-problem-solving.json", import.meta.url), "utf8"));
const contentLock = JSON.parse(readFileSync(new URL("../../content/generated/canonical-content/content-lock.json", import.meta.url), "utf8"));
const codingArtifactIdentity = contentLock.tracks.find((track: { trackId: string }) => track.trackId === codingArtifact.trackId);
const runtimeTrack = Object.freeze({
  trackId: codingArtifact.trackId,
  contentVersion: codingArtifact.contentVersion,
  artifactSha256: codingArtifactIdentity.sha256,
  approachChallengeProblems: codingArtifact.approachChallengeProblems,
});
let discoveryReads = 0;
const contentPackageRuntimeOwner = { getPreparedDiscovery: () => { discoveryReads += 1; return { track: runtimeTrack }; } };
const testAccount = { readCurrentPremiumAccess: () => "allowed" };
const startRequests: unknown[] = [];
const preparedSession = { session: { id: "integration-session" } };
const activeSessionReads: { count: number; value: unknown } = { count: 0, value: null };
const sessionFacade = loadComponent("../../application/coding-interview/approachChallengeSessionFacade.ts", {
  "../../content/canonical/interactions/registry": require("../../content/canonical/interactions/registry.ts"),
  "../../tracks/coding-interview/domain/algorithmModes": require("../../tracks/coding-interview/domain/algorithmModes.ts"),
  "../../content/canonical/approachChallengeProblem": { APPROACH_CHALLENGE_TRACK_ID: codingArtifact.trackId },
  "../contentPackageRuntimeOwner": { contentPackageRuntimeOwner },
  "../learningReadModels": { loadActiveTrainingSession: async () => null, loadTrainingAttempts: async () => ({ value: [] }) },
  "../trainingLifecycle": { getForegroundSessionTimerFacade: () => ({ initialize: async () => undefined }) },
  "../trainingLifecycle/applicationLifecycle": {
    startTrainingSession: async (input: unknown) => { startRequests.push(input); return preparedSession; },
    getTrainingLifecycleUseCases: () => ({}),
  },
  "./approachChallengeSelection": require("../../application/coding-interview/approachChallengeSelection.ts"),
  "./approachChallengeSession": {},
});
const screenFacade: Record<string, unknown> & { getApproachChallengeDetailedHistory: (sessionId?: string) => Promise<unknown> } = {
  ...sessionFacade,
  getApproachChallengeDetailedHistory: async (_sessionId?: string) => ({ kind: "unavailable", reason: "session_unavailable" }),
};
const setupControls = loadComponent("./PracticeSetupControls.tsx", {
  react: React, "react-native": native, "../../preferences": preferencesProvider,
  "../../theme": require("../../theme/tokens.ts"),
});
const questionContent = loadComponent("./ApproachChallengeQuestion.tsx", {
  react: React, "react-native": native, "react-i18next": { useTranslation: () => ({ t: interpolation }) },
  "../../preferences": preferencesProvider, "../../theme": require("../../theme/tokens.ts"),
  "./approachChallengePrompt": require("./approachChallengePrompt.ts"),
});
const sharedDetailsDisclosure = loadComponent("../../components/DetailsDisclosure.tsx", {
  react: React, "react-native": native, "react-i18next": { useTranslation: () => ({ t: interpolation }) },
  "../preferences": preferencesProvider, "../theme": require("../../theme/tokens.ts"), "./Icon": { Icon: host("Icon") },
}).DetailsDisclosure;
const sharedFeedback = loadComponent("./PracticeFeedbackBlock.tsx", {
  react: React, "react-native": native, "react-i18next": { useTranslation: () => ({ t: interpolation }) },
  "../../components": { ...components, DetailsDisclosure: sharedDetailsDisclosure },
  "../../preferences": preferencesProvider, "../../theme": require("../../theme/tokens.ts"),
  "../reports/ContentReportSheet": { ContentReportSheet: host("ContentReportSheet") },
  "../../application/canonical/canonicalSourceLinks": require("../../application/canonical/canonicalSourceLinks.ts"),
  "./feedbackDetails": require("./feedbackDetails.ts"),
  "../../components/textLayoutHeight": require("../../components/textLayoutHeight.ts"),
  "../../testing/runtimeSelectors": require("../../testing/runtimeSelectors.ts"),
});
const approachFeedback = loadComponent("./ApproachChallengeFeedback.tsx", {
  "./PracticeFeedbackBlock": sharedFeedback, "./feedbackDetails": require("./feedbackDetails.ts"),
});
const sharedSessionSurface = loadComponent("./PracticeSessionSurface.tsx", {
  react: React, "react-native": native, "react-native-safe-area-context": { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
  "react-i18next": { useTranslation: () => ({ t: interpolation }) },
  "../../preferences": preferencesProvider, "../../theme": require("../../theme/tokens.ts"), "../../components": components,
  "./PracticeQuestionCard": {}, "./PracticeFeedbackBlock": {}, "./PracticeResponseControls": {}, "../coding-interview/session/SessionShell": {},
  "./practiceSessionExitCopy": require("./practiceSessionExitCopy.ts"),
  "./practiceSessionPresentation": require("./practiceSessionPresentation.ts"),
  "../../testing/runtimeSelectors": require("../../testing/runtimeSelectors.ts"),
  "../../domain/tracks/trackAdmission": require("../../domain/tracks/trackAdmission.ts"),
});
const sharedOverview = loadComponent("../../components/SessionResultOverview.tsx", {
  react: React, "react-native": native, "react-i18next": { useTranslation: () => ({ t: interpolation }) },
  "../preferences": preferencesProvider, "../theme": require("../../theme/tokens.ts"),
  "./Card": { Card: host("Card") }, "./Button": { Button: host("Button") },
});
const historySummary = loadComponent("./ApproachChallengeSummary.tsx", {
  react: React, "react-native": native, "react-i18next": { useTranslation: () => ({ t: interpolation }) },
  "../../preferences": preferencesProvider, "../../theme": require("../../theme/tokens.ts"),
  "../../components": { ...components, ...sharedOverview },
  "./approachChallengePrompt": require("./approachChallengePrompt.ts"),
  "./approachChallengePresentation": require("./approachChallengePresentation.ts"),
});
const actualAnswerOption = loadComponent("../../components/AnswerOption.tsx", {
  react: React, "react-native": native, "../preferences": preferencesProvider, "../theme": require("../../theme/tokens.ts"),
  "./textLayoutHeight": require("../../components/textLayoutHeight.ts"),
});
const reviewAnswerOption = (props: any) => React.createElement("AnswerOption", props, React.createElement(actualAnswerOption.AnswerOption, props));
const readOptionsForTest = require("./approachChallengePresentation.ts").readOptions;
const historyReview = loadComponent("./ApproachChallengeReviewScreen.tsx", {
  react: React, "react-native": native, "react-i18next": { useTranslation: () => ({ t: interpolation }) },
  "../../preferences": preferencesProvider, "../../theme": require("../../theme/tokens.ts"),
  "../../components": { ...components, AnswerOption: reviewAnswerOption, BackLink: host("BackLink") },
  "../../constants": { ROUTES: { APPROACH_CHALLENGE: "ApproachChallenge" } },
  "../../application/coding-interview/approachChallengeSessionFacade": screenFacade,
  "../../application/profileReadFence": require("../../application/profileReadFence.ts"),
  "./ApproachChallengeFeedback": approachFeedback, "./ApproachChallengeQuestion": questionContent,
  "./approachChallengePresentation": require("./approachChallengePresentation.ts"),
  "../coding-interview/session/SessionShell": { SessionShell: ({ children, headerAction, actionBar, ...props }: any) => React.createElement("SessionShell", props, headerAction, children, actionBar) },
});
const approachChallengeScreen = loadComponent("./ApproachChallengeScreen.tsx", {
  react: React,
  "react-native": native,
  "@react-navigation/native": { usePreventRemove: (enabled: boolean, callback: (event: any) => void) => { removalGuard = { enabled, callback }; } },
  "react-i18next": { useTranslation: () => ({ t: interpolation }) },
  "../../components": components,
  "../../preferences": preferencesProvider,
  "../../theme": { spacing: {}, typography: { body: {}, bodyStrong: {} } },
  "../../constants": { ROUTES: { PRACTICE_HUB: "PracticeHub", HOME: "Home", ACTIVITY: "Activity", APPROACH_CHALLENGE: "ApproachChallenge", APPROACH_CHALLENGE_REVIEW: "ApproachChallengeReview" } },
  "../../tracks/coding-interview/generated/algorithmTaxonomyStructure.generated": require("../../tracks/coding-interview/generated/algorithmTaxonomyStructure.generated.ts"),
  "../../domain": require("../../domain/index.ts"),
  "../../application/contentPackageRuntimeOwner": { contentPackageRuntimeOwner },
  "../../application/learningReadModels": {
    loadActiveTrainingSession: async () => { activeSessionReads.count += 1; return activeSessionReads.value; },
    loadTrainingAttempts: async () => ({ value: [] }),
  },
  "../../application/trainingLifecycle/applicationLifecycle": { resumeActiveTrainingSession: async () => undefined },
  "../../application/learningPlan/learningEvidenceProjection": { projectLearningEvidence: () => ({ completion: { kind: "known", chapters: [] } }) },
  "./approachChallengeAccess": { useApproachChallengeAccess: () => testAccount },
  "../../application/profileReadFence": require("../../application/profileReadFence.ts"),
  "../../application/coding-interview/approachChallengeSelection": require("../../application/coding-interview/approachChallengeSelection.ts"),
  "../../application/coding-interview": screenFacade,
  "./ApproachChallengeFeedback": approachFeedback,
  "./ApproachChallengeSummary": historySummary,
  "./approachChallengePresentation": require("./approachChallengePresentation.ts"),
  "./approachChallengeEntry": require("./approachChallengeEntry.ts"),
  "./approachChallengeSetupSettings": require("./approachChallengeSetupSettings.ts"),
  "../../application/coding-interview/approachChallengeSessionExit": exitService,
  "./PracticeSetupControls": setupControls,
  "./ApproachChallengeQuestion": questionContent,
  "./PracticeSessionSurface": sharedSessionSurface,
});

const PreferenceProbe = () => {
  const value = preferencesProvider.useAppPreferences();
  return React.createElement("PreferenceProbe", { ready: value.ready, settings: value.settings, settingsUnavailable: value.settingsUnavailable });
};

test("production preferences provider renders persisted settings through mocked native hooks", async () => {
  storage.installKeyValueStorageForTests(new storage.MemoryKeyValueStorage());
  await preferences.updateApproachChallengeSettings({
    mode: "manual",
    requestedProblemCount: 5,
    difficulties: ["easy", "medium"],
    selectedFamilyIds: [],
  });

  let tree: ReturnType<typeof create> | undefined;
  try {
    await act(async () => {
      tree = create(React.createElement(preferencesProvider.AppPreferencesProvider, null, React.createElement(PreferenceProbe)));
      storage.notifyProfileStorageReady();
      await Promise.resolve();
    });
    const rendered = tree!.root.findByType("PreferenceProbe").props;
    assert.equal(rendered.ready, true);
    assert.deepEqual(rendered.settings.approachChallenge, {
      mode: "manual",
      requestedProblemCount: 5,
      difficulties: ["easy", "medium"],
      selectedFamilyIds: [],
    });
  } finally {
    if (tree) await act(async () => tree!.unmount());
    storage.closeActiveProfileStorage();
  }
});

test("production Approach Challenge screen renders empty manual selection and starts only the selector's family-AND pool", async () => {
  storage.installKeyValueStorageForTests(new storage.MemoryKeyValueStorage());
  await preferences.updateApproachChallengeSettings({
    mode: "manual",
    requestedProblemCount: 5,
    difficulties: ["easy", "medium", "hard"],
    selectedFamilyIds: [],
  });
  startRequests.length = 0;

  let tree: ReturnType<typeof create> | undefined;
  const element = () => React.createElement(preferencesProvider.AppPreferencesProvider, null,
    React.createElement(approachChallengeScreen.ApproachChallengeScreen, {
      navigation: { navigate() {}, setParams() {} },
      route: { key: "approach", name: "ApproachChallenge", params: {} },
    }));
  const settle = async () => { for (let index = 0; index < 8; index += 1) await Promise.resolve(); };
  try {
    await act(async () => { tree = create(element()); await settle(); });
    assert.equal(tree.root.findAllByType("ActivityIndicator").some((indicator: TestHostNode) => indicator.props.accessibilityLabel === "Preparing session"), true,
      "the screen stays in its visible loading state until profile storage is ready");
    await act(async () => { storage.notifyProfileStorageReady(); await settle(); });
    const startButton = () => tree!.root.findAllByType("Button").find((button: TestHostNode) => button.props.children === "Start session")!;
    assert.equal(tree.root.findAllByType("Text").some((node: TestHostNode) => node.props.children === "Select at least 1 family."), true);
    assert.equal(startButton().props.disabled, true);

    assert.equal(tree.root.findAllByType("AnswerOption").some((option: TestHostNode) => option.props.text === "Prefix Sums"), false,
      "the family list starts collapsed");
    const familyToggle = () => tree!.root.findAllByType("Button").find((button: TestHostNode) => button.props.children === "Expand topic families")!;
    await act(async () => { familyToggle().props.onPress(); await settle(); });
    assert.equal(tree.root.findAllByType("Button").find((button: TestHostNode) => button.props.children === "Collapse topic families")?.props.accessibilityState.expanded, true);
    const family = tree.root.findAllByType("AnswerOption").find((option: TestHostNode) => option.props.text === "Prefix Sums");
    assert.ok(family, "expanding exposes the known taxonomy family");
    await act(async () => { family!.props.onPress(); await settle(); });
    assert.equal(tree.root.findAllByType("AnswerOption").find((option: TestHostNode) => option.props.text === "Prefix Sums")?.props.state, "selected");
    await act(async () => { tree!.root.findAllByType("Button").find((button: TestHostNode) => button.props.children === "Collapse topic families")!.props.onPress(); await settle(); });
    assert.equal(tree.root.findAllByType("AnswerOption").some((option: TestHostNode) => option.props.text === "Prefix Sums"), false);
    assert.match(String(tree.root.findAllByType("Text").map((node: TestHostNode) => node.props.children).join(" ")), /Prefix Sums/,
      "the collapsed summary keeps the current selection visible");
    await act(async () => { tree!.root.findAllByType("Button").find((button: TestHostNode) => button.props.children === "Expand topic families")!.props.onPress(); await settle(); });
    assert.equal(tree.root.findAllByType("AnswerOption").find((option: TestHostNode) => option.props.text === "Prefix Sums")?.props.state, "selected",
      "reopening preserves the selected family");

    assert.equal(startButton().props.disabled, false);
    await act(async () => { startButton().props.onPress(); await settle(); });
    const confirmButton = tree.root.findAllByType("Button").find((button: TestHostNode) => button.props.children === "Confirm shorter session");
    if (confirmButton) await act(async () => { confirmButton.props.onPress(); await settle(); });
    const request = startRequests[0] as { request: { selection: { status: string; problems: readonly { problemId: string; requiredFamilyIds: readonly string[] }[] } } } | undefined;
    assert.ok(request, "the screen submitted its production selector result to the lifecycle boundary");
    assert.equal(request.request.selection.status, "ready");
    assert.ok(request.request.selection.problems.length > 0);
    assert.ok(request.request.selection.problems.every(({ requiredFamilyIds }) => requiredFamilyIds.every((id) => id === "prefix_sums")),
      "every selected problem satisfies all required families using only the chosen family");
    assert.equal(request.request.selection.problems.some(({ problemId }) => problemId === "acm-b06-02"), false,
      "the actual hard problem requiring Prefix Sums AND Hash Map/Set is excluded when Hash Map/Set is not selected");
  } finally {
    if (tree) await act(async () => tree!.unmount());
    storage.closeActiveProfileStorage();
  }
});

test("production Approach Challenge screen withholds option keys until save and then reveals every correct Q1/Q2 option accessibly", async () => {
  storage.installKeyValueStorageForTests(new storage.MemoryKeyValueStorage());
  const problem = codingArtifact.approachChallengeProblems[0];
  const q1 = problem.approachQuestion;
  const q2 = problem.complexityQuestion;
  const q1Partial = q1.interaction.options.find((option: any) => option.grade === "partial");
  const q2Wrong = q2.interaction.options.find((option: any) => option.optionId !== q2.answer.optionId);
  assert.ok(q1Partial && q2Wrong, "fixture supplies partial Q1 and incorrect Q2 choices");
  const makeStage = (stage: "approach" | "complexity", accepted: boolean, selectedId?: string) => {
    const question = stage === "approach" ? q1 : q2;
    const { canonicalInteractionRegistry: registry } = require("../../content/canonical/interactions/registry.ts");
    const response = selectedId ? { type: question.interaction.type, optionId: selectedId } : null;
    const review = accepted ? registry.presentReview(question, response) : registry.present(question, null);
    const evaluation = accepted ? registry.evaluate(question, response) : null;
    return {
      kind: "ready",
      sessionId: "render-session",
      occurrenceId: `${stage}-occurrence`,
      problemId: problem.problemId,
      problemIndex: 1,
      problemCount: 1,
      stage,
      questionId: question.questionId,
      prompt: question.prompt,
      constraints: question.constraints ?? [],
      interaction: { interactionType: question.interaction.type, model: review },
      accepted,
      result: accepted ? { kind: stage === "approach" ? "partial" : "incorrect", earnedPoints: 0, maxPoints: 1 } : null,
      feedback: accepted ? { ...evaluation.feedback, details: stage === "approach" ? {} : evaluation.feedback.details, approachExplanation: stage === "approach" ? {
        reason: q1.feedback.reason,
        options: q1.interaction.options.filter((option: any) => option.grade === "correct").map((option: any) => ({ id: option.optionId, text: option.text, reason: option.feedback })),
      } : null } : null,
      analyzedApproachId: stage === "complexity" ? problem.analyzedApproachId : null,
      methodReveal: stage === "complexity" ? problem.methodReveal : null,
    };
  };
  const original = {
    getStage: screenFacade.getApproachChallengeStageProjection,
    submit: screenFacade.submitApproachChallengeStage,
    advance: screenFacade.advanceApproachChallengeStage,
    complete: screenFacade.completeApproachChallengeSession,
  };
  let current = makeStage("approach", false);
  let commitAnswer: (() => void) | undefined;
  activeSessionReads.value = { trackId: codingArtifact.trackId, modeId: "coding-interview-approach-challenge", status: "active" };
  screenFacade.getApproachChallengeStageProjection = async () => current;
  screenFacade.submitApproachChallengeStage = async (response: any) => {
    await new Promise<void>((resolve) => { commitAnswer = resolve; });
    current = makeStage(current.stage, true, response.optionId);
  };
  screenFacade.advanceApproachChallengeStage = async () => {
    current = makeStage("complexity", false);
    return {};
  };
  const { StackRouter, StackActions } = require("@react-navigation/routers");
  const router = StackRouter({ initialRouteName: "Home" });
  const routerOptions = { routeNames: ["Home", "ApproachChallenge", "Activity"], routeParamList: {}, routeGetIdList: {} };
  let navigationState = router.getInitialState(routerOptions);
  navigationState = router.getStateForAction(navigationState, StackActions.push("ApproachChallenge"), routerOptions);
  let completions = 0;
  screenFacade.completeApproachChallengeSession = async () => { completions++; activeSessionReads.value = null; };
  let tree: ReturnType<typeof create> | undefined;
  const element = () => React.createElement(preferencesProvider.AppPreferencesProvider, null,
    React.createElement(approachChallengeScreen.ApproachChallengeScreen, {
      navigation: { navigate() {}, setParams() {}, replace: (name: string, params: unknown) => { navigationState = router.getStateForAction(navigationState, StackActions.replace(name, params), routerOptions); } },
      route: { key: "approach-answer-review", name: "ApproachChallenge", params: {} },
    }));
  const settle = async () => { for (let index = 0; index < 8; index += 1) await Promise.resolve(); };
  try {
    await act(async () => { tree = create(element()); await settle(); });
    const optionNodes = () => tree!.root.findAllByType("AnswerOption");
    const renderedText = (): string[] => tree!.root.findAllByType("Text").map((node: TestHostNode) => node.children.filter((child: unknown) => typeof child === "string").join(""));
    assert.ok(renderedText().includes("values=[4,-2,7,3], left=1, right=3"), "example input has its own code block line");
    assert.ok(renderedText().includes("8."), "example output has its own code block line");
    assert.ok(renderedText().includes("Which method best fits this single query?"), "the question after the example remains visible");
    assert.equal(renderedText().some(text => text.includes("building an index has a cost")), false, "owner removed the extra Q1 guidance; authored prompt remains complete");
    assert.ok(tree!.root.findAllByType("Text").some((node: TestHostNode) => node.props.accessibilityRole === "header" && node.props.children === "Example:"));
    assert.equal(optionNodes().some((option: TestHostNode) => option.props.state === "correct" || String(option.props.accessibilityLabel).includes("Correct answer")), false,
      "unanswered Q1 exposes no option key");
    assert.equal(tree!.root.findAllByType(sharedDetailsDisclosure).length, 0, "no explanation before an answer is saved");
    const partial = optionNodes().find((option: TestHostNode) => option.props.text === q1Partial.text);
    assert.ok(partial);
    await act(async () => { partial!.props.onPress(); await settle(); });
    await act(async () => { tree!.root.findAllByType("Button").find((button: TestHostNode) => button.props.children === "Submit answer")!.props.onPress(); await settle(); });
    assert.equal(optionNodes().some((option: TestHostNode) => option.props.resultLabel), false, "pending save still withholds correct and partial labels");
    assert.equal(tree!.root.findAllByType(sharedDetailsDisclosure).length, 0, "pending save withholds the explanation");
    assert.equal(tree!.root.findAllByType("Button").some((button: TestHostNode) => button.props.children === "Leave session"), false, "shared exit is unavailable during an unresolved answer save");
    await act(async () => { commitAnswer!(); await settle(); });
    assert.equal(optionNodes().filter((option: TestHostNode) => option.props.resultLabel === "Correct answer").length,
      q1.interaction.options.filter((option: any) => option.grade === "correct").length,
      "durable partial Q1 answer visibly labels every correct option");
    for (const correct of optionNodes().filter((option: TestHostNode) => option.props.resultLabel === "Correct answer")) {
      assert.equal(correct.props.state, "omitted_correct");
      assert.equal(correct.props.accessibilityState.checked, false, "revealing an optimal option does not pretend the user selected it");
    }
    const selectedPartial = optionNodes().find((option: TestHostNode) => option.props.text === q1Partial.text);
    assert.equal(selectedPartial?.props.state, "partial", "Almost has its own warning state instead of incorrect red");
    assert.equal(selectedPartial?.props.resultLabel, "Almost");
    assert.equal(selectedPartial?.props.accessibilityState.checked, true);
    assert.match(String(selectedPartial?.props.accessibilityLabel), /Almost/, "selected partial result is announced in the accessible label");
    assert.equal(tree!.root.findAllByType(sharedFeedback.PracticeFeedbackContent).length, 1, "ACM mounts the actual same Reason/Details component as ordinary quiz");
    assert.equal(tree!.root.findAllByType("InfoBlock").some((node: TestHostNode) => ["Correct", "Almost", "Incorrect"].includes(node.props.title)), false);
    assert.ok(renderedText().includes(q1Partial.feedback), "the selected partial option keeps its authored explanation visibly in Reason");
    const disclosure = () => tree!.root.findByType(sharedDetailsDisclosure);
    assert.equal(tree!.root.findAllByType("Text").some((node: TestHostNode) => node.props.children === "Details"), true);
    assert.equal(disclosure().props.expanded, false);
    assert.equal(renderedText().includes(q1.interaction.options.find((option: any) => option.grade === "correct").feedback), false, "best-approach explanation starts collapsed");
    await act(async () => { tree!.root.findAllByType("Pressable").find((node: TestHostNode) => node.props.accessibilityLabel === (disclosure().props.expanded ? "Hide answer details" : "Show answer details"))!.props.onPress(); });
    assert.equal(disclosure().props.expanded, true);
    assert.ok(renderedText().includes(q1.feedback.reason));
    for (const option of q1.interaction.options.filter((option: any) => option.grade === "correct")) {
      assert.ok(renderedText().includes(option.feedback), "Details includes the authored rationale for each optimal approach");
    }
    assert.equal(renderedText().includes(q2.feedback.reason), false, "Q1 Details does not disclose the Q2 complexity answer");

    await act(async () => { tree!.root.findAllByType("Button").find((button: TestHostNode) => button.props.children === "Continue to complexity")!.props.onPress(); await settle(); });
    assert.equal(tree.root.findAllByType("Text").some((node: TestHostNode) => String(node.props.children).includes(problem.methodReveal.title)), true,
      "the intentionally disclosed Q1 method is present while answering Q2");
    assert.equal(optionNodes().some((option: TestHostNode) => option.props.state === "correct" || String(option.props.accessibilityLabel).includes("Correct answer")), false,
      "unanswered Q2 exposes no option key");
    assert.equal(tree!.root.findAllByType(sharedDetailsDisclosure).length, 0, "expanded Q1 explanation does not carry into unanswered Q2");
    const wrong = optionNodes().find((option: TestHostNode) => option.props.text === q2Wrong.text);
    assert.ok(wrong);
    await act(async () => { wrong!.props.onPress(); await settle(); });
    await act(async () => { tree!.root.findAllByType("Button").find((button: TestHostNode) => button.props.children === "Submit answer")!.props.onPress(); await settle(); });
    await act(async () => { commitAnswer!(); await settle(); });
    assert.equal(optionNodes().filter((option: TestHostNode) => option.props.resultLabel === "Correct answer").length, 1,
      "durable incorrect Q2 answer reveals the correct complexity option");
    assert.equal(disclosure().props.expanded, false, "new stages start with Details collapsed");
    await act(async () => { tree!.root.findAllByType("Pressable").find((node: TestHostNode) => node.props.accessibilityLabel === (disclosure().props.expanded ? "Hide answer details" : "Show answer details"))!.props.onPress(); });
    assert.ok(Array.isArray(q2.feedback.details) && q2.feedback.details.length > 0, "the canonical Q2 supplies an authored lesson");
    for (const paragraph of q2.feedback.details) {
      assert.equal(typeof paragraph, "string", "each canonical Q2 lesson paragraph is learner text");
      assert.ok(paragraph.trim().length > 0);
      assert.ok(renderedText().includes(paragraph), "expanded Details reveals every full authored Q2 lesson paragraph");
    }
    const selectedWrong = optionNodes().find((option: TestHostNode) => option.props.text === q2Wrong.text);
    assert.equal(selectedWrong?.props.state, "incorrect");
    assert.match(String(selectedWrong?.props.accessibilityLabel), /Incorrect/);
    await act(async () => { tree!.root.findAllByType("Button").find((button: TestHostNode) => button.props.children === "Finish session")!.props.onPress(); await settle(); });
    assert.equal(completions, 1);
    assert.deepEqual(navigationState.routes.map((route: { name: string }) => route.name), ["Home", "ApproachChallenge"], "completion replaces the runner with exact summary");
    navigationState = router.getStateForAction(navigationState, StackActions.pop(), routerOptions);
    assert.equal(navigationState.routes[navigationState.index].name, "Home", "Summary Back cannot expose a stale Finish button");
  } finally {
    if (tree) await act(async () => tree!.unmount());
    activeSessionReads.value = null;
    screenFacade.getApproachChallengeStageProjection = original.getStage;
    screenFacade.submitApproachChallengeStage = original.submit;
    screenFacade.advanceApproachChallengeStage = original.advance;
    screenFacade.completeApproachChallengeSession = original.complete;
    storage.closeActiveProfileStorage();
  }
});

test("profile A to B activation reloads real provider settings after the navigation screen remounts", async () => {
  const base = new storage.MemoryKeyValueStorage();
  const control = new MemoryControlStore();
  const identity = { async create() { return { installationId: "00000000-0000-4000-8000-000000000022", localDatasetId: "00000000-0000-4000-8000-000000000021" }; } };
  let router = await profileStorageRouter.openProfileStorageRouter(base, control, { identity });
  storage.setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
  let tree: ReturnType<typeof create> | undefined;
  const screenElement = () => React.createElement(approachChallengeScreen.ApproachChallengeScreen, {
    navigation: { navigate() {}, setParams() {} },
    route: { key: "approach", name: "ApproachChallenge", params: {} },
  });
  const element = (showScreen: boolean) => React.createElement(preferencesProvider.AppPreferencesProvider, null,
    showScreen ? screenElement() : React.createElement("ProfileTransitionSurface"));
  const settle = async () => { for (let index = 0; index < 8; index += 1) await Promise.resolve(); };
  try {
    const profileA = await storage.prepareProfileStorage();
    storage.activatePreparedProfile(profileA.id, profileA.kind);
    await preferences.updateApproachChallengeSettings({
      mode: "manual",
      requestedProblemCount: 5,
      difficulties: ["easy", "medium"],
      selectedFamilyIds: [],
    });

    await act(async () => { tree = create(element(true)); await settle(); });
    const hasFamilyError = () => tree!.root.findAllByType("Text").some((node: TestHostNode) => node.props.children === "Select at least 1 family.");
    assert.equal(hasFamilyError(), true, "screen A preserves its saved empty manual choice");

    // AppNavigation replaces its navigator subtree with ProfileTransitionSurface during this real transition.
    await act(async () => tree!.update(element(false)));
    assert.equal(tree!.root.findAllByType("Screen").length, 0, "the transition surface unmounted the screen subtree");
    storage.closeActiveProfileStorage();
    addRegisteredGuest(control, "00000000-0000-4000-8000-000000000023");
    router = await profileStorageRouter.openProfileStorageRouter(base, control, {
      identity,
      onBeforeProfileCommit: storage.beginProfileTransition,
    });
    storage.setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
    await storage.prepareProfileStorage();
    const selectedB = await storage.selectPreparedGuestProfile("00000000-0000-4000-8000-000000000023");
    storage.activatePreparedProfile(selectedB.profile.id, selectedB.profile.kind);

    await act(async () => { await settle(); });
    await act(async () => tree!.update(element(true)));
    await act(async () => { await settle(); });
    assert.equal(hasFamilyError(), false, "new profile B defaults to all families");
    assert.equal(tree!.root.findAllByType("Button").some((node: TestHostNode) => node.props.children === "Automatic" || node.props.children === "Manual"), false);
    assert.equal(await settingsRepository.getSettings(), null, "profile B has no persisted app settings");
    assert.deepEqual(await preferences.loadAppSettings(), { appearance: "system", language: "en" });
  } finally {
    if (tree) await act(async () => tree!.unmount());
    storage.closeActiveProfileStorage();
    storage.setProfileStoragePreparationFactoryForTests(null);
  }
});

test("an explicit history route wins over a different active session while real settings hydrate", async () => {
  storage.installKeyValueStorageForTests(new storage.MemoryKeyValueStorage());
  activeSessionReads.count = 0;
  discoveryReads = 0;
  activeSessionReads.value = { id: "different-active-session", trackId: "another-track", modeId: "legacy", status: "active" };
  await preferences.updateApproachChallengeSettings({
    mode: "manual",
    requestedProblemCount: 5,
    difficulties: ["easy", "medium"],
    selectedFamilyIds: ["arrays_and_strings"],
  });
  const requested: string[] = [];
  let resolveHistory!: (value: unknown) => void;
  const historyPending = new Promise((resolve) => { resolveHistory = resolve; });
  screenFacade.getApproachChallengeDetailedHistory = async (sessionId?: string) => { if (sessionId) requested.push(sessionId); return historyPending; };
  let tree: ReturnType<typeof create> | undefined;
  const element = () => React.createElement(preferencesProvider.AppPreferencesProvider, null,
    React.createElement(React.Fragment, null,
      React.createElement(PreferenceProbe),
      React.createElement(approachChallengeScreen.ApproachChallengeScreen, {
        navigation: { navigate() {}, setParams() {} },
        route: { key: "approach-history", name: "ApproachChallenge", params: { sessionId: "saved-session-42" } },
      })));
  const settle = async () => { for (let index = 0; index < 8; index += 1) await Promise.resolve(); };
  try {
    await act(async () => {
      tree = create(element());
      storage.notifyProfileStorageReady();
      await settle();
    });
    const preferenceState = tree!.root.findByType("PreferenceProbe").props;
    assert.equal(preferenceState.ready, true);
    assert.equal(preferenceState.settings.approachChallenge.mode, "manual");
    assert.deepEqual(requested, ["saved-session-42"]);
    assert.equal(activeSessionReads.count, 0, "an explicit route never reads or resumes the different active session");
    assert.equal(discoveryReads, 0, "history entry does not resolve the selection catalog while preferences hydrate");

    await act(async () => { resolveHistory(historyDetail("saved-session-42")); await settle(); });
    assert.equal(tree!.root.findAllByType(sharedOverview.SessionResultOverview).length, 1);
    assert.equal(tree!.root.findAllByType("Pressable").length, 0, "history list starts collapsed");
    await act(async () => { tree!.root.findAllByType("Button").find((button: TestHostNode) => button.props.children === "Review answers")!.props.onPress(); });
    assert.equal(tree!.root.findAllByType("Pressable").length, 1, "expanded history has one row for the paired problem");
  } finally {
    if (tree) await act(async () => tree!.unmount());
    screenFacade.getApproachChallengeDetailedHistory = async () => ({ kind: "unavailable", reason: "session_unavailable" });
    storage.closeActiveProfileStorage();
  }
});

test("corrupt preferences show setup unavailable and a separate warning on saved history", async () => {
  storage.installKeyValueStorageForTests(new storage.MemoryKeyValueStorage());
  storage.getKeyValueStorage().setString(require("../../storage/keys.ts").STORAGE_KEYS.SETTINGS, "not-valid-json");
  let tree: ReturnType<typeof create> | undefined;
  const route = (sessionId?: string) => ({ key: "approach-corrupt", name: "ApproachChallenge", params: sessionId ? { sessionId } : {} });
  const render = (sessionId?: string) => React.createElement(preferencesProvider.AppPreferencesProvider, null,
    React.createElement(approachChallengeScreen.ApproachChallengeScreen, {
      navigation: { navigate() {}, setParams() {} }, route: route(sessionId),
    }));
  const settle = async () => { for (let index = 0; index < 8; index += 1) await Promise.resolve(); };
  try {
    await act(async () => { tree = create(render()); storage.notifyProfileStorageReady(); await settle(); });
    assert.equal(tree!.root.findAllByType("EmptyState").some((state: TestHostNode) => state.props.title === "Approach Challenge settings unavailable"), true);

    screenFacade.getApproachChallengeDetailedHistory = async (sessionId?: string) => historyDetail(sessionId ?? "saved-session-43");
    await act(async () => { tree!.update(render("saved-session-43")); await settle(); });
    assert.equal(tree!.root.findAllByType(sharedOverview.SessionResultOverview).length, 1);
    assert.equal(tree!.root.findAllByType("InfoBlock").some((block: TestHostNode) => block.props.title === "Approach Challenge settings unavailable"), true);
  } finally {
    if (tree) await act(async () => tree!.unmount());
    screenFacade.getApproachChallengeDetailedHistory = async () => ({ kind: "unavailable", reason: "session_unavailable" });
    storage.closeActiveProfileStorage();
  }
});

class MemoryControlStore {
  values = new Map<string, string>();
  async get(key: string) { return this.values.get(key) ?? null; }
  async set(key: string, value: string) { this.values.set(key, value); }
  async remove(key: string) { this.values.delete(key); }
}

type TestHostNode = { props: Record<string, any>; children: readonly unknown[] };

function addRegisteredGuest(control: InstanceType<typeof MemoryControlStore>, id: string) {
  const slots = ["patternly.profile-root.v1.a", "patternly.profile-root.v1.b"];
  const latest = slots
    .map((key) => ({ key, raw: control.values.get(key) ?? null, registry: JSON.parse(control.values.get(key) ?? "null") }))
    .filter((entry) => entry.registry !== null)
    .sort((left, right) => Number(right.registry.generation) - Number(left.registry.generation))[0];
  assert.ok(latest, "profile fixture has a registered storage root");
  const current = latest.registry as { generation: number; profiles: unknown[]; legacyProfileId: string | null; selectedProfileId: string };
  const body = {
    version: 1,
    generation: current.generation + 1,
    profiles: [...current.profiles, { id, kind: "guest", accountId: null }],
    legacyProfileId: current.legacyProfileId,
    selectedProfileId: current.selectedProfileId,
  };
  control.values.set(slots.find((key) => key !== latest.key)!, JSON.stringify({ ...body, checksum: sha256Utf8(JSON.stringify(body)) }));
}

function historyDetail(sessionId: string) {
  const stage = (stageName: "approach" | "complexity", occurrenceId: string) => ({
    stage: stageName,
    occurrenceId,
    questionId: `${occurrenceId}-question`,
    prompt: `Saved history for ${sessionId}`,
    constraints: [],
    interaction: { interactionType: "choice_single", model: { renderer: { options: [{ id: "saved", text: "Saved answer", selected: true }] } } },
    response: { optionId: "saved" },
    result: null,
    feedback: null,
  });
  return {
    kind: "ready",
    sessionId,
    status: "completed",
    startedAt: "2026-10-30T10:00:00.000Z",
    completedAt: "2026-10-30T10:05:00.000Z",
    contentVersion: codingArtifact.contentVersion,
    artifactSha256: codingArtifactIdentity.sha256,
    summary: { elapsedForegroundMs: 12000, requestedLength: 2, totalOccurrences: 2, answeredCount: 2, unansweredCount: 0,
      score: { correctCount: 1, partialCount: 0, incorrectCount: 1 }, points: { earned: 1, max: 2 } },
    problems: [{
      problemId: "ACM-INTEGRATION-HISTORY-01",
      problemVersion: "1",
      contentVersion: codingArtifact.contentVersion,
      artifactSha256: codingArtifactIdentity.sha256,
      primaryFamilyId: "arrays_and_strings",
      requiredFamilyIds: ["arrays_and_strings"],
      difficulty: "easy",
      analyzedApproachId: "saved-method",
      methodReveal: null,
      stages: [stage("approach", `${sessionId}:approach`), stage("complexity", `${sessionId}:complexity`)],
    }],
  };
}

test("saved ACM details return to the shared Activity history", async () => {
  storage.installKeyValueStorageForTests(new storage.MemoryKeyValueStorage());
  activeSessionReads.value = null;
  const originalDetail = screenFacade.getApproachChallengeDetailedHistory;
  screenFacade.getApproachChallengeDetailedHistory = async () => ({ ...historyDetail("shared-history-session"), status: "abandoned" });
  const routes: string[] = [];
  let tree: ReturnType<typeof create> | undefined;
  try {
    await act(async () => {
      tree = create(React.createElement(preferencesProvider.AppPreferencesProvider, null,
        React.createElement(approachChallengeScreen.ApproachChallengeScreen, {
          navigation: { navigate() {}, popTo: (route: string) => routes.push(route), setParams() {} },
          route: { key: "shared-history", name: "ApproachChallenge", params: { sessionId: "shared-history-session" } },
        })));
      storage.notifyProfileStorageReady(); for (let i = 0; i < 12; i++) await Promise.resolve();
    });
    assert.equal(tree!.root.findByType(sharedOverview.SessionResultOverview).props.completion, "endedEarly");
    await act(async () => { tree!.root.findByType("Screen").props.backAction.onPress(); });
    assert.deepEqual(routes, ["Activity"]);
  } finally {
    if (tree) await act(async () => tree!.unmount());
    screenFacade.getApproachChallengeDetailedHistory = originalDetail;
    storage.closeActiveProfileStorage();
  }
});

test("setup defaults all families, supports bulk selection, and remembers a deliberately empty choice", async () => {
  storage.installKeyValueStorageForTests(new storage.MemoryKeyValueStorage());
  activeSessionReads.value = null;
  let tree: ReturnType<typeof create> | undefined;
  const settle = async () => { for (let index = 0; index < 12; index++) await Promise.resolve(); };
  const element = () => React.createElement(preferencesProvider.AppPreferencesProvider, null,
    React.createElement(approachChallengeScreen.ApproachChallengeScreen, {
      navigation: { navigate() {}, setParams() {} }, route: { key: "bulk-settings", name: "ApproachChallenge", params: {} },
    }));
  const button = (label: string) => tree!.root.findAllByType("Button").find((node: TestHostNode) => node.props.children === label)!;
  const familyCount = require("./approachChallengeSetupSettings.ts").ALL_APPROACH_CHALLENGE_FAMILY_IDS.length;
  try {
    await act(async () => { tree = create(element()); storage.notifyProfileStorageReady(); await settle(); });
    assert.equal(await settingsRepository.getSettings(), null, "first-use defaults do not trigger a migration write");
    assert.equal(tree!.root.findAllByType("Button").some((node: TestHostNode) => node.props.children === "Manual" || node.props.children === "Automatic"), false);
    assert.equal(tree!.root.findByType("Screen").props.footerVariant, "sticky");
    assert.equal(button("Start session").props.disabled, false);
    assert.equal(button("Select all"), undefined, "bulk actions are progressively disclosed");
    assert.equal(button("View history"), undefined, "history is shared through Activity");
    assert.equal(tree!.root.findAllByType("Text").some((node: TestHostNode) => typeof node.props.children === "string" && node.props.children.includes("problems available")), false);
    for (const label of ["Easy", "Medium", "Hard"]) {
      const text = tree!.root.findAllByType("Text").find((node: TestHostNode) => node.props.children === label)!;
      assert.ok(text.props.style.some((style: { fontWeight?: string } | null) => style?.fontWeight === "500"));
    }
    await act(async () => { button("Expand topic families").props.onPress(); await settle(); });
    assert.equal(tree!.root.findAllByType("AnswerOption").filter((node: TestHostNode) => node.props.state === "selected").length, familyCount);
    await act(async () => { button("Unselect all").props.onPress(); await settle(); });
    assert.equal(tree!.root.findAllByType("AnswerOption").filter((node: TestHostNode) => node.props.state === "selected").length, 0);
    assert.equal(button("Start session").props.disabled, true);
    assert.ok(tree!.root.findAllByType("Text").some((node: TestHostNode) => node.props.accessibilityRole === "alert" && node.props.children === "Select at least 1 family."));
    assert.deepEqual((await settingsRepository.getSettings()).approachChallenge.selectedFamilyIds, []);
    await act(async () => { button("Select all").props.onPress(); await settle(); });
    assert.equal(tree!.root.findAllByType("AnswerOption").filter((node: TestHostNode) => node.props.state === "selected").length, familyCount);
    const count = tree!.root.findAllByType("Pressable").find((node: TestHostNode) => node.props.accessibilityLabel === "10 problems")!;
    assert.equal(count.props.accessibilityRole, "radio");
    await act(async () => { count.props.onPress(); await settle(); });
    const hard = tree!.root.findAllByType("Pressable").find((node: TestHostNode) => node.props.accessibilityLabel === "Hard")!;
    assert.equal(hard.props.accessibilityRole, "checkbox");
    await act(async () => { hard.props.onPress(); await settle(); });
    const saved = (await settingsRepository.getSettings()).approachChallenge;
    assert.equal(saved.mode, "manual"); assert.equal(saved.requestedProblemCount, 10);
    assert.deepEqual(saved.difficulties, ["easy", "medium", "hard"]);
    await act(async () => { button("Unselect all").props.onPress(); await settle(); });
    await act(async () => { tree!.unmount(); tree = create(element()); storage.notifyProfileStorageReady(); await settle(); });
    assert.equal(button("Start session").props.disabled, true);
    assert.ok(tree!.root.findAllByType("Text").some((node: TestHostNode) => node.props.children === "Select at least 1 family."));
  } finally {
    if (tree) await act(async () => tree!.unmount());
    storage.closeActiveProfileStorage();
  }
});

for (const access of ["unavailable", "denied"]) test(`setup retains a specific ${access === "unavailable" ? "Premium verification" : "no matching problems"} error`, async () => {
  storage.installKeyValueStorageForTests(new storage.MemoryKeyValueStorage());
  activeSessionReads.value = null;
  await preferences.updateApproachChallengeSettings({ mode: "manual", requestedProblemCount: 5, difficulties: ["easy", "medium"], selectedFamilyIds: ["arrays_and_strings"] });
  const previousAccess = testAccount.readCurrentPremiumAccess;
  testAccount.readCurrentPremiumAccess = () => access;
  let tree: ReturnType<typeof create> | undefined;
  try {
    await act(async () => {
      tree = create(React.createElement(preferencesProvider.AppPreferencesProvider, null,
        React.createElement(approachChallengeScreen.ApproachChallengeScreen, {
          navigation: { navigate() {}, setParams() {} }, route: { key: `error-${access}`, name: "ApproachChallenge", params: {} },
        })));
      storage.notifyProfileStorageReady(); for (let index = 0; index < 12; index++) await Promise.resolve();
    });
    const alerts = tree!.root.findAllByType("Text").filter((node: TestHostNode) => node.props.accessibilityRole === "alert").map((node: TestHostNode) => node.props.children);
    assert.ok(alerts.includes(access === "unavailable" ? "Premium access could not be checked. Try again when you are online." : "No problems match these choices. Change your topic families or difficulty."));
    assert.equal(alerts.includes("Select at least 1 family."), false);
    assert.equal(tree!.root.findAllByType("InfoBlock").some((node: TestHostNode) => node.props.title === "No problems available"), false);
  } finally {
    if (tree) await act(async () => tree!.unmount());
    testAccount.readCurrentPremiumAccess = previousAccess;
    storage.closeActiveProfileStorage();
  }
});

for (const intent of ["end", "pause", "back", "blocked"] as const) {
  test(`shared quiz exit ${intent}: cancel, checkpoint recovery and verified navigation`, async () => {
    storage.installKeyValueStorageForTests(new storage.MemoryKeyValueStorage());
    const originalStage = screenFacade.getApproachChallengeStageProjection;
    const ending = intent === "end" || intent === "blocked";
    const method = ending ? "endApproachChallengeSession" : "pauseApproachChallengeSession";
    const originalExit = exitService[method];
    const question = codingArtifact.approachChallengeProblems[0].approachQuestion;
    const { canonicalInteractionRegistry } = require("../../content/canonical/interactions/registry.ts");
    screenFacade.getApproachChallengeStageProjection = async () => ({
      kind: "ready", sessionId: "confirmed-ui-session", occurrenceId: "unanswered-ui-stage", problemId: "ui-problem", problemIndex: 1, problemCount: 5,
      stage: "approach", questionId: question.questionId, prompt: question.prompt, constraints: [],
      interaction: { interactionType: question.interaction.type, model: canonicalInteractionRegistry.present(question, null) },
      accepted: false, result: null, feedback: null, analyzedApproachId: null, methodReveal: null,
    });
    activeSessionReads.value = { trackId: codingArtifact.trackId, modeId: "coding-interview-approach-challenge", status: "active" };
    const commands: string[] = [], navigations: unknown[] = [];
    let acknowledge!: (result: any) => void;
    let rejectExit!: (error: unknown) => void;
    const initialAction = ending ? "end" : "pause";
    const recovery = ending ? "recover_abandonment" : "retry_checkpoint";
    exitService[method] = async (id, action, assertCurrent) => {
      assert.equal(id, "confirmed-ui-session");
      assertCurrent!();
      commands.push(action!);
      if (action === initialAction) return new Promise((resolve, reject) => { acknowledge = resolve; rejectExit = reject; });
      return { kind: ending ? "ended" : "paused", session: { id } };
    };
    const settle = async () => { for (let index = 0; index < 8; index++) await Promise.resolve(); };
    const backAction = { type: "GO_BACK", source: "early-exit-screen" };
    let tree: ReturnType<typeof create> | undefined;
    try {
      await act(async () => {
        tree = create(React.createElement(preferencesProvider.AppPreferencesProvider, null, React.createElement(approachChallengeScreen.ApproachChallengeScreen, {
          navigation: {
            navigate: (name: string) => navigations.push({ navigate: name }), setParams() {},
            replace: (name: string, params: unknown) => navigations.push({ replace: name, params }),
            popTo: (name: string) => navigations.push({ popTo: name }),
            canGoBack: () => true, goBack: () => navigations.push("back"),
            dispatch: (action: unknown) => navigations.push({ dispatch: action }),
          },
          route: { key: "shared-exit-ui", name: "ApproachChallenge", params: {} },
        })));
        await settle();
      });
      const buttons = () => tree!.root.findAllByType("Button");
      const leaveButton = () => buttons().find((button: TestHostNode) => button.props.children === "Leave session")!;
      assert.ok(tree!.root.findAllByType(sharedSessionSurface.ActionBar).length, "the ordinary quiz ActionBar is mounted, not a second implementation");
      assert.equal(leaveButton().props.labelStyle.fontSize, 13, "same small secondary action typography as ordinary quiz");
      assert.equal(removalGuard.enabled, true);
      await act(async () => { leaveButton().props.onPress(); });
      assert.equal(tree!.root.findAllByType(sharedSessionSurface.ExitModal).length, 1, "the ordinary quiz sheet is mounted");
      assert.equal(tree!.root.findAllByType("Modal").length, 1);
      assert.deepEqual(commands, []);
      for (const label of ["Keep learning", "Pause and resume later", "End and view summary"]) assert.ok(buttons().some((button: TestHostNode) => button.props.children === label));
      await act(async () => { buttons().find((button: TestHostNode) => button.props.children === "Keep learning")!.props.onPress(); });
      assert.equal(tree!.root.findAllByType("Modal").length, 0);
      assert.deepEqual(commands, []);
      assert.deepEqual(navigations, []);
      await act(async () => {
        if (intent === "back" || intent === "blocked") removalGuard.callback({ data: { action: backAction } });
        else leaveButton().props.onPress();
      });
      const confirm = buttons().find((button: TestHostNode) => button.props.children === (ending ? "End and view summary" : "Pause and resume later"))!.props.onPress;
      await act(async () => { confirm(); confirm(); await settle(); });
      assert.deepEqual(commands, [initialAction], "double tap cannot create a second exit command");
      assert.deepEqual(navigations, [], "remains on the question while checkpoint/end is unverified");
      assert.equal(tree!.root.findAllByType("Modal").length, 0);
      assert.ok(tree!.root.findAllByType("AnswerOption").every((option: TestHostNode) => option.props.disabled));
      if (intent === "blocked") {
        await act(async () => { rejectExit(Error("ending_unavailable")); await settle(); });
        const fallback = buttons().find((button: TestHostNode) => button.props.children === "Back to practice")!;
        await act(async () => { fallback.props.onPress(); });
        assert.deepEqual(navigations, [{ popTo: "PracticeHub" }], "fallback removes this runner rather than pushing a hub above it");
        const { StackRouter, StackActions } = require("@react-navigation/routers");
        const router = StackRouter({ initialRouteName: "Home" });
        const options = { routeNames: ["Home", "ApproachChallenge", "PracticeHub"], routeParamList: {}, routeGetIdList: {} };
        let state = router.getInitialState(options);
        state = router.getStateForAction(state, StackActions.push("ApproachChallenge"), options);
        state = router.getStateForAction(state, StackActions.popTo("PracticeHub"), options);
        assert.deepEqual(state.routes.map((route: any) => route.name), ["Home", "PracticeHub"]);
        state = router.getStateForAction(state, StackActions.pop(), options);
        assert.equal(state.routes[state.index].name, "Home", "Back cannot reveal the stale unguarded runner");
        return;
      }
      await act(async () => { acknowledge({ kind: ending ? "not_ended" : "not_paused", nextAction: recovery }); await settle(); });
      assert.deepEqual(navigations, [], "a pending exit never looks like success");
      assert.equal(buttons().some((button: TestHostNode) => button.props.children === "Submit answer" || button.props.children === "Leave session"), false);
      const retry = buttons().find((button: TestHostNode) => button.props.children === (ending ? "Check session status" : "Try again"))!;
      await act(async () => { retry.props.onPress(); await settle(); });
      assert.deepEqual(commands, [initialAction, recovery], "pause recovery uses only pause operations, never end");
      assert.deepEqual(JSON.parse(JSON.stringify(navigations)), ending ? [{ replace: "ApproachChallenge", params: { sessionId: "confirmed-ui-session" } }]
        : intent === "back" ? [{ dispatch: backAction }] : ["back"]);
      assert.equal(removalGuard.enabled, false, "verified navigation cannot reopen the exit sheet");
    } finally {
      if (tree) await act(async () => tree!.unmount());
      screenFacade.getApproachChallengeStageProjection = originalStage;
      exitService[method] = originalExit;
      activeSessionReads.value = null;
    }
  });
}

test("history shares actual quiz Details for all outcomes and withholds unanswered stages", async () => {
  storage.installKeyValueStorageForTests(new storage.MemoryKeyValueStorage());
  activeSessionReads.value = null;
  const originalDetail = screenFacade.getApproachChallengeDetailedHistory;
  const problem = codingArtifact.approachChallengeProblems[0];
  const registry = require("../../content/canonical/interactions/registry.ts").canonicalInteractionRegistry;
  const selectors = require("../../testing/runtimeSelectors.ts").runtimeSelectors;
  let tree: ReturnType<typeof create> | undefined;
  try {
    for (const [grade, q2Correct] of [["partial", true], ["correct", false], ["incorrect", null]] as const) {
      const q1 = problem.approachQuestion.interaction.options.find((option: any) => option.grade === grade);
      const q2 = q2Correct === null ? null : problem.complexityQuestion.interaction.options.find((option: any) => (option.optionId === problem.complexityQuestion.answer.optionId) === q2Correct);
      const stages = (["approach", "complexity"] as const).map((stage): any => {
        const question = stage === "approach" ? problem.approachQuestion : problem.complexityQuestion;
        const option = stage === "approach" ? q1 : q2;
        const response = option ? { type: question.interaction.type, optionId: option.optionId } : null;
        const evaluation = response ? registry.evaluate(question, response) : null;
        return { stage, occurrenceId: `history-${grade}-${stage}`, questionId: question.questionId, prompt: question.prompt, constraints: [],
          interaction: { interactionType: question.interaction.type, model: response ? registry.presentReview(question, response) : registry.present(question, null) }, response, result: evaluation?.result ?? null,
          feedback: evaluation ? { ...evaluation.feedback, details: stage === "approach" ? {} : evaluation.feedback.details, approachExplanation: stage === "approach" ? {
            reason: question.feedback.reason, options: question.interaction.options.filter((entry: any) => entry.grade === "correct")
              .map((entry: any) => ({ id: entry.optionId, text: entry.text, reason: entry.feedback })),
          } : null } : null };
      });
      screenFacade.getApproachChallengeDetailedHistory = async () => ({ ...historyDetail(`history-${grade}`),
        status: q2Correct === null ? "abandoned" : "completed", problems: [{ ...problem, methodReveal: null, stages }] });
      await act(async () => {
        tree = create(React.createElement(preferencesProvider.AppPreferencesProvider, null,
          React.createElement(historyReview.ApproachChallengeReviewScreen, {
            navigation: { navigate() {}, setParams() {}, popTo() {} },
            route: { key: `history-${grade}`, name: "ApproachChallengeReview", params: { sessionId: `history-${grade}`, approachOccurrenceId: `history-${grade}-approach` } },
          })));
        storage.notifyProfileStorageReady(); for (let i = 0; i < 12; i++) await Promise.resolve();
      });
      const text = () => tree!.root.findAllByType("Text").map((node: TestHostNode) => node.children.filter((child: unknown) => typeof child === "string").join(""));
      const answered = stages.filter((stage) => stage.response);
      const renderedOptions = tree!.root.findAllByType("AnswerOption");
      assert.equal(renderedOptions.length, stages.reduce((sum, stage) => sum + readOptionsForTest(stage.interaction.model).length, 0), "review renders every exact option");
      assert.deepEqual(renderedOptions.filter((node: TestHostNode) => node.props.accessibilityState.checked).map((node: TestHostNode) => node.props.state), answered.map((stage) => stage.result.kind));
      for (const stage of answered) {
        const correctTexts = readOptionsForTest(stage.interaction.model).filter((option: any) => option.reviewState === "correct" || option.reviewState === "omitted_correct").map((option: any) => option.text);
        for (const correctText of correctTexts) {
          const rendered = renderedOptions.find((node: TestHostNode) => node.props.text === correctText);
          assert.ok(rendered && ["correct", "omitted_correct"].includes(rendered.props.state));
          assert.equal(rendered.props.resultLabel, "Correct answer");
          const actualControl = rendered.findByType("Pressable");
          const border = Object.assign({}, ...actualControl.props.style({ pressed: false }).filter(Boolean));
          assert.equal(border.borderWidth, 2, "actual correct AnswerOption retains the strong green outline");
          if (rendered.props.state === "omitted_correct") assert.equal(border.borderStyle, "solid", "unselected correct answers use the actual solid outline");
          assert.equal(actualControl.props.accessibilityState.checked, rendered.props.accessibilityState.checked);
        }
      }
      assert.equal(tree!.root.findAllByType(sharedFeedback.PracticeFeedbackContent).length, answered.length);
      assert.equal(tree!.root.findAllByType("InfoBlock").some((node: TestHostNode) => ["Correct", "Almost", "Incorrect"].includes(node.props.title)), false);
      assert.equal(tree!.root.findAllByType("ContentReportSheet").length, 0);
      for (const stage of answered) {
        assert.ok(text().includes(stage.feedback.reason), "exact selected-option reason is visible while Details is collapsed");
        const toggle = () => tree!.root.findAllByType("Pressable").find((node: TestHostNode) => node.props.testID === selectors.session.detailsToggle(stage.occurrenceId))!;
        assert.equal(toggle().props.accessibilityState.expanded, false);
        await act(async () => { toggle().props.onPress(); });
        assert.equal(toggle().props.accessibilityState.expanded, true);
        if (stage.stage === "approach") {
          assert.ok(text().includes(problem.approachQuestion.feedback.reason));
          const feedbackCopy = tree!.root.findAllByType(sharedFeedback.PracticeFeedbackContent).find((node: TestHostNode) => node.props.itemId === stage.occurrenceId)!
            .findAllByType("Text").map((node: TestHostNode) => node.children.filter((child: unknown) => typeof child === "string").join(""));
          assert.equal(feedbackCopy.includes(q1.optionId), false, "technical option ID is not explanation prose; option letters are legitimate controls");
          for (const option of stage.feedback.approachExplanation.options) assert.ok(text().includes(option.text));
        } else {
          for (const line of require("./feedbackDetails.ts").detailLines(stage.feedback.details)) assert.ok(text().includes(line));
        }
        await act(async () => { toggle().props.onPress(); });
        assert.equal(toggle().props.accessibilityState.expanded, false);
      }
      if (q2Correct === null) assert.ok(text().includes("Not answered"));
      await act(async () => tree!.unmount()); tree = undefined;
    }
  } finally {
    if (tree) await act(async () => tree!.unmount());
    screenFacade.getApproachChallengeDetailedHistory = originalDetail;
    storage.closeActiveProfileStorage();
  }
});

test("ordinary quiz wrapper retains source/report behavior around the same shared Details renderer", async () => {
  storage.installKeyValueStorageForTests(new storage.MemoryKeyValueStorage());
  const url = "https://example.com/reference";
  const opened: string[] = [];
  let tree: ReturnType<typeof create> | undefined;
  try {
    await act(async () => {
      tree = create(React.createElement(preferencesProvider.AppPreferencesProvider, null,
        React.createElement(sharedFeedback.PracticeFeedbackBlock, {
          feedback: { reason: "Authored quiz reason.", result: "incorrect", details: ["Complete explanation.", url],
            messages: [{ kind: "wrong_option", targetId: "chosen", text: "Selected distractor explanation." }],
            sources: [{ url, host: "example.com", role: "documentation", title: "Reference" }] },
          item: { trackId: "track", questionId: "question", contentVersion: "1", artifactSha256: "a".repeat(64) },
          itemId: "ordinary-question", reportSurface: { modeRoute: "practice_feedback_details", trackNode: null },
          openSource: async (target: string) => { opened.push(target); throw Error("test-open-failure"); },
        })));
      storage.notifyProfileStorageReady(); for (let i = 0; i < 12; i++) await Promise.resolve();
    });
    assert.equal(tree!.root.findAllByType(sharedFeedback.PracticeFeedbackContent).length, 1);
    assert.equal(tree!.root.findAllByType("ContentReportSheet").length, 0);
    assert.equal(tree!.root.findAllByType("Pressable").some((node: TestHostNode) => node.props.accessibilityRole === "link"), false);
    const toggle = () => tree!.root.findAllByType("Pressable").find((node: TestHostNode) => ["Show answer details", "Hide answer details"].includes(node.props.accessibilityLabel))!;
    await act(async () => { toggle().props.onPress(); });
    assert.equal(tree!.root.findAllByType("ContentReportSheet").length, 1);
    const text = () => tree!.root.findAllByType("Text").map((node: TestHostNode) => node.children.filter((child: unknown) => typeof child === "string").join(""));
    assert.ok(text().includes("Selected distractor explanation."));
    assert.ok(text().includes("Complete explanation."));
    assert.equal(text().includes(url), false, "raw URL is not duplicated in the explanation");
    await act(async () => {
      tree!.root.findAllByType("Pressable").find((node: TestHostNode) => node.props.accessibilityRole === "link")!.props.onPress();
      for (let i = 0; i < 6; i++) await Promise.resolve();
    });
    assert.deepEqual(opened, [url]);
    assert.ok(text().includes("The source could not be opened."));
    assert.ok(text().includes("Authored quiz reason."));
    assert.equal(toggle().props.accessibilityState.expanded, true);
    await act(async () => { toggle().props.onPress(); });
    assert.equal(tree!.root.findAllByType("ContentReportSheet").length, 0);
  } finally {
    if (tree) await act(async () => tree!.unmount());
    storage.closeActiveProfileStorage();
  }
});

test("ACM summary uses real quiz result, opens the exact pair and returns through the real StackRouter without active reads", async () => {
  storage.installKeyValueStorageForTests(new storage.MemoryKeyValueStorage());
  const original = screenFacade.getApproachChallengeDetailedHistory;
  activeSessionReads.value = { id: "foreign-active", trackId: "other", modeId: "other", status: "active" };
  activeSessionReads.count = 0;
  const detail = historyDetail("summary-exact");
  const second = { ...detail.problems[0]!, stages: detail.problems[0]!.stages.map((stage: any) => ({ ...stage, occurrenceId: `second-${stage.stage}`, prompt: "Second exact problem", response: null, result: null })) };
  // UI identity is occurrence-based even if a modeled projection repeats a display problem ID.
  const projected = { ...detail, problems: [...detail.problems, second] };
  screenFacade.getApproachChallengeDetailedHistory = async () => projected;
  const { StackRouter, StackActions } = require("@react-navigation/routers");
  const router = StackRouter({ initialRouteName: "Home" });
  const options = { routeNames: ["Home", "ApproachChallenge", "ApproachChallengeReview"], routeParamList: {}, routeGetIdList: {} };
  let state = router.getInitialState(options);
  state = router.getStateForAction(state, StackActions.push("ApproachChallenge", { sessionId: detail.sessionId }), options);
  const summaryKey = state.routes[state.index].key;
  let tree: ReturnType<typeof create> | undefined;
  let review: ReturnType<typeof create> | undefined;
  const wrap = (child: any) => React.createElement(preferencesProvider.AppPreferencesProvider, null, child);
  try {
    await act(async () => {
      tree = create(wrap(React.createElement(approachChallengeScreen.ApproachChallengeScreen, {
        route: { key: summaryKey, name: "ApproachChallenge", params: { sessionId: detail.sessionId } },
        navigation: { navigate: (name: string, params: unknown) => { state = router.getStateForAction(state, StackActions.push(name, params), options); }, popTo() {}, setParams() {} },
      })));
      storage.notifyProfileStorageReady(); for (let i = 0; i < 12; i++) await Promise.resolve();
    });
    const overview = () => tree!.root.findByType(sharedOverview.SessionResultOverview);
    assert.equal(overview().props.totalOccurrences, 2);
    assert.equal(overview().props.review.expanded, false);
    await act(async () => overview().props.review.onPress());
    const rows = tree!.root.findAllByType("Pressable");
    assert.equal(rows.length, 2);
    await act(async () => rows[1].props.onPress());
    assert.equal(state.routes[state.index].name, "ApproachChallengeReview");
    assert.deepEqual(JSON.parse(JSON.stringify(state.routes[state.index].params)), { sessionId: detail.sessionId, approachOccurrenceId: "second-approach" });
    await act(async () => {
      review = create(wrap(React.createElement(historyReview.ApproachChallengeReviewScreen, {
        route: state.routes[state.index],
        navigation: { popTo: (name: string, params: unknown) => { state = router.getStateForAction(state, StackActions.popTo(name, params), options); } },
      })));
      for (let i = 0; i < 12; i++) await Promise.resolve();
    });
    assert.equal(review!.root.findAllByType("Text").filter((node: TestHostNode) => node.props.children === "Second exact problem").length, 2, "both exact prompts render through the actual memoized question component");
    assert.ok(["Approach", "Complexity"].every(label => review!.root.findAllByType("Text").some((node: TestHostNode) => node.props.children === label)));
    assert.equal(review!.root.findAllByType("AnswerOption").length, 2, "all neutral unanswered options remain visible");
    assert.ok(review!.root.findAllByType("AnswerOption").every((node: TestHostNode) => node.props.state === "default" && node.props.accessibilityState.checked === false), "unanswered stages never acquire fabricated saved answers");
    assert.equal(review!.root.findAllByType("Text").filter((node: TestHostNode) => node.props.children === "Not answered").length, 2);
    await act(async () => review!.root.findByType("BackLink").props.onPress());
    assert.equal(state.routes[state.index].key, summaryKey);
    assert.equal(state.routes.length, 2);
    assert.equal(overview().props.review.expanded, true, "the mounted summary keeps its expanded list");
    assert.equal(activeSessionReads.count, 0);
    assert.equal((activeSessionReads.value as { id: string } | null)?.id, "foreign-active");
  } finally {
    if (tree) await act(async () => tree!.unmount());
    if (review) await act(async () => review!.unmount());
    screenFacade.getApproachChallengeDetailedHistory = original;
    activeSessionReads.value = null;
    storage.closeActiveProfileStorage();
  }
});

test("ACM exact review fails explicitly for an absent artifact, missing occurrence and a complexity address", async () => {
  storage.installKeyValueStorageForTests(new storage.MemoryKeyValueStorage());
  const original = screenFacade.getApproachChallengeDetailedHistory;
  let tree: ReturnType<typeof create> | undefined;
  try {
    for (const occurrence of ["missing", "complexity-occurrence", "artifact-missing"]) {
      const detail = historyDetail("unavailable-exact");
      screenFacade.getApproachChallengeDetailedHistory = async () => occurrence === "artifact-missing" ? { kind: "unavailable", reason: "artifact_unavailable" } : detail;
      await act(async () => {
        tree = create(React.createElement(preferencesProvider.AppPreferencesProvider, null,
          React.createElement(historyReview.ApproachChallengeReviewScreen, {
            route: { params: { sessionId: detail.sessionId, approachOccurrenceId: occurrence } }, navigation: { popTo() {} },
          })));
        storage.notifyProfileStorageReady(); for (let i = 0; i < 12; i++) await Promise.resolve();
      });
      assert.equal(tree!.root.findByType("EmptyState").props.title, "Session result unavailable");
      assert.equal(tree!.root.findAllByType("AnswerOption").length, 0);
      await act(async () => tree!.unmount()); tree = undefined;
    }
  } finally { if (tree) await act(async () => tree!.unmount()); screenFacade.getApproachChallengeDetailedHistory = original; storage.closeActiveProfileStorage(); }
});

test("authored Q1 Details render through the same real feedback component in live and exact history", async () => {
  storage.installKeyValueStorageForTests(new storage.MemoryKeyValueStorage());
  const originalDetail = screenFacade.getApproachChallengeDetailedHistory;
  const originalStage = screenFacade.getApproachChallengeStageProjection;
  let tree: ReturnType<typeof create> | undefined;
  const selectors = require("../../testing/runtimeSelectors.ts").runtimeSelectors;
  try {
    for (const [authored, expected] of [["String lesson acm-literal-01", ["String lesson acm-literal-01"]], [["Array first", "Array second"], ["Array first", "Array second"]], [{ blocks: [{ type: "paragraph", text: "Object lesson" }] }, ["Object lesson"]]] as const) {
      const detail = historyDetail("authored-history");
      const stage: any = { ...detail.problems[0]!.stages[0], kind: "ready", sessionId: detail.sessionId, problemIndex: 1, problemCount: 1, accepted: true,
        result: { kind: "partial", earnedPoints: 0, maxPoints: 1 },
        feedback: { reason: "Selected partial Reason", details: authored, approachExplanation: { reason: "Legacy fallback", options: [] } } };
      screenFacade.getApproachChallengeStageProjection = async () => stage;
      screenFacade.getApproachChallengeDetailedHistory = async () => ({ ...detail, problems: [{ ...detail.problems[0]!, stages: [stage, { ...detail.problems[0]!.stages[1], response: null }] }] });
      for (const live of [true, false]) {
        activeSessionReads.value = { id: detail.sessionId, trackId: codingArtifact.trackId, modeId: "coding-interview-approach-challenge", status: "active" };
        await act(async () => {
          tree = create(React.createElement(preferencesProvider.AppPreferencesProvider, null,
            React.createElement(live ? approachChallengeScreen.ApproachChallengeScreen : historyReview.ApproachChallengeReviewScreen, {
              route: { params: live ? undefined : { sessionId: detail.sessionId, approachOccurrenceId: stage.occurrenceId } },
              navigation: { navigate() {}, popTo() {}, setParams() {} },
            })));
          storage.notifyProfileStorageReady(); for (let i = 0; i < 12; i++) await Promise.resolve();
        });
        const text = () => tree!.root.findAllByType("Text").map((node: TestHostNode) => node.children.filter((child: unknown) => typeof child === "string").join(""));
        assert.ok(text().includes("Selected partial Reason"));
        assert.ok(expected.every(line => !text().includes(line)), "authored lesson starts collapsed");
        const toggle = tree!.root.findAllByType("Pressable").find((node: TestHostNode) => node.props.testID === selectors.session.detailsToggle(stage.occurrenceId));
        assert.ok(toggle);
        await act(async () => toggle!.props.onPress());
        assert.ok(expected.every(line => text().includes(line)), "every authored lesson line is visible in real shared Details");
        assert.equal(text().includes("Legacy fallback"), false);
        await act(async () => tree!.unmount()); tree = undefined;
      }
    }
  } finally {
    if (tree) await act(async () => tree!.unmount()); screenFacade.getApproachChallengeDetailedHistory = originalDetail; screenFacade.getApproachChallengeStageProjection = originalStage;
    activeSessionReads.value = null; storage.closeActiveProfileStorage();
  }
});
