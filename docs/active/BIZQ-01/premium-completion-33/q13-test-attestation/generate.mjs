import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, realpathSync, renameSync, rmSync, rmdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const TOOL_VERSION = "bizq01-q13-test-attestation-v2";
export const APPROVED_REFS = Object.freeze({
  "ea4f3d61b39bab6b9f12ace73b34721d0d6e717a": Object.freeze({
    contentVersion: "object-oriented-design-interview-authoring-v2026.10.05-bizq01-23",
    artifactSha256: "932b7370d7be44bb5274ad8bc5a31b45f0479b3ff4251160af1ed2b170ca80d7",
    files: Object.freeze({
      "App.tsx": "21e55ea26ecc5d70c498a15e3200017f63e5060217c5db08d530ed8a82d06304",
      "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts": "f86e3b672928288eaca8c7f696852795b6cd39a24131143fd6bee221dfe92c8f",
      "src/content/generated/canonical-content/content-lock.json": "0cb1306dc4f75c5278165e35c5e06691671b8c18c7416e4fba9bda36ab0bf32c",
    }),
  }),
  "fa95d027076e970d71dacf0d1fd7976fa0ba8f60": Object.freeze({
    contentVersion: "object-oriented-design-interview-authoring-v2026.10.05-bizq01-24",
    artifactSha256: "9df476e414158da0f33e118c06ed7fbc476b53bc8f0a115a470f61f9c1bf1ea3",
    files: Object.freeze({
      "App.tsx": "21e55ea26ecc5d70c498a15e3200017f63e5060217c5db08d530ed8a82d06304",
      "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts": "f86e3b672928288eaca8c7f696852795b6cd39a24131143fd6bee221dfe92c8f",
      "src/content/generated/canonical-content/content-lock.json": "9a0eba3e26189511d2cc4af96bbc68f5317c25952afd6e780f11c8ea43163aa0",
    }),
  }),
});

const OWNED_TARGETS = Object.freeze([
  "App.tsx",
  "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts",
  "src/content/generated/canonical-content/content-lock.json",
]);
const GENERATED_DIRECTORY = "src/q13-test-attestation";
const GENERATED_FILES = Object.freeze([
  `${GENERATED_DIRECTORY}/attestation-policy.ts`,
  `${GENERATED_DIRECTORY}/attestation-runtime.ts`,
  `${GENERATED_DIRECTORY}/preservation.ts`,
]);
const ALLOWED_PATCH_PATHS = new Set([...OWNED_TARGETS.slice(0, 2), ...GENERATED_FILES]);
const PROTECTED_PATHS = Object.freeze([
  "app.config.js",
  "eas.json",
  "ios",
  "android",
  "plugins",
  "schemas",
  "src/content",
  "src/domain",
  "integration/contracts/content-release",
]);
const OLD_PIN = Object.freeze({
  trackId: "object-oriented-design-interview",
  contentVersion: "object-oriented-design-interview-authoring-v2026.10.05-bizq01-23",
  artifactSha256: "932b7370d7be44bb5274ad8bc5a31b45f0479b3ff4251160af1ed2b170ca80d7",
});

const TOOL_DIRECTORY = dirname(fileURLToPath(import.meta.url));

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function createNonce(randomBytesSource = randomBytes) {
  return randomBytesSource(32).toString("hex");
}

export function createPatchedSources({ appSource, lifecycleSource, runtimeTemplate, policySource, preservationSource, nonce }) {
  if (!/^[a-f0-9]{64}$/u.test(nonce)) throw new Error("invalid_nonce");
  const appImport = 'import "./src/q13-test-attestation/attestation-runtime";\n';
  if (appSource.includes(appImport)) throw new Error("entry_already_instrumented");
  const patchedApp = `${appImport}${appSource}`;

  const lifecycleImportAnchor = 'import { MutationCommitFailure } from "../mutationBoundary";';
  if (lifecycleSource.split(lifecycleImportAnchor).length !== 2) throw new Error("lifecycle_import_anchor_mismatch");
  let patchedLifecycle = lifecycleSource.replace(
    lifecycleImportAnchor,
    `${lifecycleImportAnchor}\nimport { observeQ13ExactResume } from "../../q13-test-attestation/attestation-runtime";`,
  );
  const resumeStart = patchedLifecycle.indexOf("async resumeActiveSession(");
  const resumeEnd = patchedLifecycle.indexOf("\n  async abandonActiveSession(", resumeStart);
  if (resumeStart < 0 || resumeEnd < 0) throw new Error("resume_method_anchor_missing");
  const resumeMethod = patchedLifecycle.slice(resumeStart, resumeEnd);
  const originalCall = "const runtime = await this.resolveRuntimeForSession(session);";
  if (resumeMethod.split(originalCall).length !== 2) throw new Error("resume_call_anchor_mismatch");
  const patchedMethod = resumeMethod.replace(originalCall,
    "const runtime = await observeQ13ExactResume(session, () => this.resolveRuntimeForSession(session));");
  patchedLifecycle = `${patchedLifecycle.slice(0, resumeStart)}${patchedMethod}${patchedLifecycle.slice(resumeEnd)}`;

  if (runtimeTemplate.split("__Q13_NONCE__").length !== 2) throw new Error("runtime_template_nonce_anchor_mismatch");
  const runtimeSource = runtimeTemplate.replace("__Q13_NONCE__", nonce);
  if (runtimeSource.includes("__Q13_NONCE__")) throw new Error("runtime_template_nonce_unresolved");
  if (policySource.includes("__Q13_NONCE__")) throw new Error("policy_contains_nonce_placeholder");
  if (preservationSource.includes("__Q13_NONCE__")) throw new Error("preservation_contains_nonce_placeholder");
  return Object.freeze({
    "App.tsx": patchedApp,
    "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts": patchedLifecycle,
    [GENERATED_FILES[0]]: policySource,
    [GENERATED_FILES[1]]: runtimeSource,
    [GENERATED_FILES[2]]: preservationSource,
  });
}

