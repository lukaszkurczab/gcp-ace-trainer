import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

import { ROUTES } from "../constants/routes";
import { getBackDestinationTranslation, getPreviousRoute } from "../navigation/backDestination";

const source = (path: string) => readFileSync(path, "utf8");

test("navigation destination titles use the approved 16/22/600 semantic token", () => {
  const tokens = source("src/theme/tokens.ts");
  const backLink = source("src/components/BackLink.tsx");
  assert.match(tokens, /navigationContext:\s*\{\s*fontSize:\s*16,\s*lineHeight:\s*22,\s*fontWeight:\s*"600",\s*\}/);
  assert.match(backLink, /\.\.\.typography\.navigationContext/);
  assert.match(backLink, /maxFontSizeMultiplier=\{2\}/);
});

test("back destination mapper uses real stack history and Home's selected tab", () => {
  const routes = [
    { name: ROUTES.HOME, params: { initialTab: "settings" } },
    { name: ROUTES.PREMIUM_PURCHASE },
  ] as const;
  const previous = getPreviousRoute(routes, 1);
  assert.equal(previous?.name, ROUTES.HOME);
  assert.deepEqual(getBackDestinationTranslation(previous), { namespace: "common", key: "Settings" });
  assert.equal(getPreviousRoute(routes, 0), null);
  assert.equal(getPreviousRoute([], 0), null);
  assert.equal(getPreviousRoute(routes, 2), null);

  assert.deepEqual(getBackDestinationTranslation({ name: ROUTES.HOME }), { namespace: "common", key: "Today" });
  assert.deepEqual(getBackDestinationTranslation({ name: ROUTES.HOME, params: { initialTab: "practice" } }), { namespace: "common", key: "Practice" });
  assert.deepEqual(getBackDestinationTranslation({ name: ROUTES.HOME, params: { initialTab: "progress" } }), { namespace: "common", key: "Progress" });
  assert.equal(getBackDestinationTranslation({ name: "UnknownRoute" }), null);
});

test("dynamic account destinations and fixed screen titles resolve to localized keys", () => {
  assert.deepEqual(getBackDestinationTranslation({ name: ROUTES.ACCOUNT_SECURITY, params: { screen: "email" } }), { namespace: "settings", key: "changeEmail" });
  assert.deepEqual(getBackDestinationTranslation({ name: ROUTES.ACCOUNT_SECURITY, params: { screen: "delete" } }), { namespace: "account", key: "deleteAccount" });
  assert.deepEqual(getBackDestinationTranslation({ name: ROUTES.ACCOUNT_ENTRY, params: { initialMode: "signIn" } }), { namespace: "account", key: "signIn" });
  assert.deepEqual(getBackDestinationTranslation({ name: ROUTES.ACCOUNT_ENTRY, params: { initialMode: "register" } }), { namespace: "account", key: "register" });
  assert.deepEqual(getBackDestinationTranslation({ name: ROUTES.PRACTICE_SETUP }), { namespace: "common", key: "Practice setup" });
  assert.deepEqual(getBackDestinationTranslation({ name: ROUTES.PRACTICE_HUB }), { namespace: "common", key: "Practice" });
  assert.deepEqual(getBackDestinationTranslation({ name: ROUTES.TERMS_OF_SERVICE }), { namespace: "account", key: "termsOfService" });
  assert.deepEqual(getBackDestinationTranslation({ name: ROUTES.LEGAL_REQUESTS, params: { kind: "complaint" } }), { namespace: "legal", key: "legalRequests.kinds.complaint.title" });
  assert.equal(getBackDestinationTranslation({ name: ROUTES.ACCOUNT_SECURITY, params: { screen: "unknown" } }), null);
  assert.equal(getBackDestinationTranslation({ name: ROUTES.ACCOUNT_SECURITY, params: { screen: "recovery" } }), null);
});

