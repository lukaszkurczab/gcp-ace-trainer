import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./PracticeSessionScreen.tsx", import.meta.url), "utf8");

function effectBody(marker: string): string {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing ${marker}`);
  const end = source.indexOf("}, [", start);
  assert.notEqual(end, -1, `unterminated effect for ${marker}`);
  return source.slice(start, end);
}

test("timer ticks refresh through the latest render, not the subscription-time closure", () => {
  // Regression: the subscription is keyed by session id only, so a captured
  // `refresh` kept the first question's response owner and its owner fence
  // dropped every tick after the first answer (time moved only on question change).
  const body = effectBody("subscribeAlgorithmsPracticeProjectionRefresh((event)");
  assert.match(body, /latestRefresh\.current\(\)/);
  assert.doesNotMatch(body, /void refresh\(/);
});

test("returning to foreground refreshes through the latest render", () => {
  const body = effectBody('AppState.addEventListener("change"');
  assert.match(body, /latestRefresh\.current\(\)/);
  assert.doesNotMatch(body, /=> refresh\(\)/);
});

test("latestRefresh is reassigned on every session render", () => {
  assert.match(source, /latestRefresh\.current = \(\) => refresh\(\);\n\s*async function refresh\(/);
});