export function parseContentLock(lockSource) {
  let lock;
  try { lock = JSON.parse(lockSource); } catch { throw new Error("content_lock_invalid_json"); }
  const tracks = Array.isArray(lock?.tracks) ? lock.tracks : [];
  const track = tracks.find((entry) => entry?.trackId === "object-oriented-design-interview");
  if (typeof track?.contentVersion !== "string" || typeof track?.sha256 !== "string") throw new Error("ood_content_identity_missing");
  if (!/^[a-f0-9]{64}$/u.test(track.sha256)) throw new Error("ood_content_hash_invalid");
  return Object.freeze({ contentVersion: track.contentVersion, artifactSha256: track.sha256 });
}

export function makeBinding({ nonce, head, approval, toolSourceHashes, sourceHashes, patchedHashes, patchSha256 }) {
  return Object.freeze({
    schemaVersion: "bizq01-q13-test-build-binding-v2",
    toolVersion: TOOL_VERSION,
    nonce,
    sourceRef: head,
    content: Object.freeze({ contentVersion: approval.contentVersion, artifactSha256: approval.artifactSha256 }),
    toolSourceSha256: Object.freeze(toolSourceHashes),
    sourceFilesSha256: Object.freeze(sourceHashes),
    patchedFilesSha256: Object.freeze(patchedHashes),
    patchSha256,
    patchState: "applied",
    buildBinding: null,
  });
}

export function classifyBuildReceipt({ sessionPin, currentCatalog, outcome, isExactResolverMismatch }) {
  if (!sessionPin || sessionPin.trackId !== OLD_PIN.trackId
    || sessionPin.contentVersion !== OLD_PIN.contentVersion
    || sessionPin.artifactSha256 !== OLD_PIN.artifactSha256) return null;
  const matches = (identity, expected) => identity?.contentVersion === expected.contentVersion
    && identity?.artifactSha256 === expected.artifactSha256;
  if (outcome.kind === "success") return matches(currentCatalog, APPROVED_REFS["ea4f3d61b39bab6b9f12ace73b34721d0d6e717a"]) ? "exact_resume_success" : null;
  if (outcome.kind !== "failure" || !matches(currentCatalog, APPROVED_REFS["fa95d027076e970d71dacf0d1fd7976fa0ba8f60"])) return null;
  return isExactResolverMismatch(outcome.error) ? "identity_mismatch" : null;
}

