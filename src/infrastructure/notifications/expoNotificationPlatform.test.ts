import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("goal days map to Expo weekly weekdays where Sunday is one", () => {
  const source = readFileSync("src/infrastructure/notifications/expoNotificationPlatform.ts", "utf8");
  assert.match(source, /sun: 1,[\s\S]*?mon: 2,[\s\S]*?tue: 3,[\s\S]*?wed: 4,[\s\S]*?thu: 5,[\s\S]*?fri: 6,[\s\S]*?sat: 7/);
  assert.match(source, /type: Notifications\.SchedulableTriggerInputTypes\.WEEKLY/);
  assert.match(source, /weekday: EXPO_WEEKDAY\[day\]/);
  assert.doesNotMatch(source, /SchedulableTriggerInputTypes\.DAILY/);
});
