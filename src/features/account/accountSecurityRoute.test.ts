import assert from "node:assert/strict";
import test from "node:test";

import { readAccountSecurityRouteScreen, resolveAccountSecurityScreen } from "./accountSecurityRoute";

test("current account-security routes resolve to their dedicated screens", () => {
  for (const screen of ["email", "password", "delete", "export", "privacy"]) {
    assert.equal(resolveAccountSecurityScreen(screen), screen);
  }
});

test("obsolete or malformed route parameters fail closed without a privileged fallback", () => {
  for (const screen of ["recovery", "", null, undefined, {}, "unknown"]) {
    assert.equal(resolveAccountSecurityScreen(screen), null);
  }
  for (const params of [undefined, null, [], {}, { screen: "recovery" }, { screen: null }]) {
    assert.equal(readAccountSecurityRouteScreen(params), null);
  }
  assert.equal(readAccountSecurityRouteScreen({ screen: "email" }), "email");
});
