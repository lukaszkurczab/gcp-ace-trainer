import { spawnSync } from "node:child_process";

const executable = "firebase";
const argumentsForEmulator = [
  "emulators:exec",
  "--only",
  "auth",
  "--project",
  "demo-patternly-auth-removal",
  "--config",
  "scripts/firebaseAuthGeneration.firebase.json",
  "node --test scripts/firebasePasswordReset.emulator.mjs",
];

const result = spawnSync(executable, argumentsForEmulator, { stdio: "inherit" });
if (result.error) {
  process.stderr.write("Firebase Auth Emulator runner could not start the local CLI.\n");
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
