import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = (path: string) => readFileSync(path, "utf8");

function sourceFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.[cm]?[jt]sx?$/.test(entry.name) ? [path] : [];
  });
}

test("all branded navigation headers use the one AppShellHeader path", () => {
  const files = sourceFiles("src");
  const combined = files.map(source).join("\n");
  const rootNavigator = source("src/navigation/RootNavigator.tsx");

  assert.equal(existsSync("src/features/navigation/AppStackHeader.tsx"), false);
  assert.doesNotMatch(combined, /AppStackHeader/);
  assert.match(rootNavigator, /header:\s*\(\{ back, navigation, options \}\) => \([\s\S]*?<AppShellHeader/);
  assert.match(rootNavigator, /backAction=\{back \? \{ onPress: \(\) => navigation\.goBack\(\) \} : undefined\}/);
  assert.match(rootNavigator, /context=\{options\.title\}/);
  assert.match(rootNavigator, /placement="stack"/);
  assert.doesNotMatch(rootNavigator, /headerTitleStyle|headerTintColor|headerStyle/);
});

test("route coverage has one native or inline shell owner and preserves active-session specialization", () => {
  const rootNavigator = source("src/navigation/RootNavigator.tsx");
  const routeIds = [...rootNavigator.matchAll(/<Stack\.Screen\s+\n?\s*name=\{ROUTES\.([A-Z_]+)\}/g)].map((match) => match[1]);
  const headerlessRouteIds = [...rootNavigator.matchAll(/<Stack\.Screen\s+\n?\s*name=\{ROUTES\.([A-Z_]+)\}[\s\S]*?options=\{\{([^}]*)\}\}\s*\/>/g)]
    .filter((match) => /headerShown:\s*false/.test(match[2] ?? ""))
    .map((match) => match[1]);

  assert.equal(routeIds.length, 21);
  assert.equal(new Set(routeIds).size, 21);
  assert.deepEqual(headerlessRouteIds, [
    "HOME",
    "SELECT_TRACK",
    "PRACTICE_HUB",
    "ALGORITHMS_SCOPE_SELECTION",
    "TOPIC_ROADMAP",
    "PRACTICE_SETUP",
    "PRACTICE_SESSION",
    "ALGORITHMS_INTERVIEW_SIMULATION",
  ]);

  for (const path of [
    "src/features/home/HomeScreen.tsx",
    "src/features/home/SelectTrackScreen.tsx",
    "src/features/practice/PracticeHubScreen.tsx",
    "src/features/practice/AlgorithmsScopeSelectionScreen.tsx",
    "src/features/practice/TopicRoadmapScreen.tsx",
    "src/features/practice/PracticeSetupScreen.tsx",
  ]) {
    assert.match(source(path), /<AppShellHeader\b/);
  }

  assert.match(source("src/features/coding-interview/session/SessionShell.tsx"), /<Screen edges=\{\["top", "bottom"\]\}/);
  assert.match(source("src/features/practice/PracticeSessionSurface.tsx"), /<SessionShell\b/);
  assert.match(source("src/features/simulation/SimulationSessionSurface.tsx"), /<SessionShell\b/);
});

