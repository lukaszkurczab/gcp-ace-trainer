import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// R2 (owner, 2026-11-11; T1.6): no OTA code in the iOS build. expo-updates and the pods it pulls
// in (EXUpdatesInterface, EASClient) must be absent; Expo.plist EXUpdates* keys are not read by
// anything once the module is gone, so only the linked code is checked here.
export function assertNoExpoUpdatesPods(podfileLock) {
  if (/^\s*-\s+"?(?:EXUpdates|EXUpdatesInterface|EASClient)\b/mu.test(podfileLock)) {
    throw new Error("Podfile.lock contains expo-updates pods; OTA must not be linked (R2).");
  }
}

export function assertNoExpoUpdatesInApp(appPath) {
  if (existsSync(path.join(appPath, "Frameworks", "EXUpdates.framework"))
    || readFileSync(path.join(appPath, path.basename(appPath, ".app"))).includes("EXUpdatesAppController")) {
    throw new Error("Candidate app contains expo-updates code; OTA must not be linked (R2).");
  }
}
