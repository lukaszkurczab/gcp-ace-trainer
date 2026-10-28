import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createStartupPreviewRequestFence, STARTUP_PREVIEW_SCENES, parseStartupPreviewUrl, resolveStartupPreviewEntry } from "./startupPreparationPreview";
import { createStartupPreviewActions, STARTUP_PREVIEW_ACTIONS } from "./startupPreparationPreviewReceipt";
const url = "com.lkurczab.patternly://audit/startup-preview?scene=recovery-success&locale=de&theme=dark";
test("early preview requires exact opt-in, development smoke and no other fixture", () => {
  assert.equal(resolveStartupPreviewEntry(undefined, true, "smoke", "regular", "regular").kind, "regular");
  assert.equal(resolveStartupPreviewEntry("1", true, "smoke", "regular", "regular").kind, "preview");
  for (const args of [["", true, "smoke", "regular", "regular"], ["true", true, "smoke", "regular", "regular"], ["1", false, "smoke", "regular", "regular"], ["1", true, "sandbox", "regular", "regular"], ["1", true, "smoke", "fixture", "regular"], ["1", true, "smoke", "regular", "fixture"]] as const) assert.equal(resolveStartupPreviewEntry(args[0], args[1], args[2], args[3], args[4]).kind, "rejected");
  const app = readFileSync("App.tsx", "utf8");
  assert.ok(app.indexOf('if (previewEntry.kind !== "regular")') < app.indexOf('require("./src/infrastructure/runtime/EnvironmentGate")'));
});
test("closed scene parser refuses legacy URL, unknown/duplicate/missing parameters and disabled entry", () => {
  assert.equal(STARTUP_PREVIEW_SCENES.length, 21);
  for (const scene of STARTUP_PREVIEW_SCENES) assert.equal(parseStartupPreviewUrl(url.replace("recovery-success", scene), true)?.scene, scene);
  for (const bad of [url + "&theme=light", url + "&remove=true", url.replace("locale=de&", ""), url.replace("de&", "de-DE&"), url.replace("recovery-success", "ready"), url + "#fragment", "com.lkurczab.patternly://audit/show-encrypted-storage-recovery?presentation=error", "https://audit/startup-preview?scene=recovery-success&locale=de&theme=dark"]) assert.equal(parseStartupPreviewUrl(bad, true), null);
  assert.equal(parseStartupPreviewUrl(url, false), null);
});
test("preview callbacks accept no domain handlers, stay bounded in RAM and cannot change scene", () => {
  const receipt = createStartupPreviewActions();
  for (const action of STARTUP_PREVIEW_ACTIONS) { for (let index = 0; index < 1100; index++) receipt.actions[action](); }
  assert.deepEqual(receipt.read(), Object.fromEntries(STARTUP_PREVIEW_ACTIONS.map(key => [key, 999])));
  assert.ok(Object.isFrozen(receipt.read()));
  const source = readFileSync("src/testing/startupPreparationPreviewReceipt.ts", "utf8");
  assert.doesNotMatch(source, /^import |require\(|setState|setParameters|Storage|Repository/);
  const host = readFileSync("src/testing/StartupPreparationPreviewRoot.tsx", "utf8");
  assert.doesNotMatch(host, /RegularApplicationRoot|AppPreferencesProvider|ProfileStoragePreparationGate|AccountSessionProvider|bootstrapApplication|removeUnavailableEncryptedStorage/);
  assert.doesNotMatch(readFileSync("src/application/account/ProfileStoragePreparationGate.tsx", "utf8"), /auditPresentation|parseStorageRecoveryAuditCommand|Linking/);
});

test("out-of-order language readiness and invalid supersession cannot republish an older scene", async () => {
  const fence = createStartupPreviewRequestFence();
  let displayed: string | null = null;
  const pending: Array<() => void> = [];
  const apply = (value: string | null) => {
    const attempt = fence.next(); displayed = null;
    if (value === null) return;
    pending.push(() => { if (fence.isCurrent(attempt)) displayed = value; });
  };
  apply("A"); apply("B"); pending[1]!(); pending[0]!(); assert.equal(displayed, "B");
  apply("A"); apply(null); pending[2]!(); assert.equal(displayed, null);
  apply("A"); fence.dispose(); pending[3]!(); assert.equal(displayed, null);
  const host = readFileSync("src/testing/StartupPreparationPreviewRoot.tsx", "utf8");
  assert.ok(host.indexOf("requests.next()") < host.indexOf("parseStartupPreviewUrl(url, enabled)"));
  assert.match(host, /i18n.changeLanguage[\s\S]*?requests.isCurrent\(attempt\)[\s\S]*?setParameters\(next\)/);
  assert.match(host, /requests.dispose\(\)/);
});

test("D21 standalone preview reserves the production Home top safe area", () => {
  const preview = readFileSync("src/testing/StartupPreparationPreviewRoot.tsx", "utf8");
  assert.match(preview, /scene.startsWith\("ready-resume-"\)[\s\S]*?return <Screen edges=\{\["top", "bottom"\]\}><HomeDecisionCard/);
  assert.match(readFileSync("src/features/home/HomeScreen.tsx", "utf8"), /<Screen[\s\S]*?edges=\{\["top"\]\}/);
});
