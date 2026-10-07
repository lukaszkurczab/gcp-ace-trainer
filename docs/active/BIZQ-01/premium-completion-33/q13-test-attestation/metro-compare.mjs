import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { APPROVED_REFS, sha256, TOOL_VERSION } from "./generate.mjs";

export const METRO_COMPARATOR_VERSION = "bizq01-q13-metro-debug-comparator-v1";
const TOOL_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const OLD_REF = "ea4f3d61b39bab6b9f12ace73b34721d0d6e717a";
const NEW_REF = "fa95d027076e970d71dacf0d1fd7976fa0ba8f60";
const SOURCE_PATHS = ["App.tsx", "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts", "src/content/generated/canonical-content/content-lock.json"];
const PATCHED_PATHS = ["App.tsx", "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts", "src/q13-test-attestation/attestation-policy.ts", "src/q13-test-attestation/attestation-runtime.ts", "src/q13-test-attestation/preservation.ts"];
const TOOL_PATHS = ["generate.mjs", "attestation-policy.ts", "attestation-runtime.template.txt", "preservation.ts"];
const REQUIRED_CATEGORIES = ["active-track", "learning-lifecycle", "learning-progress", "goals-and-plans", "user-settings", "reminder-settings", "learning-identity-history"];
const INVENTORY_ONLY_CATEGORIES = ["account-lifecycle-redacted", "profile-metadata-unread", "content-report-outbox-unread", "outside_canonical_namespace"];
const BUNDLE_ID = "com.lkurczab.patternly";

function fail(category) { return { status: "fail", category }; }
function isRecord(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function exactKeys(value, expected) { return isRecord(value) && Object.keys(value).sort().join("\n") === [...expected].sort().join("\n"); }
function shaText(value) { return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value); }
function nonceText(value) { return shaText(value); }
function exactHashMap(value, keys) { return exactKeys(value, keys) && Object.values(value).every(shaText); }
function sameKeys(left, right) { return left.length === right.length && left.every((value, index) => value === right[index]); }
function currentToolHashes() {
  return Object.fromEntries(TOOL_PATHS.map((path) => [path, sha256(readFileSync(resolve(TOOL_DIRECTORY, path)))]));
}

function validSourceBinding(binding, expectedRef, expectedNonce, bindingBytesSha256) {
  const approval = APPROVED_REFS[expectedRef];
  const toolHashes = currentToolHashes();
  return bindingBytesSha256 && binding?.schemaVersion === "bizq01-q13-test-build-binding-v2"
    && exactKeys(binding, ["schemaVersion", "toolVersion", "nonce", "sourceRef", "content", "toolSourceSha256", "sourceFilesSha256", "patchedFilesSha256", "patchSha256", "patchState", "buildBinding"])
    && binding.toolVersion === TOOL_VERSION && binding.patchState === "applied" && binding.buildBinding === null
    && nonceText(binding.nonce) && binding.nonce === expectedNonce && binding.sourceRef === expectedRef
    && exactKeys(binding.content, ["contentVersion", "artifactSha256"])
    && binding.content.contentVersion === approval.contentVersion && binding.content.artifactSha256 === approval.artifactSha256
    && exactHashMap(binding.sourceFilesSha256, SOURCE_PATHS)
    && SOURCE_PATHS.every((path) => binding.sourceFilesSha256[path] === approval.files[path])
    && exactHashMap(binding.patchedFilesSha256, PATCHED_PATHS)
    && exactHashMap(binding.toolSourceSha256, TOOL_PATHS)
    && TOOL_PATHS.every((path) => binding.toolSourceSha256[path] === toolHashes[path])
    && shaText(binding.patchSha256);
}

