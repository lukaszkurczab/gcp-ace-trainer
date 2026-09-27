import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { installForegroundSessionTimerFacade, type ForegroundSessionTimerFacade } from "../trainingLifecycle";
import { DEVELOPMENT_EXPIRE_CODING_MOCK_URL, handleCodingMockCountdownAuditUrl, isCodingMockCountdownAuditCommand } from "./codingMockCountdownCommand";

test("Coding Mock countdown audit command is exact and requires a development smoke runtime", () => {
  assert.equal(isCodingMockCountdownAuditCommand(DEVELOPMENT_EXPIRE_CODING_MOCK_URL, { development: true, smoke: true }), true);
  assert.equal(isCodingMockCountdownAuditCommand(`${DEVELOPMENT_EXPIRE_CODING_MOCK_URL}?again=true`, { development: true, smoke: true }), false);
  assert.equal(isCodingMockCountdownAuditCommand(DEVELOPMENT_EXPIRE_CODING_MOCK_URL, { development: false, smoke: true }), false);
  assert.equal(isCodingMockCountdownAuditCommand(DEVELOPMENT_EXPIRE_CODING_MOCK_URL, { development: true, smoke: false }), false);
  assert.equal(isCodingMockCountdownAuditCommand(null, { development: true, smoke: true }), false);

  const rootNavigator = readFileSync("src/navigation/RootNavigator.tsx", "utf8");
  assert.match(rootNavigator, /if \(!__DEV__ \|\| !isPatternlySmokeRuntime\(\)\) return;[\s\S]*?isCodingMockCountdownAuditCommand/);
});

test("production and malformed countdown commands never reach the timer owner", async () => {
  let advances = 0;
  installForegroundSessionTimerFacade({
    async advanceActiveCodingMockCountdownForAudit() { advances += 1; },
  } as unknown as ForegroundSessionTimerFacade);

  assert.equal(await handleCodingMockCountdownAuditUrl(DEVELOPMENT_EXPIRE_CODING_MOCK_URL, { development: false, smoke: true }), "unavailable_in_production");
  assert.equal(await handleCodingMockCountdownAuditUrl(DEVELOPMENT_EXPIRE_CODING_MOCK_URL, { development: true, smoke: false }), "unavailable_in_production");
  assert.equal(await handleCodingMockCountdownAuditUrl(`${DEVELOPMENT_EXPIRE_CODING_MOCK_URL}?again=true`, { development: true, smoke: true }), "ignored");
  assert.equal(advances, 0);
});

test("an exact development smoke command delegates countdown advancement to the foreground timer owner", async () => {
  let advances = 0;
  installForegroundSessionTimerFacade({
    async advanceActiveCodingMockCountdownForAudit() { advances += 1; },
  } as unknown as ForegroundSessionTimerFacade);

  assert.equal(await handleCodingMockCountdownAuditUrl(DEVELOPMENT_EXPIRE_CODING_MOCK_URL, { development: true, smoke: true }), "expired");
  assert.equal(advances, 1);
});
