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

const native = {
  ActivityIndicator: "ActivityIndicator",
  StyleSheet: { create: (value: unknown) => value, hairlineWidth: 1 },
  Text: "Text",
  View: "View",
};
const host = (name: string) => ({ children, ...props }: Record<string, unknown>) => React.createElement(name, props, children);
const components = Object.fromEntries(["AnswerOption", "Button", "Card", "EmptyState", "InfoBlock", "Screen", "ScreenHeader"].map((name) => [name, host(name)]));
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
const approachChallengeScreen = loadComponent("./ApproachChallengeScreen.tsx", {
  react: React,
  "react-native": native,
  "react-i18next": { useTranslation: () => ({ t: interpolation }) },
  "../../components": components,
  "../../preferences": preferencesProvider,
  "../../theme": { spacing: {}, typography: { body: {}, bodyStrong: {} } },
  "../../constants": { ROUTES: { PRACTICE_HUB: "PracticeHub", HOME: "Home" } },
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
  "./feedbackDetails": require("./feedbackDetails.ts"),
  "./approachChallengeEntry": require("./approachChallengeEntry.ts"),
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
    assert.equal(tree.root.findAllByType("InfoBlock").some((block: TestHostNode) => block.props.title === "No problems available"), true);
    assert.equal(startButton().props.disabled, true);

    const family = tree.root.findAllByType("AnswerOption").find((option: TestHostNode) => option.props.text === "Prefix Sums");
    assert.ok(family, "the real screen renders the known taxonomy family");
    await act(async () => { family!.props.onPress(); await settle(); });

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
    const screenModeSelected = (mode: string) => tree!.root.findAllByType("Button").find((button: TestHostNode) => button.props.children === mode)?.props.accessibilityState?.selected;
    assert.equal(screenModeSelected("Manual"), true, "screen A hydrated profile A's saved manual mode");
    assert.equal(tree!.root.findAllByType("InfoBlock").some((block: TestHostNode) => block.props.title === "No problems available"), true);

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
    assert.equal(screenModeSelected("Automatic"), true, "remounted screen B uses profile B's default settings");
    assert.equal(screenModeSelected("Manual"), false);
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
    assert.equal(tree!.root.findAllByType("ScreenHeader").some((header: TestHostNode) => header.props.title === "Session details"), true);
    assert.equal(tree!.root.findAllByType("Text").some((text: TestHostNode) => text.props.children === "Saved history for saved-session-42"), true);
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
    assert.equal(tree!.root.findAllByType("ScreenHeader").some((header: TestHostNode) => header.props.title === "Session details"), true);
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

type TestHostNode = { props: Record<string, any> };

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