function validContext(context, expectedRef, binding, bindingSha256, expectedCatalog) {
  if (!exactKeys(context, ["schemaVersion", "executionMode", "sourceRef", "bindingFileSha256", "nonce", "catalogIdentity", "appIdentity", "device", "metro"])) return false;
  if (context.schemaVersion !== "bizq01-q13-metro-execution-context-v1" || context.executionMode !== "metro_debug"
    || context.sourceRef !== expectedRef || context.bindingFileSha256 !== bindingSha256 || context.nonce !== binding.nonce
    || !exactKeys(context.catalogIdentity, ["contentVersion", "artifactSha256"])
    || context.catalogIdentity.contentVersion !== expectedCatalog.contentVersion || context.catalogIdentity.artifactSha256 !== expectedCatalog.artifactSha256) return false;
  const app = context.appIdentity;
  if (!exactKeys(app, ["bundleIdentifier", "signatureIdentifier", "signatureKind", "signatureVerified", "baseAppSha256"])
    || app.bundleIdentifier !== BUNDLE_ID || app.signatureIdentifier !== BUNDLE_ID || app.signatureKind !== "ad_hoc"
    || app.signatureVerified !== true || !shaText(app.baseAppSha256)) return false;
  const device = context.device;
  if (!exactKeys(device, ["model", "fingerprintSha256"]) || device.model !== "iPhone 17" || !shaText(device.fingerprintSha256)) return false;
  const metro = context.metro;
  return exactKeys(metro, ["host", "port", "pid", "cwd", "sourceRoot", "listenerCount", "inspectorTargetCount", "processObserved", "startedAt", "stoppedAt"])
    && metro.host === "::1" && metro.port === 8081 && Number.isSafeInteger(metro.pid) && metro.pid > 0
    && typeof metro.cwd === "string" && isAbsolute(metro.cwd) && typeof metro.sourceRoot === "string" && isAbsolute(metro.sourceRoot)
    && resolve(metro.cwd) === resolve(metro.sourceRoot) && metro.listenerCount === 1 && metro.inspectorTargetCount === 1
    && metro.processObserved === true && validTimestamp(metro.startedAt) && validTimestamp(metro.stoppedAt)
    && Date.parse(metro.startedAt) < Date.parse(metro.stoppedAt);
}
function validTimestamp(value) { return typeof value === "string" && Number.isFinite(Date.parse(value)); }

function validReceipt(receipt, nonce, identity, stage, hasPreservation) {
  const expectedKeys = hasPreservation
    ? ["schemaVersion", "nonce", "contentVersion", "artifactSha256", "stage", "preservation"]
    : ["schemaVersion", "nonce", "contentVersion", "artifactSha256", "stage"];
  return exactKeys(receipt, expectedKeys) && receipt.schemaVersion === "bizq01-q13-runtime-receipt-v2"
    && receipt.nonce === nonce && receipt.contentVersion === identity.contentVersion
    && receipt.artifactSha256 === identity.artifactSha256 && receipt.stage === stage
    && (hasPreservation ? isRecord(receipt.preservation) : true);
}

