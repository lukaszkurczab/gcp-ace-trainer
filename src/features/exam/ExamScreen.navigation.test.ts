import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { goBackOrHome } from "../../navigation/goBackOrHome";
import { ROUTES } from "../../constants/routes";

test("unavailable exam Back uses shared stack-aware navigation", () => {
  const screen = readFileSync("src/features/exam/ExamScreen.tsx", "utf8");
  assert.match(screen, /import \{ goBackOrHome \} from "\.\.\/\.\.\/navigation\/goBackOrHome"/u);
  assert.match(screen, /onActionPress=\{\(\) => goBackOrHome\(navigation\)\}/u);
  assert.doesNotMatch(screen, /onActionPress=\{\(\) => undefined\}/u);

  const calls: string[] = [];
  goBackOrHome({ canGoBack: () => true, goBack: () => calls.push("back"), navigate: () => calls.push("home") });
  assert.deepEqual(calls, ["back"]);
  calls.length = 0;
  goBackOrHome({ canGoBack: () => false, goBack: () => calls.push("back"), navigate: (route) => calls.push(route) });
  assert.deepEqual(calls, [ROUTES.HOME]);
});