export async function applyPatchToDetachedCheckout(repoArgument, options = {}) {
  const repoRoot = realpathSync(repoArgument);
  const approvals = options.testOnlyApprovals ?? APPROVED_REFS;
  const head = git(repoRoot, ["rev-parse", "HEAD"]).trim();
  const approval = approvals[head];
  if (!approval) throw new Error("unapproved_head");
  if (git(repoRoot, ["rev-parse", "--abbrev-ref", "HEAD"]).trim() !== "HEAD") throw new Error("checkout_not_detached");
  if (git(repoRoot, ["status", "--porcelain=v1", "--untracked-files=all"]).trim() !== "") throw new Error("checkout_not_clean");

  const nonce = options.nonce ?? createNonce();
  if (!/^[a-f0-9]{64}$/u.test(nonce)) throw new Error("invalid_nonce");
  const bindingPath = resolve(options.bindingPath ?? "");
  if (!options.bindingPath) throw new Error("binding_path_must_be_external");
  const bindingParent = realpathSync(dirname(bindingPath));
  const safeBindingPath = resolve(bindingParent, basename(bindingPath));
  if (isWithin(repoRoot, safeBindingPath)) throw new Error("binding_path_must_be_external");
  if (!isPrivateTemporaryPath(safeBindingPath)) throw new Error("binding_path_must_be_private_tmp");
  if (existsSync(safeBindingPath)) throw new Error("binding_already_exists");
  const generatedDirectory = resolve(repoRoot, GENERATED_DIRECTORY);
  if (existsSync(generatedDirectory)) throw new Error("attestation_directory_already_exists");

  const sourceBytes = Object.fromEntries(OWNED_TARGETS.map((filePath) => [filePath, readFileSync(resolve(repoRoot, filePath))]));
  const sourceHashes = Object.fromEntries(Object.entries(sourceBytes).map(([filePath, bytes]) => [filePath, sha256(bytes)]));
  for (const filePath of OWNED_TARGETS) {
    if (sourceHashes[filePath] !== approval.files[filePath]) throw new Error("source_hash_mismatch");
  }
  const currentIdentity = parseContentLock(sourceBytes[OWNED_TARGETS[2]].toString("utf8"));
  if (currentIdentity.contentVersion !== approval.contentVersion || currentIdentity.artifactSha256 !== approval.artifactSha256) throw new Error("content_identity_mismatch");

  const policySource = readFileSync(resolve(TOOL_DIRECTORY, "attestation-policy.ts"), "utf8");
  const runtimeTemplate = readFileSync(resolve(TOOL_DIRECTORY, "attestation-runtime.template.txt"), "utf8");
  const preservationSource = readFileSync(resolve(TOOL_DIRECTORY, "preservation.ts"), "utf8");
  const patched = createPatchedSources({
    appSource: sourceBytes["App.tsx"].toString("utf8"),
    lifecycleSource: sourceBytes["src/application/trainingLifecycle/TrainingLifecycleUseCases.ts"].toString("utf8"),
    runtimeTemplate,
    policySource,
    preservationSource,
    nonce,
  });
  const patchedHashes = Object.fromEntries(Object.entries(patched).map(([filePath, value]) => [filePath, sha256(value)]));
  const toolSourceHashes = Object.fromEntries([
    "generate.mjs",
    "attestation-policy.ts",
    "attestation-runtime.template.txt",
    "preservation.ts",
  ].map((name) => [name, sha256(readFileSync(resolve(TOOL_DIRECTORY, name)))]));
  const patch = createUnifiedPatch(repoRoot, sourceBytes, patched);
  const patchSha256 = sha256(patch);
  git(repoRoot, ["apply", "--check", "--whitespace=error", "-"], { input: patch });
  const binding = makeBinding({ nonce, head, approval, toolSourceHashes, sourceHashes, patchedHashes, patchSha256 });
  const preparedBinding = Object.freeze({ ...binding, patchState: "prepared" });
  writeFileSync(safeBindingPath, `${stableStringify(preparedBinding)}\n`, { flag: "wx", mode: 0o600 });

  git(repoRoot, ["apply", "--whitespace=error", "-"], { input: patch });

  const statusPaths = parsePorcelainPaths(git(repoRoot, ["status", "--porcelain=v1", "--untracked-files=all"]));
  if (statusPaths.length !== ALLOWED_PATCH_PATHS.size || statusPaths.some((filePath) => !ALLOWED_PATCH_PATHS.has(filePath))) {
    throw new Error("post_patch_scope_mismatch");
  }
  for (const protectedPath of PROTECTED_PATHS) {
    if (statusPaths.some((filePath) => isWithin(resolve(repoRoot, protectedPath), resolve(repoRoot, filePath)))) {
      throw new Error("protected_source_modified");
    }
  }
  for (const filePath of OWNED_TARGETS) {
    if (filePath === OWNED_TARGETS[2] && sha256(readFileSync(resolve(repoRoot, filePath))) !== sourceHashes[filePath]) {
      throw new Error("content_lock_modified");
    }
  }
  for (const [filePath, expectedHash] of Object.entries(patchedHashes)) {
    if (sha256(readFileSync(resolve(repoRoot, filePath))) !== expectedHash) throw new Error("patched_file_hash_mismatch");
  }
  writeBindingAtomically(safeBindingPath, binding);
  return Object.freeze({ nonce, sourceRef: head, patchSha256, content: binding.content, binding: safeBindingPath });
}

export function hashAppTree(appPath) {
  const root = realpathSync(appPath);
  if (!lstatSync(root).isDirectory()) throw new Error("app_bundle_not_directory");
  const entries = [];
  const visit = (directory, prefix = "") => {
    for (const name of readdirSync(directory).sort()) {
      const absolute = resolve(directory, name);
      const child = prefix ? `${prefix}/${name}` : name;
      const info = lstatSync(absolute);
      if (info.isSymbolicLink()) entries.push([child, "symlink", readlinkTarget(absolute)]);
      else if (info.isDirectory()) {
        entries.push([child, "directory", ""]);
        visit(absolute, child);
      } else if (info.isFile()) entries.push([child, "file", sha256(readFileSync(absolute))]);
      else throw new Error("unsupported_app_bundle_entry");
    }
  };
  visit(root);
  return sha256(stableStringify(entries));
}

export function bindBuiltApp(bindingArgument, appArgument, embeddedJsArgument) {
  const bindingPath = realpathSync(bindingArgument);
  assertPrivateEvidenceFile(bindingPath);
  const binding = JSON.parse(readFileSync(bindingPath, "utf8"));
  if (binding?.schemaVersion !== "bizq01-q13-test-build-binding-v2" || binding?.patchState !== "applied" || binding.buildBinding !== null) throw new Error("binding_not_ready_for_build");
  if (!isQ13NonceText(binding.nonce)) throw new Error("binding_nonce_invalid");
  const appPath = realpathSync(appArgument);
  if (!basename(appPath).endsWith(".app") || !lstatSync(appPath).isDirectory()) throw new Error("app_bundle_path_invalid");
  const embeddedJsPath = realpathSync(embeddedJsArgument);
  if (!isWithin(appPath, embeddedJsPath) || !lstatSync(embeddedJsPath).isFile()) throw new Error("embedded_js_must_be_in_app_bundle");
  const updated = Object.freeze({
    ...binding,
    buildBinding: Object.freeze({ appTreeSha256: hashAppTree(appPath), embeddedJsSha256: sha256(readFileSync(embeddedJsPath)) }),
  });
  writeBindingAtomically(bindingPath, updated);
  return Object.freeze({ nonce: binding.nonce, appTreeSha256: updated.buildBinding.appTreeSha256, embeddedJsSha256: updated.buildBinding.embeddedJsSha256 });
}