function validSnapshot(snapshot) {
  return snapshot?.schema === "bizq01-q13-preservation-v1"
    && exactKeys(snapshot, ["schema", "semanticProjection", "profileKind", "transitionActive", "keyInventory", "categories", "session"])
    && snapshot.semanticProjection === "canonicalSerialize-envelope-v1-timer-exceptions-v1"
    && snapshot.profileKind === "account" && snapshot.transitionActive === false
    && exactKeys(snapshot.session, ["status", "trackId", "contentVersion", "artifactSha256", "actualLength", "currentItemIndex", "orderedItemsSha256", "orderedOptionsSha256", "attemptCount", "draftResponseCount", "activeJournalPresent", "persistedOldPin"])
    && snapshot.session.status === "active" && snapshot.session.trackId === "object-oriented-design-interview"
    && snapshot.session.contentVersion === APPROVED_REFS[OLD_REF].contentVersion
    && snapshot.session.artifactSha256 === APPROVED_REFS[OLD_REF].artifactSha256
    && snapshot.session.actualLength === 1 && snapshot.session.currentItemIndex === 0
    && snapshot.session.attemptCount === 0 && snapshot.session.draftResponseCount === 0
    && snapshot.session.activeJournalPresent === false && snapshot.session.persistedOldPin === true
    && shaText(snapshot.session.orderedItemsSha256) && shaText(snapshot.session.orderedOptionsSha256)
    && Array.isArray(snapshot.keyInventory) && exactKeys(snapshot.categories, REQUIRED_CATEGORIES)
    && REQUIRED_CATEGORIES.every((category) => Array.isArray(snapshot.categories[category]))
    && snapshot.keyInventory.every((entry) => exactKeys(entry, ["keySha256", "category"]) && shaText(entry.keySha256)
      && [...REQUIRED_CATEGORIES, ...INVENTORY_ONLY_CATEGORIES].includes(entry.category))
    && new Set(snapshot.keyInventory.map((entry) => entry.keySha256)).size === snapshot.keyInventory.length
    && REQUIRED_CATEGORIES.every((category) => {
      const entries = snapshot.categories[category];
      return entries.every((entry) => entry?.category === category && shaText(entry.keySha256) && typeof entry.present === "boolean"
        && (entry.present ? exactKeys(entry, ["keySha256", "category", "present", "rawValueSha256", "semanticSha256"])
          && shaText(entry.rawValueSha256) && shaText(entry.semanticSha256)
          : exactKeys(entry, ["keySha256", "category", "present"])))
        && sameKeys(entries.map((entry) => entry.keySha256).sort(), snapshot.keyInventory.filter((entry) => entry.category === category).map((entry) => entry.keySha256).sort());
    });
}

export function compareMetroEvidence(input) {
  const { oldBinding, newBinding, oldBindingBytesSha256, newBindingBytesSha256, oldContext, newContext, oldEntry, newEntry, oldResume, newResume } = input ?? {};
  if (!validSourceBinding(oldBinding, OLD_REF, oldContext?.nonce, oldBindingBytesSha256)
    || !validSourceBinding(newBinding, NEW_REF, newContext?.nonce, newBindingBytesSha256)) return fail("source_binding_invalid");
  if (oldBinding.nonce === newBinding.nonce) return fail("nonce_binding_invalid");
  if (!validContext(oldContext, OLD_REF, oldBinding, oldBindingBytesSha256, APPROVED_REFS[OLD_REF])
    || !validContext(newContext, NEW_REF, newBinding, newBindingBytesSha256, APPROVED_REFS[NEW_REF])) return fail("metro_context_invalid");
  if (oldContext.appIdentity.baseAppSha256 !== newContext.appIdentity.baseAppSha256
    || oldContext.device.fingerprintSha256 !== newContext.device.fingerprintSha256) return fail("same_app_context_changed");
  if (Date.parse(oldContext.metro.stoppedAt) > Date.parse(newContext.metro.startedAt)) return fail("metro_runs_overlap_or_order_invalid");
  if (!validReceipt(oldEntry, oldBinding.nonce, APPROVED_REFS[OLD_REF], "js_bundle_entry", false)
    || !validReceipt(oldResume, oldBinding.nonce, APPROVED_REFS[OLD_REF], "exact_resume_success", true)
    || !validReceipt(newEntry, newBinding.nonce, APPROVED_REFS[NEW_REF], "js_bundle_entry", false)
    || !validReceipt(newResume, newBinding.nonce, APPROVED_REFS[NEW_REF], "identity_mismatch", true)) return fail("runtime_stage_vector_invalid");
  const left = oldResume.preservation;
  const right = newResume.preservation;
  if (!validSnapshot(left) || !validSnapshot(right)) return fail("preservation_snapshot_invalid");
  const sessionFields = ["status", "trackId", "contentVersion", "artifactSha256", "actualLength", "currentItemIndex", "orderedItemsSha256", "orderedOptionsSha256", "attemptCount", "draftResponseCount", "activeJournalPresent", "persistedOldPin"];
  if (!sessionFields.every((key) => left.session[key] === right.session[key])) return fail("session_facts_changed");
  const inventoryKey = (entry) => `${entry.keySha256}:${entry.category}`;
  if (left.keyInventory.length !== right.keyInventory.length || left.keyInventory.some((entry, index) => inventoryKey(entry) !== inventoryKey(right.keyInventory[index]))) return fail("key_inventory_changed");
  for (const category of REQUIRED_CATEGORIES) {
    const normalize = (entries) => entries.map((entry) => `${entry.keySha256}:${entry.present}:${entry.semanticSha256 ?? "absent"}`).sort();
    const first = normalize(left.categories[category]);
    const second = normalize(right.categories[category]);
    if (!sameKeys(first, second)) return fail("canonical_semantics_changed");
  }
  return { status: "pass", category: "metro_debug_preservation_equal" };
}

