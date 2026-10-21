import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { before } from "node:test";
import vm from "node:vm";
import ts from "typescript";

import type { CanonicalPracticeModeId } from "../../application/practice/practiceModeContract";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { getAlgorithmsInterviewSimulationEntry } from "../../application/coding-interview";
import { ROUTES } from "../../constants/routes";
import { getProductSimulationModeConfig } from "../../content/canonical/productModeConfig";
import { getTrackDisplay, getTracks, type TrackId } from "../../domain";
import { CODING_INTERVIEW_TRACK_ID, AWS_CERTIFIED_SOLUTIONS_ARCHITECT_ASSOCIATE_TRACK_ID, BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID } from "../../domain/tracks/trackRegistry";
import { ALGORITHM_MODE_IDS } from "../../tracks/coding-interview";
import { requiresPremiumProductMode } from "../../application/trainingLifecycle/premiumProductModePolicy";
import { isDesignInterviewModeId } from "../../tracks/design-interview";
import { resolveCertificationExamAccess, type PremiumSessionAdmission } from "./certificationExamAccess";
import { buildPracticeModes, getCanonicalFreePracticeNodeId } from "./practiceFlowModel";
import { buildPracticeSessionConfig, getGeneralPracticeReviewSource } from "./sessionConfig";