export async function regenerateInstrumentedCheckout(repoArgument, previousBindingArgument, newBindingArgument, options = {}) {
  if (!["completed_bound", "failed_no_install", "unbuilt_no_install"].includes(options.previousBuildOutcome)) throw new Error("previous_build_outcome_required");
  const repoRoot = realpathSync(repoArgument);
  const previousBindingPath = realpathSync(previousBindingArgument);
  assertPrivateEvidenceFile(previousBindingPath);
  const newBindingPath = resolve(newBindingArgument);
  if (isWithin(repoRoot, previousBindingPath) || !options.newBindingPath) throw new Error("binding_path_must_be_external");
  const newBindingParent = realpathSync(dirname(newBindingPath));
  const safeNewBindingPath = resolve(newBindingParent, basename(newBindingPath));
  if (isWithin(repoRoot, safeNewBindingPath) || safeNewBindingPath === previousBindingPath) throw new Error("binding_path_must_be_external");
  if (!isPrivateTemporaryPath(safeNewBindingPath)) throw new Error("binding_path_must_be_private_tmp");
  if (existsSync(safeNewBindingPath)) throw new Error("binding_already_exists");

  const previous = JSON.parse(readFileSync(previousBindingPath, "utf8"));
  if (previous?.schemaVersion === "bizq01-q13-test-build-binding-v2") {
    return regenerateV2InstrumentedCheckout(repoRoot, previous, safeNewBindingPath, options);
  }
  const expectedOldPaths = [
    "App.tsx",
    "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts",
    "src/q13-test-attestation/attestation-policy.ts",
    "src/q13-test-attestation/attestation-runtime.ts",
  ];
  if (!hasExactKeys(previous, ["schemaVersion", "toolVersion", "nonce", "sourceRef", "content", "toolSourceSha256", "sourceFilesSha256", "patchedFilesSha256", "patchSha256", "patchState", "buildBinding"])
    || previous?.schemaVersion !== "bizq01-q13-test-build-binding-v1"
    || previous?.toolVersion !== "bizq01-q13-test-attestation-v1"
    || previous?.patchState !== "applied" || !isQ13NonceText(previous.nonce)
    || !isSha256Text(previous.patchSha256) || !hasExactKeys(previous.content, ["contentVersion", "artifactSha256"])
    || !isRecordWithExactSha256(previous.patchedFilesSha256, expectedOldPaths)
    || !isRecordWithExactSha256(previous.sourceFilesSha256, OWNED_TARGETS)
    || !(isRecordWithExactSha256(previous.toolSourceSha256, ["generate.mjs", "attestation-policy.ts", "attestation-runtime.template.ts"])
      || isRecordWithExactSha256(previous.toolSourceSha256, ["generate.mjs", "attestation-policy.ts", "attestation-runtime.template.txt"]))) {
    throw new Error("previous_binding_invalid");
  }
  if (options.previousBuildOutcome === "failed_no_install" || options.previousBuildOutcome === "unbuilt_no_install") {
    if (previous.buildBinding !== null) throw new Error("failed_build_must_not_claim_app_binding");
  } else if (!hasExactKeys(previous.buildBinding, ["appTreeSha256", "embeddedJsSha256"])
    || !isSha256Text(previous.buildBinding.embeddedJsSha256) || !isSha256Text(previous.buildBinding.appTreeSha256)) {
    throw new Error("completed_build_binding_required");
  }
  if (Object.keys(previous.patchedFilesSha256).sort().join("\n") !== [...expectedOldPaths].sort().join("\n")) throw new Error("previous_patch_scope_invalid");
  const head = git(repoRoot, ["rev-parse", "HEAD"]).trim();
  if (head !== previous.sourceRef || git(repoRoot, ["rev-parse", "--abbrev-ref", "HEAD"]).trim() !== "HEAD") throw new Error("previous_source_ref_mismatch");
  const admitted = APPROVED_REFS[head];
  if ((!admitted && !options.testOnlyApprovals?.[head]) || (admitted && (previous.content?.contentVersion !== admitted.contentVersion || previous.content?.artifactSha256 !== admitted.artifactSha256))) {
    throw new Error("previous_content_binding_mismatch");
  }
  const statusPaths = parsePorcelainPaths(git(repoRoot, ["status", "--porcelain=v1", "--untracked-files=all"]));
  if (statusPaths.length !== expectedOldPaths.length || statusPaths.some((filePath) => !expectedOldPaths.includes(filePath))) throw new Error("previous_checkout_scope_mismatch");
  for (const filePath of expectedOldPaths) {
    if (!lstatSync(resolve(repoRoot, filePath)).isFile()) throw new Error("previous_target_not_regular_file");
    if (sha256(readFileSync(resolve(repoRoot, filePath))) !== previous.patchedFilesSha256[filePath]) throw new Error("previous_patch_hash_mismatch");
  }
  for (const filePath of OWNED_TARGETS) {
    const original = git(repoRoot, ["show", `${head}:${filePath}`]);
    if (sha256(original) !== previous.sourceFilesSha256[filePath]) throw new Error("previous_source_hash_mismatch");
    if (filePath === OWNED_TARGETS[2] && sha256(readFileSync(resolve(repoRoot, filePath))) !== previous.sourceFilesSha256[filePath]) throw new Error("content_lock_changed");
  }
  const generatedDirectory = resolve(repoRoot, GENERATED_DIRECTORY);
  if (!lstatSync(generatedDirectory).isDirectory()) throw new Error("owned_generated_directory_invalid");
  if (readdirSync(generatedDirectory).sort().join("\n") !== ["attestation-policy.ts", "attestation-runtime.ts"].sort().join("\n")) throw new Error("owned_generated_directory_changed");
  const restored = Object.fromEntries(expectedOldPaths.slice(0, 2).map((filePath) => [filePath, git(repoRoot, ["show", `${head}:${filePath}`])]));

  for (const [filePath, contents] of Object.entries(restored)) writeFileSync(resolve(repoRoot, filePath), contents);
  for (const filePath of expectedOldPaths.slice(2)) unlinkSync(resolve(repoRoot, filePath));
  if (readdirSync(generatedDirectory).length !== 0) throw new Error("owned_generated_directory_not_empty");
  rmdirSync(generatedDirectory);
  if (git(repoRoot, ["status", "--porcelain=v1", "--untracked-files=all"]).trim() !== "") throw new Error("checkout_restore_not_clean");
  return applyPatchToDetachedCheckout(repoRoot, { bindingPath: safeNewBindingPath, ...(options.testOnlyApprovals ? { testOnlyApprovals: options.testOnlyApprovals } : {}) });
}

