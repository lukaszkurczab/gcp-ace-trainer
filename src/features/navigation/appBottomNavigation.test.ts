import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { StackActions, StackRouter } from "@react-navigation/routers";

const source = readFileSync("src/features/navigation/AppBottomNavigation.tsx", "utf8");

test("bottom navigation pops to the existing Home and selects its requested tab", () => {
  assert.match(source, /if \(onHomeTabChange\) \{\s*onHomeTabChange\(tab\);\s*return;\s*\}/);
  assert.match(source, /navigation\.popTo\(ROUTES\.HOME, \{ initialTab: tab \}\)/);
  assert.doesNotMatch(source, /navigation\.navigate\(ROUTES\.HOME, \{ initialTab: tab \}\)/);
});

const routerOptions = { routeNames: ["Home", "PracticeHub"], routeParamList: {}, routeGetIdList: {} };
test("installed router returns the existing Home instance with the requested tab", () => {
  const router = StackRouter({ initialRouteName: "Home" });
  const initial = router.getInitialState(routerOptions);
  const hub = router.getStateForAction(initial, StackActions.push("PracticeHub"), routerOptions)!;
  assert(hub.stale === false);
  const returned = router.getStateForAction(hub, StackActions.popTo("Home", { initialTab: "progress" }), routerOptions)!;
  assert.deepEqual(returned.routes.map(route => route.name), ["Home"]);
  assert.equal(returned.routes[0]!.key, initial.routes[0]!.key);
  assert.deepEqual(returned.routes[0]!.params, { initialTab: "progress" });
});
test("installed router creates a single Home if a direct entry has no previous Home", () => {
  const router = StackRouter({ initialRouteName: "PracticeHub" });
  const initial = router.getInitialState(routerOptions);
  const returned = router.getStateForAction(initial, StackActions.popTo("Home", { initialTab: "settings" }), routerOptions)!;
  assert.deepEqual(returned.routes.map(route => route.name), ["Home"]);
  assert.deepEqual(returned.routes[0]!.params, { initialTab: "settings" });
});
