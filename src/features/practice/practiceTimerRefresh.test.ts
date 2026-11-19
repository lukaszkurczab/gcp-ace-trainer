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

test("latestRefresh is reassigned on every session render as a passive refresh", () => {
  assert.match(source, /latestRefresh\.current = \(\) => actionPending\.current \? Promise\.resolve\(\) : refresh\(currentResponseOwner, false, commandEpoch\.current\);\n\s*async function refresh\(/);
});

function functionBody(name: string): string {
  const start = source.indexOf(`async function ${name}(`);
  assert.notEqual(start, -1, `missing ${name}`);
  const end = source.indexOf("\n  async function ", start + 1);
  return source.slice(start, end === -1 ? undefined : end);
}

test("a passive refresh is dropped when a command started while it read the projection", () => {
  // Regression (S2 ~1 s outliers): a tick that read the projection during
  // `advancePracticeSession` saw operation "advancing", moved the owner fence,
  // and the continue's own refresh was dropped until the next tick.
  const body = functionBody("refresh");
  const read = body.indexOf("await getAlgorithmsPracticeProjection()");
  const epochCheck = body.indexOf("if (passiveEpoch !== null && passiveEpoch !== commandEpoch.current) return;");
  const fenceMove = body.indexOf("interactionResponseOwner.current = practiceResponseEventOwner(next)");
  assert.ok(read !== -1 && epochCheck > read && fenceMove > epochCheck, "epoch check must sit between the read and the owner fence move");
});

for (const name of ["submit", "advanceOrFinish", "recover"]) {
  test(`${name} starts a new command epoch before its command runs`, () => {
    const body = functionBody(name);
    const bump = body.indexOf("commandEpoch.current += 1;");
    assert.notEqual(bump, -1);
    const command = body.search(/await (retryAlgorithmsPracticeResponse|submitAlgorithmsPracticeResponse|submitOptimistically|advanceAlgorithmsPracticeSession|completeAlgorithmsPracticeSession|recoverAlgorithmsPracticeOperation)\(/);
    assert.ok(command > bump, `${name} must bump the epoch before awaiting its command`);
  });
}