function regenerateV2InstrumentedCheckout(repoRoot, previous, safeNewBindingPath, options) {
  if (options.previousBuildOutcome !== "completed_bound") throw new Error("v2_regeneration_requires_completed_bound_build");
  const expectedPaths = [...ALLOWED_PATCH_PATHS].sort();
  const expectedToolSourceKeys = ["generate.mjs", "attestation-policy.ts", "attestation-runtime.template.txt", "preservation.ts"];
  if (!hasExactKeys(previous, ["schemaVersion", "toolVersion", "nonce", "sourceRef", "content", "toolSourceSha256", "sourceFilesSha256", "patchedFilesSha256", "patchSha256", "patchState", "buildBinding"])
    || previous.schemaVersion !== "bizq01-q13-test-build-binding-v2"
    || previous.toolVersion !== TOOL_VERSION
    || previous.patchState !== "applied" || !isQ13NonceText(previous.nonce)
    || !hasExactKeys(previous.content, ["contentVersion", "artifactSha256"])
    || !isSha256Text(previous.patchSha256)
    || !isRecordWithExactSha256(previous.toolSourceSha256, expectedToolSourceKeys)
    || !isRecordWithExactSha256(previous.sourceFilesSha256, OWNED_TARGETS)
    || !isRecordWithExactSha256(previous.patchedFilesSha256, expectedPaths)
    || !hasExactKeys(previous.buildBinding, ["appTreeSha256", "embeddedJsSha256"])
    || !isSha256Text(previous.buildBinding.appTreeSha256) || !isSha256Text(previous.buildBinding.embeddedJsSha256)) {
    throw new Error("previous_v2_binding_invalid");
  }

  const head = git(repoRoot, ["rev-parse", "HEAD"]).trim();
  if (head !== previous.sourceRef || git(repoRoot, ["rev-parse", "--abbrev-ref", "HEAD"]).trim() !== "HEAD") throw new Error("previous_source_ref_mismatch");
  const admitted = APPROVED_REFS[head] ?? options.testOnlyApprovals?.[head];
  if (!admitted || previous.content.contentVersion !== admitted.contentVersion || previous.content.artifactSha256 !== admitted.artifactSha256) {
    throw new Error("previous_content_binding_mismatch");
  }
  const statusPaths = parsePorcelainPaths(git(repoRoot, ["status", "--porcelain=v1", "--untracked-files=all"]));
  if (statusPaths.length !== expectedPaths.length || statusPaths.some((filePath) => !expectedPaths.includes(filePath))) throw new Error("previous_checkout_scope_mismatch");
  for (const filePath of expectedPaths) {
    if (!lstatSync(resolve(repoRoot, filePath)).isFile()) throw new Error("previous_target_not_regular_file");
    if (sha256(readFileSync(resolve(repoRoot, filePath))) !== previous.patchedFilesSha256[filePath]) throw new Error("previous_patch_hash_mismatch");
  }
  for (const filePath of OWNED_TARGETS) {
    const original = git(repoRoot, ["show", `${head}:${filePath}`]);
    if (sha256(original) !== previous.sourceFilesSha256[filePath]) throw new Error("previous_source_hash_mismatch");
    if (filePath === OWNED_TARGETS[2] && sha256(readFileSync(resolve(repoRoot, filePath))) !== previous.sourceFilesSha256[filePath]) throw new Error("content_lock_changed");
  }
  const generatedDirectory = resolve(repoRoot, GENERATED_DIRECTORY);
  if (!lstatSync(generatedDirectory).isDirectory()) throw new Error("owned_generated_directory_invalid");
  const expectedGeneratedNames = GENERATED_FILES.map((filePath) => basename(filePath)).sort();
  if (readdirSync(generatedDirectory).sort().join("\n") !== expectedGeneratedNames.join("\n")) throw new Error("owned_generated_directory_changed");

  const nonceFactory = options.testOnlyApprovals && options.testOnlyNonceFactory ? options.testOnlyNonceFactory : createNonce;
  const freshNonce = nonceFactory();
  if (!isQ13NonceText(freshNonce) || freshNonce === previous.nonce) throw new Error("fresh_regeneration_nonce_required");
  const restored = Object.fromEntries(OWNED_TARGETS.slice(0, 2).map((filePath) => [filePath, git(repoRoot, ["show", `${head}:${filePath}`])]));

  for (const [filePath, contents] of Object.entries(restored)) writeFileSync(resolve(repoRoot, filePath), contents);
  for (const filePath of GENERATED_FILES) unlinkSync(resolve(repoRoot, filePath));
  if (readdirSync(generatedDirectory).length !== 0) throw new Error("owned_generated_directory_not_empty");
  rmdirSync(generatedDirectory);
  if (git(repoRoot, ["status", "--porcelain=v1", "--untracked-files=all"]).trim() !== "") throw new Error("checkout_restore_not_clean");

  const result = applyPatchToDetachedCheckout(repoRoot, {
    bindingPath: safeNewBindingPath,
    nonce: freshNonce,
    ...(options.testOnlyApprovals ? { testOnlyApprovals: options.testOnlyApprovals } : {}),
  });
  return result;
}