// Execute the production command and its actual wired callbacks, following the
// existing command-source integration-test pattern. This does not model native UI.
const source = readFileSync(new URL("./PracticeHubScreen.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("PracticeHubScreen.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let command: ts.FunctionDeclaration | undefined;
let start: ts.Expression | undefined;
let settings: ts.Expression | undefined;
let retry: ts.ArrowFunction | undefined;
function inspect(node: ts.Node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "startSession") command = node;
  if (ts.isArrowFunction(node) && node.getText(ast).includes("designAdmissionRequest && startSession")) retry = node;
  if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
    const attr = (name: string) => node.attributes.properties.find((property): property is ts.JsxAttribute => ts.isJsxAttribute(property) && property.name.getText(ast) === name)?.initializer;
    const id = attr("testID");
    const handler = attr("onPress");
    if (id && handler && ts.isJsxExpression(id) && ts.isJsxExpression(handler)) {
      if (id.expression?.getText(ast) === "runtimeSelectors.practice.startSession()") start = handler.expression;
      if (id.expression?.getText(ast) === "runtimeSelectors.practice.openSetup()") settings = handler.expression;
    }
  }
  ts.forEachChild(node, inspect);
}
inspect(ast);
assert.ok(command && start && settings && retry, "production entry points must remain wired");
const compiled = ts.transpileModule(`${command.getText(ast)}\nconst startAction = ${start.getText(ast)};\nconst settingsAction = ${settings.getText(ast)};\nconst retryAction = ${retry.getText(ast)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

before(async () => { await contentPackageRuntimeOwner.verifyBundledPackages(); });
const settle = () => new Promise<void>((resolve) => setImmediate(resolve));
type RouteCall = { route: string; params?: Record<string, unknown> };
function harness(trackId: TrackId, admit: () => Promise<PremiumSessionAdmission> = async () => "allowed") {
  const activeTrack = getTrackDisplay(trackId);
  const topic = { id: getCanonicalFreePracticeNodeId(trackId) };
  const primaryMode = buildPracticeModes(activeTrack)[0]!;
  const routes: RouteCall[] = [];
  const busy: boolean[] = [];
  let unavailable = false;
  const context: Record<string, unknown> = {
    activeTrack, primaryMode, modes: buildPracticeModes(activeTrack), topic, canonicalNodeId: topic.id,
    isCodingInterviewTrack: trackId === CODING_INTERVIEW_TRACK_ID,
    isDesignInterviewTrack: activeTrack.familyId === "design_interview",
    readState: { kind: "ready", reviewSource: "due_queue" },
    navigation: { navigate: (route: string, params?: Record<string, unknown>) => routes.push({ route, params: params && structuredClone(params) }) },
    account: { authorizePremiumSessionStart: admit },
    designAdmissionPendingRef: { current: false }, examAdmissionPendingRef: { current: false }, codingAdmissionPendingRef: { current: false },
    setDesignAdmissionPending: (value: boolean) => busy.push(value),
    setDesignAccessUnavailable: (value: boolean) => { unavailable = value; },
    setDesignAdmissionRequest: (value: unknown) => { context.designAdmissionRequest = value; },
    setExamAdmissionPending: () => {}, setExamAccessUnavailable: () => {},
    setCodingAdmissionPending: () => {}, setCodingAccessUnavailable: () => {},
    ROUTES, ALGORITHM_MODE_IDS, buildPracticeSessionConfig, getGeneralPracticeReviewSource,
    isDesignInterviewModeId, requiresPremiumProductMode, resolveCertificationExamAccess, contentPackageRuntimeOwner,
    getProductSimulationModeConfig, getAlgorithmsInterviewSimulationEntry,
  };
  const runtime = vm.createContext(context);
  vm.runInContext(compiled, runtime);
  return { activeTrack, primaryMode, topic, routes, busy, unavailable: () => unavailable,
    start: () => vm.runInContext("startAction()", runtime), settings: () => vm.runInContext("settingsAction()", runtime),
    retry: () => vm.runInContext("retryAction()", runtime),
    shortcut: (mode: string) => vm.runInContext(`startSession(${JSON.stringify(mode)})`, runtime) };
}

test("every primary Start action routes directly with that canonical mode's defaults and exact topic", async () => {
  for (const track of getTracks()) {
    const subject = harness(track.id);
    subject.start();
    await settle();
    assert.deepEqual(subject.routes, [{ route: ROUTES.PRACTICE_SESSION, params: buildPracticeSessionConfig({ mode: subject.primaryMode.mode as CanonicalPracticeModeId, source: "practiceHub", topicId: subject.topic.id, trackId: track.id }) }], track.id);
    assert.equal(subject.routes[0]!.params!.sessionLength, contentPackageRuntimeOwner.getPreparedDiscovery(track.id).track.getMode(subject.primaryMode.mode).defaultRequestedLength);
    assert.equal(subject.routes[0]!.params!.reviewSource, undefined, "unrelated review evidence must not enter primary Focus Practice");
  }
});

test("Manage settings opens the matching primary setup, while Coding uses Custom Practice", async () => {
  for (const track of getTracks()) {
    const subject = harness(track.id);
    subject.settings();
    await settle();
    assert.equal(subject.routes.length, 1, track.id);
    assert.equal(subject.routes[0]!.route, ROUTES.PRACTICE_SETUP, track.id);
    assert.equal(subject.routes[0]!.params!.mode, track.id === CODING_INTERVIEW_TRACK_ID ? ALGORITHM_MODE_IDS.customPractice : subject.primaryMode.mode, track.id);
    assert.equal(subject.routes[0]!.params!.source, "practiceHub");
    assert.equal(subject.routes[0]!.params!.topicId, subject.topic.id);
    assert.equal(subject.routes[0]!.params!.trackId, track.id);
  }
});

test("Certification secondary Focus shortcut still opens setup and Quick Review starts its review source", () => {
  const subject = harness(AWS_CERTIFIED_SOLUTIONS_ARCHITECT_ASSOCIATE_TRACK_ID);
  subject.shortcut("certification-focus-practice");
  assert.deepEqual(subject.routes[0], { route: ROUTES.PRACTICE_SETUP, params: { mode: "certification-focus-practice", source: "modeShortcut", topicId: subject.topic.id, trackId: subject.activeTrack.id } });
  subject.shortcut("certification-quick-review");
  assert.equal(subject.routes[1]!.route, ROUTES.PRACTICE_SESSION);
  assert.equal(subject.routes[1]!.params!.reviewSource, "due_queue");
  assert.equal(subject.routes[1]!.params!.topicId, "");
});

test("all Design Free practice entries route without Premium admission, including deny or failure callbacks", async () => {
  for (const track of getTracks().filter((candidate) => candidate.familyId === "design_interview")) {
    for (const outcome of ["denied", "reject"] as const) {
      let requests = 0;
      const admit = async () => { requests++; if (outcome === "reject") throw Error("must not request Premium for Free practice"); return "denied" as const; };
      const subject = harness(track.id, admit);
      subject.start(); subject.settings();
      for (const mode of ["design-interview-learn-framework", "design-interview-tradeoff-practice", "design-interview-weak-area-review"]) subject.shortcut(mode);
      await settle();
      assert.equal(requests, 0, `${track.id}:${outcome}`);
      assert.equal(subject.routes[0]!.route, ROUTES.PRACTICE_SESSION);
      assert.equal(subject.routes[1]!.route, ROUTES.PRACTICE_SETUP);
      assert.equal(subject.routes.length, 5);
      assert.ok(subject.routes.every(({ params }) => params?.trackId === track.id && params.topicId === subject.topic.id));
      assert.deepEqual(subject.busy, []);
      assert.equal(subject.unavailable(), false);
    }
  }
});

test("Design simulation waits for admission and duplicate presses cannot repeat the pending operation", async () => {
  let resolve!: (value: PremiumSessionAdmission) => void;
  let requests = 0;
  const subject = harness(BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID, () => { requests += 1; return new Promise((ready) => { resolve = ready; }); });
  subject.shortcut("design-interview-simulation"); subject.shortcut("design-interview-simulation");
  assert.equal(requests, 1);
  assert.equal(subject.routes.length, 0);
  assert.deepEqual(subject.busy, [true]);
  resolve("allowed"); await settle();
  assert.equal(subject.routes[0]!.route, ROUTES.DESIGN_INTERVIEW_SIMULATION);
  assert.deepEqual(subject.busy, [true, false]);
});

test("Design simulation denial, failure, and retry preserve the Premium boundary", async () => {
  for (const result of ["denied", "unavailable", "reject"] as const) {
    let admission: PremiumSessionAdmission | "reject" = result;
    const subject = harness(BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID, async () => { if (admission === "reject") throw Error("fixture"); return admission; });
    subject.shortcut("design-interview-simulation"); await settle();
    assert.deepEqual(subject.routes, result === "denied" ? [{ route: ROUTES.PREMIUM_PURCHASE, params: undefined }] : []);
    assert.equal(subject.unavailable(), result !== "denied");
    assert.deepEqual(subject.busy, [true, false]);
    if (result !== "denied") {
      admission = "allowed";
      subject.retry(); await settle();
      assert.equal(subject.routes[0]!.route, ROUTES.DESIGN_INTERVIEW_SIMULATION);
      assert.equal((subject.routes as RouteCall[])[0]!.params!.trackId, BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID);
    }
  }
});

test("existing admitted simulation shortcuts retain their dedicated destinations", async () => {
  for (const [trackId, mode, route] of [
    [AWS_CERTIFIED_SOLUTIONS_ARCHITECT_ASSOCIATE_TRACK_ID, "certification-exam-simulation", ROUTES.EXAM],
    [CODING_INTERVIEW_TRACK_ID, ALGORITHM_MODE_IDS.interviewSimulation, ROUTES.ALGORITHMS_INTERVIEW_SIMULATION],
    [BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID, "design-interview-simulation", ROUTES.DESIGN_INTERVIEW_SIMULATION],
  ] as const) {
    const subject = harness(trackId);
    subject.shortcut(mode); await settle();
    assert.equal(subject.routes.length, 1);
    assert.equal(subject.routes[0]!.route, route);
  }
});
