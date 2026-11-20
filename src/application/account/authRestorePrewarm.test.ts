import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

// K: the Firebase persisted-user restore starts at the regular root, in parallel
// with the profile storage gate, and only under the provider's own guards.
const source = (path: string) => readFileSync(join(__dirname, "..", "..", path), "utf8");

test("the regular root starts the auth restore before the storage gate settles", () => {
  const root = source("RegularApplicationRoot.tsx");
  const rootComponent = root.slice(root.indexOf("export default function RegularApplicationRoot"), root.indexOf("function AppContent()"));
  assert.match(rootComponent, /useEffect\(\(\) => \{ prewarmAccountAuthRestore\(\); \}, \[\]\);/u);
  assert.ok(root.indexOf("<ProfileStoragePreparationGate>") < root.indexOf("<PatternlyAccountProvider>"), "the provider still mounts behind the gate");
});

test("the prewarm mirrors the provider's configuration guards and reuses its client wiring", () => {
  const provider = source("application/account/AccountSessionProvider.tsx");
  const start = provider.indexOf("export function prewarmAccountAuthRestore");
  const prewarm = provider.slice(start, provider.indexOf("\n}\n", start));
  for (const guard of [
    "if (!smokeRuntime && publicEnvironment.kind !== \"configured\") return;",
    "if (firebaseConfiguration.kind !== \"configured\") return;",
    "if (!apiOrigin || !authActionOrigin || (smokeRuntime && !authEmulatorOrigin)) return;",
  ]) assert.ok(prewarm.includes(guard), guard);
  assert.match(prewarm, /prewarmFirebaseAuth\(\{ config: firebaseConfiguration\.value, authEmulatorOrigin \}\)/u);
  const client = source("infrastructure/firebase/firebaseAuthClient.ts");
  assert.match(client, /export function prewarmFirebaseAuth[\s\S]*?firebaseAuth\(firebaseApp\(input\.config\), input\.authEmulatorOrigin\)/u);
  assert.match(client, /createFirebaseAuthClient[\s\S]*?firebaseAuth\(firebaseApp\(input\.config\), input\.authEmulatorOrigin\)/u);
});