export function comparePreservationFiles(oldBindingPath, newBindingPath, oldReceiptPath, newReceiptPath) {
  let input;
  try {
    oldBindingPath = assertPrivateEvidenceFile(realpathSync(oldBindingPath));
    newBindingPath = assertPrivateEvidenceFile(realpathSync(newBindingPath));
    oldReceiptPath = assertPrivateEvidenceFile(realpathSync(oldReceiptPath));
    newReceiptPath = assertPrivateEvidenceFile(realpathSync(newReceiptPath));
    input = {
      oldBinding: JSON.parse(readFileSync(oldBindingPath, "utf8")),
      newBinding: JSON.parse(readFileSync(newBindingPath, "utf8")),
      oldReceipt: JSON.parse(readFileSync(oldReceiptPath, "utf8")),
      newReceipt: JSON.parse(readFileSync(newReceiptPath, "utf8")),
    };
  } catch { throw new Error("private_evidence_unreadable"); }
  return compareQ13PreservationReceipts(input);
}

export function compareQ13PreservationReceipts(input) {
  const oldBinding = input.oldBinding;
  const newBinding = input.newBinding;
  const oldReceipt = input.oldReceipt;
  const newReceipt = input.newReceipt;
  const sourcePaths = ["App.tsx", "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts", "src/content/generated/canonical-content/content-lock.json"];
  const patchedPaths = ["App.tsx", "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts", "src/q13-test-attestation/attestation-policy.ts", "src/q13-test-attestation/attestation-runtime.ts", "src/q13-test-attestation/preservation.ts"];
  const toolPaths = ["generate.mjs", "attestation-policy.ts", "attestation-runtime.template.txt", "preservation.ts"];
  const currentToolHashes = Object.fromEntries(toolPaths.map((filePath) => [filePath, sha256(readFileSync(resolve(TOOL_DIRECTORY, filePath)))]));
  const validBinding = (binding, expectedRef) => binding?.schemaVersion === "bizq01-q13-test-build-binding-v2"
    && hasExactKeys(binding, ["schemaVersion", "toolVersion", "nonce", "sourceRef", "content", "toolSourceSha256", "sourceFilesSha256", "patchedFilesSha256", "patchSha256", "patchState", "buildBinding"])
    && binding.toolVersion === TOOL_VERSION && binding.patchState === "applied" && isQ13NonceText(binding.nonce)
    && binding.sourceRef === expectedRef && isSha256Text(binding.patchSha256)
    && hasExactKeys(binding.content, ["contentVersion", "artifactSha256"])
    && binding.content.contentVersion === APPROVED_REFS[expectedRef].contentVersion && binding.content.artifactSha256 === APPROVED_REFS[expectedRef].artifactSha256
    && hasExactShaMap(binding.sourceFilesSha256, sourcePaths) && hasExactShaMap(binding.patchedFilesSha256, patchedPaths)
    && sourcePaths.every((filePath) => binding.sourceFilesSha256[filePath] === APPROVED_REFS[expectedRef].files[filePath])
    && hasExactShaMap(binding.toolSourceSha256, toolPaths)
    && toolPaths.every((filePath) => binding.toolSourceSha256[filePath] === currentToolHashes[filePath])
    && hasExactKeys(binding.buildBinding, ["appTreeSha256", "embeddedJsSha256"])
    && isSha256Text(binding.patchSha256) && binding.buildBinding && isSha256Text(binding.buildBinding.appTreeSha256)
    && isSha256Text(binding.buildBinding.embeddedJsSha256);
  if (!validBinding(oldBinding, Object.keys(APPROVED_REFS)[0]) || !validBinding(newBinding, Object.keys(APPROVED_REFS)[1])) return { status: "fail", category: "build_binding_invalid" };
  if (oldBinding.nonce === newBinding.nonce) return { status: "fail", category: "nonce_binding_invalid" };
  const validReceipt = (receipt, binding, identity, stage) => receipt?.schemaVersion === "bizq01-q13-runtime-receipt-v2"
    && hasExactKeys(receipt, ["schemaVersion", "nonce", "contentVersion", "artifactSha256", "stage", "preservation"])
    && receipt.nonce === binding.nonce && receipt.contentVersion === identity.contentVersion
    && receipt.artifactSha256 === identity.artifactSha256 && receipt.stage === stage;
  if (!validReceipt(oldReceipt, oldBinding, APPROVED_REFS[oldBinding.sourceRef], "exact_resume_success")
    || !validReceipt(newReceipt, newBinding, APPROVED_REFS[newBinding.sourceRef], "identity_mismatch")) return { status: "fail", category: "runtime_receipt_invalid" };
  const left = oldReceipt.preservation;
  const right = newReceipt.preservation;
  const validSnapshot = (snapshot) => snapshot?.schema === "bizq01-q13-preservation-v1"
    && hasExactKeys(snapshot, ["schema", "semanticProjection", "profileKind", "transitionActive", "keyInventory", "categories", "session"])
    && snapshot.semanticProjection === "canonicalSerialize-envelope-v1-timer-exceptions-v1"
    && snapshot.profileKind === "account" && snapshot.transitionActive === false
    && hasExactKeys(snapshot.session, ["status", "trackId", "contentVersion", "artifactSha256", "actualLength", "currentItemIndex", "orderedItemsSha256", "orderedOptionsSha256", "attemptCount", "draftResponseCount", "activeJournalPresent", "persistedOldPin"])
    && snapshot.session?.status === "active" && snapshot.session.trackId === "object-oriented-design-interview"
    && snapshot.session.contentVersion === APPROVED_REFS[Object.keys(APPROVED_REFS)[0]].contentVersion
    && snapshot.session.artifactSha256 === APPROVED_REFS[Object.keys(APPROVED_REFS)[0]].artifactSha256
    && snapshot.session.actualLength === 1 && snapshot.session.currentItemIndex === 0
    && snapshot.session.attemptCount === 0 && snapshot.session.draftResponseCount === 0
    && snapshot.session.activeJournalPresent === false && snapshot.session.persistedOldPin === true
    && isSha256Text(snapshot.session.orderedItemsSha256) && isSha256Text(snapshot.session.orderedOptionsSha256)
    && Array.isArray(snapshot.keyInventory) && hasExactKeys(snapshot.categories, REQUIRED_CATEGORIES)
    && REQUIRED_CATEGORIES.every((category) => Array.isArray(snapshot.categories[category]))
    && snapshot.keyInventory.every((entry) => hasExactKeys(entry, ["keySha256", "category"]) && isSha256Text(entry.keySha256)
      && [...REQUIRED_CATEGORIES, ...INVENTORY_ONLY_CATEGORIES].includes(entry.category))
    && new Set(snapshot.keyInventory.map((entry) => entry.keySha256)).size === snapshot.keyInventory.length
    && REQUIRED_CATEGORIES.every((category) => {
      const entries = snapshot.categories[category];
      return entries.every((entry) => entry?.category === category && isSha256Text(entry.keySha256) && typeof entry.present === "boolean"
        && (entry.present
          ? hasExactKeys(entry, ["keySha256", "category", "present", "rawValueSha256", "semanticSha256"]) && isSha256Text(entry.rawValueSha256) && isSha256Text(entry.semanticSha256)
          : hasExactKeys(entry, ["keySha256", "category", "present"])))
        && entries.map((entry) => entry.keySha256).sort().join("\n")
          === snapshot.keyInventory.filter((entry) => entry.category === category).map((entry) => entry.keySha256).sort().join("\n");
    });
  if (!validSnapshot(left) || !validSnapshot(right)) return { status: "fail", category: "preservation_snapshot_invalid" };
  const sessionEqual = ["status", "trackId", "contentVersion", "artifactSha256", "actualLength", "currentItemIndex", "orderedItemsSha256", "orderedOptionsSha256", "attemptCount", "draftResponseCount", "activeJournalPresent", "persistedOldPin"]
    .every((key) => left.session[key] === right.session[key]);
  if (!sessionEqual) return { status: "fail", category: "session_facts_changed" };
  const inventoryKey = (entry) => `${entry?.keySha256}:${entry?.category}`;
  if (left.keyInventory.length !== right.keyInventory.length
    || left.keyInventory.some((entry, index) => inventoryKey(entry) !== inventoryKey(right.keyInventory[index]))) return { status: "fail", category: "key_inventory_changed" };
  for (const category of REQUIRED_CATEGORIES) {
    const normalize = (entries) => entries.map((entry) => `${entry?.keySha256}:${entry?.present}:${entry?.semanticSha256 ?? "absent"}`).sort();
    const first = normalize(left.categories[category]);
    const second = normalize(right.categories[category]);
    if (first.length !== second.length || first.some((entry, index) => entry !== second[index])) return { status: "fail", category: "canonical_semantics_changed" };
  }
  return { status: "pass", category: "preservation_equal" };
}