test("the headerless practice route owns every Algorithms and Certification render branch", () => {
  const algorithms = source("src/features/practice/PracticeSessionScreen.tsx");
  const certification = source("src/features/practice/CertificationPracticeSessionScreen.tsx");
  const practiceSurface = source("src/features/practice/PracticeSessionSurface.tsx");
  const sharedBackHeader = /<AppShellHeader backAction=\{\{ onPress: \(\) => navigation\.navigate\(ROUTES\.PRACTICE_HUB\) \}\} context=\{t\("Practice Session"\)\} \/>/;
  const branch = (file: string, start: string, end: string) => {
    const startIndex = file.indexOf(start);
    assert.ok(startIndex >= 0);
    const endIndex = file.indexOf(end, startIndex + start.length);
    assert.ok(endIndex >= 0);
    return file.slice(startIndex, endIndex);
  };

  assert.equal(algorithms.match(/<AppShellHeader\b/g)?.length, 4);
  assert.match(branch(algorithms, "if (!algorithmsMode)", "if (algorithmsMode ==="), sharedBackHeader, "Algorithms unsupported/misroute");
  assert.match(branch(algorithms, "if (algorithmsMode ===", "if (!state)"), sharedBackHeader, "Interview Simulation misroute");
  assert.match(branch(algorithms, 'if (state.kind === "active_session_conflict")', 'if (state.kind === "unavailable")'), sharedBackHeader, "active-session conflict");
  assert.match(branch(algorithms, 'if (state.kind === "unavailable")', "const sessionState"), sharedBackHeader, "Algorithms unavailable");
  assert.match(algorithms, /if \(!state\) return <PracticeSessionSurface[\s\S]*?phase="preparing" \/>/);
  assert.match(algorithms, /return \(\s*<PracticeSessionSurface[\s\S]*?phase=\{phase\}/);
  assert.match(practiceSurface, /return \(\s*<SessionShell/);

  assert.equal(certification.match(/<AppShellHeader\b/g)?.length, 4);
  assert.match(branch(certification, "if (!mode)", "if (conflict)"), sharedBackHeader, "Certification invalid mode");
  assert.match(branch(certification, "if (conflict)", "if (error)"), sharedBackHeader, "Certification active-session conflict");
  assert.match(branch(certification, "if (error)", "if (!projection)"), sharedBackHeader, "Certification error");
  assert.match(branch(certification, "if (!projection)", "const multiple"), sharedBackHeader, "Certification loading");
  const activeCertification = certification.slice(certification.indexOf("const multiple"));
  assert.doesNotMatch(activeCertification, /<AppShellHeader\b/);
  assert.match(activeCertification, /return <PracticeSessionSurface[\s\S]*?phase=\{phase\}/);
});

test("the shared header owns accessible back geometry and long-copy reflow without navigation fallback", () => {
  const header = source("src/components/AppShellHeader.tsx");
  const backFallback = source("src/navigation/goBackOrHome.ts");

  assert.match(header, /backAction\?: Readonly<\{/);
  assert.match(header, /accessibilityLabel=\{backAction\.accessibilityLabel \?\? t\("Go back"\)\}/);
  assert.match(header, /accessibilityRole="button"/);
  assert.match(header, /backButton:\s*\{[\s\S]*?height:\s*48,[\s\S]*?width:\s*48,/);
  assert.match(header, /headerCopy:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,/);
  assert.match(header, /brandTitle:\s*\{[\s\S]*?flexShrink:\s*1,/);
  assert.match(header, /headerMeta:\s*\{[\s\S]*?flexShrink:\s*1,/);
  assert.match(header, /maxFontSizeMultiplier=\{2\}/);
  assert.doesNotMatch(header, /numberOfLines|ROUTES|canGoBack|navigate\(/);
  assert.match(backFallback, /if \(navigation\.canGoBack\(\)\)[\s\S]*navigation\.goBack\(\)[\s\S]*navigation\.navigate\(ROUTES\.HOME, \{ initialTab: "home" \}\)/);
});

test("Screen and SessionShell remain the only general and active-session page owners", () => {
  const featureFiles = sourceFiles("src/features");
  const safeAreaOwners = featureFiles.filter((path) => /SafeAreaView/.test(source(path)));
  const scrollViewOwners = featureFiles.filter((path) => /\bScrollView\b/.test(source(path)));
  const screen = source("src/components/Screen.tsx");
  const header = source("src/components/AppShellHeader.tsx");

  assert.deepEqual(safeAreaOwners, []);
  assert.deepEqual(scrollViewOwners, ["src/features/simulation/navigator/SimulationQuestionNavigator.tsx"]);
  assert.match(screen, /<SafeAreaView[\s\S]*<ScrollView/);
  assert.match(header, /placement === "stack"[\s\S]*<SafeAreaView edges=\{\["top"\]\}/);
  assert.doesNotMatch(source("src/features/coding-interview/session/SessionShell.tsx"), /SafeAreaView|ScrollView/);
});

test("representative Home, Settings, setup, session, and result routes keep canonical ownership", () => {
  const rootNavigator = source("src/navigation/RootNavigator.tsx");
  const home = source("src/features/home/HomeScreen.tsx");
  const settings = source("src/features/home/AppearanceSettingsScreen.tsx");
  const preferenceSelection = source("src/features/home/PreferenceSelectionScreen.tsx");
  const setup = source("src/features/practice/PracticeSetupScreen.tsx");
  const session = source("src/features/coding-interview/session/SessionShell.tsx");
  const result = source("src/features/practice/AlgorithmsPracticeSummaryScreen.tsx");

  assert.match(home, /<Screen[\s\S]*<AppShellHeader \/>/);
  assert.match(home, /if \(!hasLoadedActiveTrack\) return <Screen edges=\{\["top"\]\} scroll=\{false\}><AppShellHeader \/><LoadingState/);
  assert.match(settings, /<PreferenceSelectionScreen/);
  assert.match(preferenceSelection, /<Screen>/);
  assert.match(rootNavigator, /name=\{ROUTES\.APPEARANCE_SETTINGS\}[\s\S]*?options=\{\{ title: t\("Appearance"\) \}\}/);
  assert.match(setup, /<Screen edges=\{\["top", "bottom"\]\}>[\s\S]*<AppShellHeader/);
  assert.match(source("src/features/practice/AlgorithmsScopeSelectionScreen.tsx"), /state\.kind === "unavailable"[\s\S]*?<Screen edges=\{\["top"\]\}><AppShellHeader[\s\S]*?onActionPress=\{\(\) => goBackOrHome\(navigation\)\}/);
  assert.match(session, /return \([\s\S]*<Screen[\s\S]*footer=/);
  assert.match(result, /<Screen/);
  assert.match(rootNavigator, /name=\{ROUTES\.ALGORITHMS_PRACTICE_SUMMARY\}[\s\S]*?options=\{\{ title: t\("Session result"\) \}\}/);
});

test("Practice setup keeps one canonical back action and recovery copy names learner-visible consequences", () => {
  const setup = source("src/features/practice/PracticeSetupScreen.tsx");
  const session = source("src/features/practice/PracticeSessionScreen.tsx");

  assert.equal((setup.match(/\{t\("Back"\)\}/g) ?? []).length, 0);
  assert.match(setup, /<AppShellHeader[\s\S]*backAction=\{\{ onPress: \(\) => goBackOrHome\(navigation\) \}\}/);
  assert.match(session, /Your saved answers remain available, but this session cannot be resumed\./);
  assert.doesNotMatch(session, /durable records stay available/);
});