test("every known route destination maps to a present localized title in every app language", () => {
  const routes: { name: string; params?: unknown }[] = Object.values(ROUTES).map((name) => ({
    name,
    params: name === ROUTES.ACCOUNT_SECURITY ? { screen: "email" }
      : name === ROUTES.ACCOUNT_ENTRY ? { initialMode: "signIn" }
        : name === ROUTES.LEGAL_REQUESTS ? { kind: "complaint" }
        : undefined,
  }));
  routes.push(
    ...["home", "progress", "settings"].map((initialTab) => ({ name: ROUTES.HOME, params: { initialTab } })),
    ...["email", "password", "delete", "export", "privacy"].map((screen) => ({ name: ROUTES.ACCOUNT_SECURITY, params: { screen } })),
    ...["entry", "register", "signIn", "recovery", "resetPassword"].map((initialMode) => ({ name: ROUTES.ACCOUNT_ENTRY, params: { initialMode } })),
    ...["complaint", "withdrawal", "data_recovery", "suspension_appeal"].map((kind) => ({ name: ROUTES.LEGAL_REQUESTS, params: { kind } })),
  );
  const locales = readdirSync("src/locales", { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);

  for (const route of routes) {
    const destination = getBackDestinationTranslation(route);
    assert.ok(destination, `missing back destination for route ${route.name}`);
    for (const locale of locales) {
      const translations = JSON.parse(readFileSync(`src/locales/${locale}/${destination.namespace}.json`, "utf8")) as Record<string, unknown>;
      const value: unknown = destination.key.split(".").reduce<unknown>((entry, key) => entry !== null && typeof entry === "object" ? (entry as Record<string, unknown>)[key] : undefined, translations);
      assert.equal(typeof value, "string", `${locale}/${destination.namespace} missing ${destination.key} for ${route.name}`);
      assert.ok((value as string).trim(), `${locale}/${destination.namespace} has empty ${destination.key} for ${route.name}`);
    }
  }
});

test("shared BackLink is the accessible, wrapping 44 point navigation action", () => {
  const backLink = source("src/components/BackLink.tsx");
  const appShell = source("src/components/AppShellHeader.tsx");
  const screenHeader = source("src/components/ScreenHeader.tsx");
  const screen = source("src/components/Screen.tsx");
  const review = source("src/components/ReviewLoadingSkeleton.tsx");
  const root = source("src/navigation/RootNavigator.tsx");

  assert.match(backLink, /accessibilityRole="button"/);
  assert.match(backLink, /testID = "patternly:navigation:back"/);
  assert.match(backLink, /minHeight:\s*44/);
  assert.match(backLink, /flexShrink:\s*1/);
  assert.match(backLink, /getPreviousRoute\(navigationState\.routes, navigationState\.index\)/);
  assert.match(appShell, /if \(backAction\)[\s\S]*?<BackLink/);
  const backBranch = appShell.match(/if \(backAction\) \{([\s\S]*?)\n  \}/)?.[1] ?? "";
  assert.doesNotMatch(backBranch, /PatternlyMark|headerMeta|context/);
  assert.doesNotMatch(screenHeader, /backAction|BackLink/);
  assert.match(screen, /backAction\?: BackLinkProps/);
  assert.match(screen, /<BackLink \{\.\.\.backAction\} \/>/);
  assert.ok(screen.indexOf("<BackLink") < screen.indexOf("<ScrollView\n"), "return navigation stays outside the scroll viewport");
  assert.match(screen, /navigation:\s*\{\s*backgroundColor:\s*palette\.background/);
  assert.match(screen, /key=\{`navigation:\$\{fontScale\}`\}/);
  assert.match(review, /<BackLink destinationLabel=\{destinationLabel\} onPress=\{onBack\}/);
  assert.match(root, /getPreviousRoute\(state\.routes, state\.index\)/);
  assert.match(root, /destinationLabel/);
});

test("session controls and tab typography stay out of navigation scope", () => {
  const session = source("src/features/coding-interview/session/SessionShell.tsx");
  const practice = source("src/features/practice/PracticeSessionSurface.tsx");
  const simulation = source("src/features/simulation/SimulationSessionSurface.tsx");
  const tabs = source("src/components/BottomTabBar.tsx");

  assert.match(session, /modeText:\s*\{[^}]*fontSize:\s*14[^}]*fontWeight:\s*"600"[^}]*lineHeight:\s*20/);
  assert.match(session, /topTextLargeSimulation:\s*\{[^}]*fontSize:\s*13[^}]*fontWeight:\s*"600"[^}]*lineHeight:\s*16/);
  assert.match(practice, /sessionActionLabel:\s*\{\s*fontSize:\s*13,\s*fontWeight:\s*"600",\s*lineHeight:\s*16\s*\}/);
  assert.match(simulation, /sessionActionLabel:\s*\{\s*fontSize:\s*13,\s*fontWeight:\s*"600",\s*lineHeight:\s*16\s*\}/);
  assert.doesNotMatch(tabs, /navigationContext/);
});