const REQUIRED_CATEGORIES = ["active-track", "learning-lifecycle", "learning-progress", "goals-and-plans", "user-settings", "reminder-settings", "learning-identity-history"];
const INVENTORY_ONLY_CATEGORIES = ["account-lifecycle-redacted", "profile-metadata-unread", "content-report-outbox-unread", "outside_canonical_namespace"];
function isSha256Text(value) { return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value); }
function hasExactKeys(value, expected) { return value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("\n") === [...expected].sort().join("\n"); }
function hasExactShaMap(value, expected) { return hasExactKeys(value, expected) && Object.values(value).every(isSha256Text); }

function createUnifiedPatch(repoRoot, sourceBytes, patchedSources) {
  const temporaryRoot = mkdtempSync(resolve(tmpdir(), "q13-attestation-patch-"));
  try {
    const sections = [];
    for (const [filePath, after] of Object.entries(patchedSources)) {
      const afterPath = resolve(temporaryRoot, "after", filePath);
      const beforePath = resolve(temporaryRoot, "before", filePath);
      mkdirParent(afterPath);
      writeFileSync(afterPath, after);
      const isNew = !Object.hasOwn(sourceBytes, filePath);
      if (isNew) {
        mkdirParent(beforePath);
        writeFileSync(beforePath, "");
      } else {
        mkdirParent(beforePath);
        writeFileSync(beforePath, sourceBytes[filePath]);
      }
      const oldLabel = isNew ? "/dev/null" : `a/${filePath}`;
      const diff = spawnSync("diff", ["-u", "--label", oldLabel, "--label", `b/${filePath}`, beforePath, afterPath], { encoding: "utf8" });
      if (diff.status !== 1 || diff.error) throw new Error("patch_diff_generation_failed");
      sections.push(`diff --git a/${filePath} b/${filePath}\n${isNew ? "new file mode 100644\n" : ""}${diff.stdout}`);
    }
    return sections.join("");
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function mkdirParent(filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function git(repoRoot, args, options = {}) {
  const result = spawnSync("git", ["-C", repoRoot, ...args], { encoding: "utf8", input: options.input });
  if (result.error || result.status !== 0) throw new Error("git_operation_failed");
  return result.stdout;
}

function parsePorcelainPaths(status) {
  return status.split("\n").filter(Boolean).map((line) => line.slice(3)).map((value) => value.includes(" -> ") ? value.split(" -> ").at(-1) : value);
}

function isWithin(root, candidate) {
  const relativePath = relative(root, candidate);
  return relativePath === "" || (!relativePath.startsWith(`..${sep}`) && relativePath !== ".." && !isAbsolute(relativePath));
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function readlinkTarget(filePath) {
  return readlinkSync(filePath);
}

function writeBindingAtomically(bindingPath, binding) {
  const temporaryPath = `${bindingPath}.q13-${randomBytes(8).toString("hex")}.tmp`;
  try {
    writeFileSync(temporaryPath, `${stableStringify(binding)}\n`, { flag: "wx", mode: 0o600 });
    renameSync(temporaryPath, bindingPath);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
}

function isQ13NonceText(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
}

function isRecordWithSha256(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length > 0 && Object.values(value).every(isSha256Text);
}

function isRecordWithExactSha256(value, expectedPaths) {
  return isRecordWithSha256(value) && Object.keys(value).sort().join("\n") === [...expectedPaths].sort().join("\n");
}

function isPrivateTemporaryPath(filePath) {
  const parent = realpathSync(dirname(filePath));
  const target = resolve(parent, basename(filePath));
  return ["/private/tmp", tmpdir()].some((root) => isWithin(resolve(root), target));
}

function assertPrivateEvidenceFile(filePath) {
  if (!isPrivateTemporaryPath(filePath) || (statSync(filePath).mode & 0o077) !== 0) throw new Error("evidence_file_must_be_private");
  return filePath;
}

function parseArguments(args) {
  const [command, ...rest] = args;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const key = rest[index];
    if (!key.startsWith("--") || index + 1 >= rest.length) throw new Error("invalid_arguments");
    const name = key.slice(2);
    if (!["repo", "binding", "nonce", "app", "embedded-js", "previous-binding", "previous-build-outcome", "old-receipt", "new-receipt", "old-binding", "new-binding"].includes(name) || options[name] !== undefined) throw new Error("invalid_arguments");
    options[name] = rest[++index];
  }
  return { command, options };
}

async function main(args) {
  const { command, options } = parseArguments(args);
  if (command === "apply") {
    if (!options.repo || !options.binding || options.app || options["embedded-js"]) throw new Error("invalid_arguments");
    const result = await applyPatchToDetachedCheckout(options.repo, { bindingPath: options.binding, ...(options.nonce ? { nonce: options.nonce } : {}) });
    process.stdout.write(`${JSON.stringify({ result: "patch_applied", sourceRef: result.sourceRef, nonce: result.nonce, patchSha256: result.patchSha256 })}\n`);
    return;
  }
  if (command === "bind-build") {
    if (!options.binding || !options.app || !options["embedded-js"] || options.repo || options.nonce) throw new Error("invalid_arguments");
    const result = bindBuiltApp(options.binding, options.app, options["embedded-js"]);
    process.stdout.write(`${JSON.stringify({ result: "build_bound", nonce: result.nonce, appTreeSha256: result.appTreeSha256, embeddedJsSha256: result.embeddedJsSha256 })}\n`);
    return;
  }
  if (command === "regenerate") {
    if (!options.repo || !options["previous-binding"] || !options.binding || !["completed_bound", "failed_no_install", "unbuilt_no_install"].includes(options["previous-build-outcome"])
      || options.app || options["embedded-js"] || options.nonce || options["old-receipt"] || options["new-receipt"] || options["old-binding"] || options["new-binding"]) throw new Error("invalid_arguments");
    const result = await regenerateInstrumentedCheckout(options.repo, options["previous-binding"], options.binding, {
      previousBuildOutcome: options["previous-build-outcome"],
      newBindingPath: options.binding,
    });
    process.stdout.write(`${JSON.stringify({ result: "instrumentation_regenerated", sourceRef: result.sourceRef, nonce: result.nonce, patchSha256: result.patchSha256 })}\n`);
    return;
  }
  if (command === "compare-preservation") {
    if (!options["old-binding"] || !options["new-binding"] || !options["old-receipt"] || !options["new-receipt"]
      || options.repo || options.binding || options.nonce || options.app || options["embedded-js"] || options["previous-binding"] || options["previous-build-outcome"]) throw new Error("invalid_arguments");
    const result = comparePreservationFiles(options["old-binding"], options["new-binding"], options["old-receipt"], options["new-receipt"]);
    process.stdout.write(`${JSON.stringify({ result: result.status, category: result.category })}\n`);
    if (result.status !== "pass") process.exitCode = 2;
    return;
  }
  throw new Error("invalid_command");
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) main(process.argv.slice(2)).catch((error) => {
  const category = error instanceof Error && /^[a-z][a-z0-9_]*$/u.test(error.message) ? error.message : "attestation_tool_failed";
  process.stderr.write(`q13_attestation_tool_failed:${category}\n`);
  process.exitCode = 1;
});