function privateEvidenceFile(path) {
  const absolute = realpathSync(path);
  const info = lstatSync(absolute);
  if (!info.isFile() || (info.mode & 0o077) !== 0) throw new Error("private_evidence_permissions_invalid");
  const allowedRoots = ["/private/tmp", tmpdir()].map((root) => resolve(realpathSync(root)));
  if (!allowedRoots.some((root) => absolute === root || relative(root, absolute).split(sep)[0] !== "..")) throw new Error("private_evidence_path_invalid");
  return { path: absolute, bytes: readFileSync(absolute) };
}
function readJson(file) { try { return JSON.parse(file.bytes.toString("utf8")); } catch { throw new Error("private_evidence_invalid_json"); } }

export function compareMetroFiles(options) {
  try {
    const oldBindingFile = privateEvidenceFile(options.oldBinding);
    const newBindingFile = privateEvidenceFile(options.newBinding);
    const oldContextFile = privateEvidenceFile(options.oldContext);
    const newContextFile = privateEvidenceFile(options.newContext);
    const oldEntryFile = privateEvidenceFile(options.oldEntry);
    const newEntryFile = privateEvidenceFile(options.newEntry);
    const oldResumeFile = privateEvidenceFile(options.oldResume);
    const newResumeFile = privateEvidenceFile(options.newResume);
    return compareMetroEvidence({
      oldBinding: readJson(oldBindingFile), newBinding: readJson(newBindingFile),
      oldBindingBytesSha256: sha256(oldBindingFile.bytes), newBindingBytesSha256: sha256(newBindingFile.bytes),
      oldContext: readJson(oldContextFile), newContext: readJson(newContextFile),
      oldEntry: readJson(oldEntryFile), newEntry: readJson(newEntryFile),
      oldResume: readJson(oldResumeFile), newResume: readJson(newResumeFile),
    });
  } catch (error) {
    const category = error instanceof Error && /^[a-z][a-z0-9_]*$/u.test(error.message) ? error.message : "private_evidence_unreadable";
    return fail(category);
  }
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const name = args[index];
    if (!name.startsWith("--") || !args[index + 1] || args[index + 1].startsWith("--")) throw new Error("invalid_arguments");
    const key = name.slice(2);
    if (options[key]) throw new Error("invalid_arguments");
    options[key] = args[index + 1];
    index += 1;
  }
  const expected = ["old-binding", "new-binding", "old-context", "new-context", "old-entry", "new-entry", "old-resume", "new-resume"];
  if (!exactKeys(options, expected)) throw new Error("invalid_arguments");
  return Object.fromEntries(Object.entries(options).map(([key, value]) => [key.replace(/-([a-z])/gu, (_match, letter) => letter.toUpperCase()), value]));
}
function main(args) {
  if (args[0] !== "compare-metro-debug") throw new Error("invalid_command");
  const result = compareMetroFiles(parseArgs(args.slice(1)));
  process.stdout.write(`${JSON.stringify({ result: result.status, category: result.category })}\n`);
  if (result.status !== "pass") process.exitCode = 2;
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { main(process.argv.slice(2)); } catch (error) {
    const category = error instanceof Error && /^[a-z][a-z0-9_]*$/u.test(error.message) ? error.message : "metro_comparator_failed";
    process.stderr.write(`q13_metro_comparator_failed:${category}\n`);
    process.exitCode = 1;
  }
}
