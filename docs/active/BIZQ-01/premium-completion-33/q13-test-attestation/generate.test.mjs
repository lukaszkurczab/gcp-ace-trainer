import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import ts from "typescript";
import {
  APPROVED_REFS,
  applyPatchToDetachedCheckout,
  bindBuiltApp,
  createNonce,
  createPatchedSources,
  hashAppTree,
  parseContentLock,
  regenerateInstrumentedCheckout,
  sha256,
  TOOL_VERSION,
} from "./generate.mjs";

const repositoryRoot = realpathSync(new URL("../../../../../", import.meta.url).pathname);
const approvedHeads = Object.keys(APPROVED_REFS);
const fixedNonce = "a".repeat(64);

test("nonce generator emits a fresh-format 256-bit lowercase hex value", () => {
  const nonce = createNonce((length) => Buffer.alloc(length, 0x5a));
  assert.equal(nonce, "5a".repeat(32));
  assert.match(nonce, /^[a-f0-9]{64}$/u);
});

test("deterministic source transformation inserts only the entry and exact-resume hooks", () => {
  const ref = approvedHeads[0];
  const inputs = readApprovedSources(ref);
  const result = createPatchedSources({
    appSource: inputs["App.tsx"],
    lifecycleSource: inputs["src/application/trainingLifecycle/TrainingLifecycleUseCases.ts"],
    runtimeTemplate: readFileSync(new URL("./attestation-runtime.template.txt", import.meta.url), "utf8"),
    policySource: readFileSync(new URL("./attestation-policy.ts", import.meta.url), "utf8"),
    preservationSource: readFileSync(new URL("./preservation.ts", import.meta.url), "utf8"),
    nonce: fixedNonce,
  });
  assert.match(result["App.tsx"], /^import "\.\/src\/q13-test-attestation\/attestation-runtime";/u);
  assert.match(result["src/application/trainingLifecycle/TrainingLifecycleUseCases.ts"], /observeQ13ExactResume\(session, \(\) => this\.resolveRuntimeForSession\(session\)\)/u);
  assert.match(result["src/q13-test-attestation/attestation-runtime.ts"], new RegExp(fixedNonce, "u"));
  assert.doesNotMatch(result["src/q13-test-attestation/attestation-runtime.ts"], /__Q13_NONCE__/u);
  assert.deepEqual(Object.keys(result).sort(), [
    "App.tsx",
    "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts",
    "src/q13-test-attestation/attestation-policy.ts",
    "src/q13-test-attestation/attestation-runtime.ts",
    "src/q13-test-attestation/preservation.ts",
  ].sort());
  assert.equal(result["src/content/generated/canonical-content/content-lock.json"], undefined);
  for (const filePath of [
    "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts",
    "src/q13-test-attestation/attestation-policy.ts",
    "src/q13-test-attestation/attestation-runtime.ts",
    "src/q13-test-attestation/preservation.ts",
  ]) {
    const transpiled = ts.transpileModule(result[filePath], { reportDiagnostics: true, compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
    assert.deepEqual(transpiled.diagnostics?.map((diagnostic) => diagnostic.category).filter((category) => category === ts.DiagnosticCategory.Error), [], `${filePath} should remain valid TypeScript syntax`);
  }
});

test("generated v2 helpers typecheck with real repository storage, domain, and Expo contracts", (t) => {
  const sourceRef = approvedHeads[0];
  const inputs = readApprovedSources(sourceRef);
  const generated = createPatchedSources({
    appSource: inputs["App.tsx"],
    lifecycleSource: inputs["src/application/trainingLifecycle/TrainingLifecycleUseCases.ts"],
    runtimeTemplate: readFileSync(new URL("./attestation-runtime.template.txt", import.meta.url), "utf8"),
    policySource: readFileSync(new URL("./attestation-policy.ts", import.meta.url), "utf8"),
    preservationSource: readFileSync(new URL("./preservation.ts", import.meta.url), "utf8"),
    nonce: fixedNonce,
  });
  const tempRoot = mkdtempSync(join(tmpdir(), "q13-v2-typecheck-"));
  t.after(() => rmSync(tempRoot, { recursive: true, force: true }));
  const helperDirectory = join(tempRoot, "src/q13-test-attestation");
  mkdirSync(helperDirectory, { recursive: true });
  for (const [filePath, contents] of Object.entries(generated)) {
    if (!filePath.startsWith("src/q13-test-attestation/")) continue;
    writeFileSync(join(tempRoot, filePath), contents);
  }
  for (const directory of ["application", "content", "domain", "infrastructure", "storage"]) {
    symlinkSync(join(repositoryRoot, "src", directory), join(tempRoot, "src", directory), "dir");
  }
  symlinkSync(join(repositoryRoot, "node_modules"), join(tempRoot, "node_modules"), "dir");
  execFileSync(join(repositoryRoot, "node_modules/.bin/tsc"), [
    "--noEmit", "--strict", "--noImplicitReturns", "--noUncheckedIndexedAccess", "--resolveJsonModule", "--esModuleInterop",
    "--skipLibCheck", "--module", "esnext", "--target", "es2022", "--moduleResolution", "bundler", "--jsx", "react-native", "--types", "node",
    join(helperDirectory, "attestation-policy.ts"), join(helperDirectory, "attestation-runtime.ts"), join(helperDirectory, "preservation.ts"),
  ], { cwd: tempRoot, stdio: "pipe" });
});

test("apply refuses wrong ref, attached branch, dirty checkout, changed target hash, and in-repo binding before editing", async (t) => {
  const fixture = await makeFixture(t, approvedHeads[0]);
  const binding = join(fixture.parent, "binding.json");
  await assert.rejects(() => applyPatchToDetachedCheckout(fixture.repo, { bindingPath: binding, testOnlyApprovals: {} }), /unapproved_head/u);
  assert.equal(execGit(fixture.repo, ["rev-parse", "--abbrev-ref", "HEAD"]).trim(), "HEAD");
  assert.equal(await pathExists(binding), false);

  execGit(fixture.repo, ["checkout", "-q", "-b", "attached"]);
  await assert.rejects(() => applyPatchToDetachedCheckout(fixture.repo, { bindingPath: binding, testOnlyApprovals: fixture.approvals }), /checkout_not_detached/u);
  execGit(fixture.repo, ["checkout", "-q", "--detach", "HEAD"]);
  writeFileSync(join(fixture.repo, "App.tsx"), "tampered\n");
  await assert.rejects(() => applyPatchToDetachedCheckout(fixture.repo, { bindingPath: binding, testOnlyApprovals: fixture.approvals }), /checkout_not_clean/u);
  writeFileSync(join(fixture.repo, "App.tsx"), fixture.originals["App.tsx"]);
  const wrongHashApprovals = { [fixture.head]: { ...fixture.approval, files: { ...fixture.approval.files, "App.tsx": "0".repeat(64) } } };
  await assert.rejects(() => applyPatchToDetachedCheckout(fixture.repo, { bindingPath: binding, testOnlyApprovals: wrongHashApprovals }), /source_hash_mismatch/u);
  await assert.rejects(() => applyPatchToDetachedCheckout(fixture.repo, { bindingPath: join(fixture.repo, "binding.json"), testOnlyApprovals: fixture.approvals }), /binding_path_must_be_external/u);
});

test("apply writes only the owned test hooks and binds the exact source/patch hashes", async (t) => {
  const fixture = await makeFixture(t, approvedHeads[1]);
  const bindingPath = join(fixture.parent, "v24-binding.json");
  const result = await applyPatchToDetachedCheckout(fixture.repo, { bindingPath, nonce: fixedNonce, testOnlyApprovals: fixture.approvals });
  const binding = JSON.parse(readFileSync(bindingPath, "utf8"));
  assert.equal(binding.patchState, "applied");
  assert.equal(binding.sourceRef, fixture.head);
  assert.equal(binding.nonce, fixedNonce);
  assert.equal(binding.content.contentVersion, fixture.approval.contentVersion);
  assert.equal(binding.content.artifactSha256, fixture.approval.artifactSha256);
  assert.equal(binding.buildBinding, null);
  assert.match(binding.patchSha256, /^[a-f0-9]{64}$/u);
  assert.equal(result.patchSha256, binding.patchSha256);
  assert.deepEqual(execGit(fixture.repo, ["status", "--porcelain=v1", "--untracked-files=all"]).split("\n").filter(Boolean).map((line) => line.slice(3)).sort(), [
    "App.tsx",
    "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts",
    "src/q13-test-attestation/attestation-policy.ts",
    "src/q13-test-attestation/attestation-runtime.ts",
    "src/q13-test-attestation/preservation.ts",
  ].sort());
  assert.equal(readFileSync(join(fixture.repo, "src/content/generated/canonical-content/content-lock.json"), "utf8"), fixture.originals["src/content/generated/canonical-content/content-lock.json"]);
  assert.equal(readFileSync(join(fixture.repo, "App.tsx"), "utf8").includes(fixedNonce), false);
  assert.equal(readFileSync(join(fixture.repo, "src/q13-test-attestation/attestation-runtime.ts"), "utf8").includes(fixedNonce), true);
});

test("build binding hashes only the app tree and embedded JS, without storing paths", async (t) => {
  const fixture = await makeFixture(t, approvedHeads[1]);
  const bindingPath = join(fixture.parent, "build-binding.json");
  await applyPatchToDetachedCheckout(fixture.repo, { bindingPath, nonce: fixedNonce, testOnlyApprovals: fixture.approvals });
  const appPath = join(fixture.parent, "Patternly.app");
  mkdirSync(appPath);
  const jsPath = join(appPath, "main.jsbundle");
  writeFileSync(jsPath, "private test JS payload");
  writeFileSync(join(appPath, "Info.plist"), "opaque app metadata");
  const expectedTreeHash = hashAppTree(appPath);
  const bound = bindBuiltApp(bindingPath, appPath, jsPath);
  const record = JSON.parse(readFileSync(bindingPath, "utf8"));
  assert.equal(bound.appTreeSha256, expectedTreeHash);
  assert.equal(record.buildBinding.appTreeSha256, expectedTreeHash);
  assert.equal(record.buildBinding.embeddedJsSha256, sha256("private test JS payload"));
  assert.equal(JSON.stringify(record).includes(appPath), false);
  await assert.rejects(async () => bindBuiltApp(bindingPath, appPath, jsPath), /binding_not_ready_for_build/u);
});

test("regenerate verifies prior binding/scope, restores only owned files, and applies a fresh v2 nonce", async (t) => {
  const prior = await makePriorV1Fixture(t, { buildBinding: { appTreeSha256: "a".repeat(64), embeddedJsSha256: "b".repeat(64) }, toolTemplateExtension: "txt" });
  const { fixture, previousBindingPath, newBindingPath, appSource, patchedLifecycle } = prior;
  const oldNonce = fixedNonce;
  await assert.rejects(() => regenerateInstrumentedCheckout(fixture.repo, previousBindingPath, newBindingPath, { newBindingPath }), /previous_build_outcome_required/u);
  await assert.rejects(() => regenerateInstrumentedCheckout(fixture.repo, previousBindingPath, newBindingPath, { previousBuildOutcome: "failed_no_install", newBindingPath }), /failed_build_must_not_claim_app_binding/u);
  writeFileSync(join(fixture.repo, "App.tsx"), `${appSource}\n`);
  await assert.rejects(() => regenerateInstrumentedCheckout(fixture.repo, previousBindingPath, newBindingPath, {
    previousBuildOutcome: "completed_bound",
    newBindingPath,
    testOnlyApprovals: fixture.approvals,
  }), /previous_patch_hash_mismatch/u);
  assert.equal(readFileSync(join(fixture.repo, "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts"), "utf8"), patchedLifecycle);
  writeFileSync(join(fixture.repo, "App.tsx"), appSource);
  const result = await regenerateInstrumentedCheckout(fixture.repo, previousBindingPath, newBindingPath, {
    previousBuildOutcome: "completed_bound",
    newBindingPath,
    testOnlyApprovals: fixture.approvals,
  });
  const currentBinding = JSON.parse(readFileSync(newBindingPath, "utf8"));
  assert.equal(currentBinding.schemaVersion, "bizq01-q13-test-build-binding-v2");
  assert.equal(currentBinding.toolVersion, TOOL_VERSION);
  assert.notEqual(currentBinding.nonce, oldNonce);
  assert.equal(result.nonce, currentBinding.nonce);
  assert.equal(sha256(readFileSync(join(fixture.repo, "App.tsx"), "utf8")), currentBinding.patchedFilesSha256["App.tsx"]);
  assert.equal(sha256(readFileSync(join(fixture.repo, "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts"), "utf8")), currentBinding.patchedFilesSha256["src/application/trainingLifecycle/TrainingLifecycleUseCases.ts"]);
  assert.equal(existsSync(join(fixture.repo, "src/q13-test-attestation/preservation.ts")), true);
  assert.equal(readFileSync(join(fixture.repo, "src/content/generated/canonical-content/content-lock.json"), "utf8"), fixture.originals["src/content/generated/canonical-content/content-lock.json"]);
});

test("regenerate accepts an explicit failed_no_install outcome without inventing app or embedded-JS hashes", async (t) => {
  const prior = await makePriorV1Fixture(t, { buildBinding: null });
  const { fixture, previousBindingPath, newBindingPath } = prior;
  await assert.rejects(() => regenerateInstrumentedCheckout(fixture.repo, previousBindingPath, newBindingPath, {
    previousBuildOutcome: "completed_bound",
    newBindingPath,
    testOnlyApprovals: fixture.approvals,
  }), /completed_build_binding_required/u);
  await assert.rejects(() => regenerateInstrumentedCheckout(fixture.repo, previousBindingPath, newBindingPath, {
    previousBuildOutcome: "unknown",
    newBindingPath,
    testOnlyApprovals: fixture.approvals,
  }), /previous_build_outcome_required/u);
  const result = await regenerateInstrumentedCheckout(fixture.repo, previousBindingPath, newBindingPath, {
    previousBuildOutcome: "failed_no_install",
    newBindingPath,
    testOnlyApprovals: fixture.approvals,
  });
  const currentBinding = JSON.parse(readFileSync(newBindingPath, "utf8"));
  assert.equal(currentBinding.schemaVersion, "bizq01-q13-test-build-binding-v2");
  assert.equal(currentBinding.buildBinding, null);
  assert.equal(result.nonce, currentBinding.nonce);
  assert.equal(result.sourceRef, fixture.head);
  assert.equal(readFileSync(join(fixture.repo, "src/content/generated/canonical-content/content-lock.json"), "utf8"), fixture.originals["src/content/generated/canonical-content/content-lock.json"]);

  const unbuiltPrior = await makePriorV1Fixture(t, { buildBinding: null });
  const unbuiltResult = await regenerateInstrumentedCheckout(unbuiltPrior.fixture.repo, unbuiltPrior.previousBindingPath, unbuiltPrior.newBindingPath, {
    previousBuildOutcome: "unbuilt_no_install",
    newBindingPath: unbuiltPrior.newBindingPath,
    testOnlyApprovals: unbuiltPrior.fixture.approvals,
  });
  const unbuiltBinding = JSON.parse(readFileSync(unbuiltPrior.newBindingPath, "utf8"));
  assert.equal(unbuiltResult.sourceRef, unbuiltPrior.fixture.head);
  assert.equal(unbuiltBinding.buildBinding, null);
});

test("v2 regeneration preserves the old binding and applies only the five owned paths with a fresh nonce", async (t) => {
  const prior = await makePriorV2Fixture(t);
  const oldBindingBytes = readFileSync(prior.bindingPath);
  const result = await regenerateInstrumentedCheckout(prior.fixture.repo, prior.bindingPath, prior.newBindingPath, {
    previousBuildOutcome: "completed_bound",
    newBindingPath: prior.newBindingPath,
    testOnlyApprovals: prior.fixture.approvals,
    testOnlyNonceFactory: () => "b".repeat(64),
  });
  const nextBinding = JSON.parse(readFileSync(prior.newBindingPath, "utf8"));
  assert.equal(nextBinding.schemaVersion, "bizq01-q13-test-build-binding-v2");
  assert.equal(nextBinding.sourceRef, prior.fixture.head);
  assert.notEqual(nextBinding.nonce, prior.oldNonce);
  assert.equal(nextBinding.nonce, result.nonce);
  assert.equal(nextBinding.buildBinding, null);
  assert.deepEqual(Object.keys(nextBinding.patchedFilesSha256).sort(), [
    "App.tsx",
    "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts",
    "src/q13-test-attestation/attestation-policy.ts",
    "src/q13-test-attestation/attestation-runtime.ts",
    "src/q13-test-attestation/preservation.ts",
  ].sort());
  assert.deepEqual(readFileSync(prior.bindingPath), oldBindingBytes);
  assert.equal(readFileSync(join(prior.fixture.repo, "src/content/generated/canonical-content/content-lock.json"), "utf8"), prior.fixture.originals["src/content/generated/canonical-content/content-lock.json"]);
  assert.deepEqual(execGit(prior.fixture.repo, ["status", "--porcelain=v1", "--untracked-files=all"]).split("\n").filter(Boolean).map((line) => line.slice(3)).sort(), Object.keys(nextBinding.patchedFilesSha256).sort());
});

test("v2 regeneration rejects identical nonce before mutation", async (t) => {
  const prior = await makePriorV2Fixture(t);
  const before = execGit(prior.fixture.repo, ["status", "--porcelain=v1", "--untracked-files=all"]);
  const oldBindingBytes = readFileSync(prior.bindingPath);
  await assert.rejects(() => regenerateInstrumentedCheckout(prior.fixture.repo, prior.bindingPath, prior.newBindingPath, {
    previousBuildOutcome: "completed_bound",
    newBindingPath: prior.newBindingPath,
    testOnlyApprovals: prior.fixture.approvals,
    testOnlyNonceFactory: () => prior.oldNonce,
  }), /fresh_regeneration_nonce_required/u);
  assert.equal(execGit(prior.fixture.repo, ["status", "--porcelain=v1", "--untracked-files=all"]), before);
  assert.deepEqual(readFileSync(prior.bindingPath), oldBindingBytes);
  assert.equal(existsSync(prior.newBindingPath), false);
});

test("v2 regeneration requires a completed app-bound prior build", async (t) => {
  const prior = await makePriorV2Fixture(t);
  const before = execGit(prior.fixture.repo, ["status", "--porcelain=v1", "--untracked-files=all"]);
  await assert.rejects(() => regenerateInstrumentedCheckout(prior.fixture.repo, prior.bindingPath, prior.newBindingPath, {
    previousBuildOutcome: "failed_no_install",
    newBindingPath: prior.newBindingPath,
    testOnlyApprovals: prior.fixture.approvals,
  }), /v2_regeneration_requires_completed_bound_build/u);
  assert.equal(execGit(prior.fixture.repo, ["status", "--porcelain=v1", "--untracked-files=all"]), before);
  assert.equal(existsSync(prior.newBindingPath), false);
});

test("v2 regeneration refuses an already-existing external output binding before mutation", async (t) => {
  const prior = await makePriorV2Fixture(t);
  const before = execGit(prior.fixture.repo, ["status", "--porcelain=v1", "--untracked-files=all"]);
  writeFileSync(prior.newBindingPath, "reserved evidence output", { mode: 0o600 });
  await assert.rejects(() => regenerateInstrumentedCheckout(prior.fixture.repo, prior.bindingPath, prior.newBindingPath, {
    previousBuildOutcome: "completed_bound",
    newBindingPath: prior.newBindingPath,
    testOnlyApprovals: prior.fixture.approvals,
  }), /binding_already_exists/u);
  assert.equal(execGit(prior.fixture.repo, ["status", "--porcelain=v1", "--untracked-files=all"]), before);
  assert.equal(readFileSync(prior.newBindingPath, "utf8"), "reserved evidence output");
});

test("v2 regeneration refuses stale bindings and changed, missing, extra, or symlink patch paths before mutation", async (t) => {
  const cases = [
    { name: "changed path hash", mutate: (prior) => writeFileSync(join(prior.fixture.repo, "App.tsx"), `${readFileSync(join(prior.fixture.repo, "App.tsx"), "utf8")}\n`), error: /previous_patch_hash_mismatch/u },
    { name: "missing path", mutate: (prior) => rmSync(join(prior.fixture.repo, "src/q13-test-attestation/preservation.ts")), error: /previous_checkout_scope_mismatch/u },
    { name: "extra path", mutate: (prior) => writeFileSync(join(prior.fixture.repo, "src/q13-test-attestation/extra.txt"), "extra"), error: /previous_checkout_scope_mismatch/u },
    { name: "symlink path", mutate: (prior) => { const path = join(prior.fixture.repo, "src/q13-test-attestation/preservation.ts"); rmSync(path); symlinkSync(join(prior.fixture.repo, "App.tsx"), path); }, error: /previous_target_not_regular_file/u },
    { name: "stale ref", mutateBinding: (binding) => { binding.sourceRef = approvedHeads[1]; }, error: /previous_source_ref_mismatch/u },
    { name: "stale content", mutateBinding: (binding) => { binding.content.artifactSha256 = "9".repeat(64); }, error: /previous_content_binding_mismatch/u },
    { name: "stale source hash", mutateBinding: (binding) => { binding.sourceFilesSha256["App.tsx"] = "9".repeat(64); }, error: /previous_source_hash_mismatch/u },
    { name: "invalid build binding", mutateBinding: (binding) => { binding.buildBinding.appTreeSha256 = "invalid"; }, error: /previous_v2_binding_invalid/u },
    { name: "extra tool hash", mutateBinding: (binding) => { binding.toolSourceSha256.extra = "9".repeat(64); }, error: /previous_v2_binding_invalid/u },
  ];
  for (const scenario of cases) {
    const prior = await makePriorV2Fixture(t);
    if (scenario.mutate) scenario.mutate(prior);
    if (scenario.mutateBinding) {
      const binding = JSON.parse(readFileSync(prior.bindingPath, "utf8"));
      scenario.mutateBinding(binding);
      writeFileSync(prior.bindingPath, `${JSON.stringify(binding)}\n`, { mode: 0o600 });
    }
    const before = execGit(prior.fixture.repo, ["status", "--porcelain=v1", "--untracked-files=all"]);
    const oldBindingBytes = readFileSync(prior.bindingPath);
    await assert.rejects(() => regenerateInstrumentedCheckout(prior.fixture.repo, prior.bindingPath, prior.newBindingPath, {
      previousBuildOutcome: "completed_bound",
      newBindingPath: prior.newBindingPath,
      testOnlyApprovals: prior.fixture.approvals,
    }), scenario.error, scenario.name);
    assert.equal(execGit(prior.fixture.repo, ["status", "--porcelain=v1", "--untracked-files=all"]), before, scenario.name);
    assert.deepEqual(readFileSync(prior.bindingPath), oldBindingBytes, scenario.name);
    assert.equal(existsSync(prior.newBindingPath), false, scenario.name);
  }
});

test("Release build driver requests Xcode simulator ad-hoc signing rather than linker signing", () => {
  const buildScript = readFileSync(new URL("../q13-build-release.mjs", import.meta.url), "utf8");
  assert.match(buildScript, /'CODE_SIGNING_ALLOWED=YES'/u);
  assert.match(buildScript, /'CODE_SIGN_IDENTITY=-'/u);
  assert.doesNotMatch(buildScript, /CODE_SIGNING_ALLOWED=NO/u);
});

test("content lock reader requires the OOD entry and a well-formed public artifact hash", () => {
  assert.deepEqual(parseContentLock(JSON.stringify({ tracks: [
    { trackId: "object-oriented-design-interview", contentVersion: "v24", sha256: "9".repeat(64) },
  ] })), { contentVersion: "v24", artifactSha256: "9".repeat(64) });
  assert.throws(() => parseContentLock("{}"), /ood_content_identity_missing/u);
  assert.throws(() => parseContentLock(JSON.stringify({ tracks: [{ trackId: "object-oriented-design-interview", contentVersion: "v24", sha256: "bad" }] })), /ood_content_hash_invalid/u);
});

async function makePriorV1Fixture(t, { buildBinding, toolTemplateExtension = "ts" }) {
  const fixture = await makeFixture(t, approvedHeads[0]);
  const oldNonce = fixedNonce;
  const appSource = `import "./src/q13-test-attestation/attestation-runtime";\n${fixture.originals["App.tsx"]}`;
  const lifecycleOriginal = fixture.originals["src/application/trainingLifecycle/TrainingLifecycleUseCases.ts"];
  const patchedLifecycle = lifecycleOriginal.replace(
    'import { MutationCommitFailure } from "../mutationBoundary";',
    'import { MutationCommitFailure } from "../mutationBoundary";\nimport { observeQ13ExactResume } from "../../q13-test-attestation/attestation-runtime";',
  ).replace(
    "const runtime = await this.resolveRuntimeForSession(session);",
    "const runtime = await observeQ13ExactResume(session, () => this.resolveRuntimeForSession(session));",
  );
  const oldPatched = {
    "App.tsx": appSource,
    "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts": patchedLifecycle,
    "src/q13-test-attestation/attestation-policy.ts": "// old bound test policy\n",
    "src/q13-test-attestation/attestation-runtime.ts": "// old bound test runtime\n".replace("__NONCE__", oldNonce),
  };
  for (const [filePath, content] of Object.entries(oldPatched)) {
    const destination = join(fixture.repo, filePath);
    mkdirSync(dirnameFor(destination), { recursive: true });
    writeFileSync(destination, content);
  }
  const sourceHashes = Object.fromEntries(Object.entries(fixture.originals).map(([filePath, content]) => [filePath, sha256(content)]));
  const previousBinding = {
    schemaVersion: "bizq01-q13-test-build-binding-v1",
    toolVersion: "bizq01-q13-test-attestation-v1",
    nonce: oldNonce,
    sourceRef: fixture.head,
    content: { contentVersion: fixture.approval.contentVersion, artifactSha256: fixture.approval.artifactSha256 },
    toolSourceSha256: {
      "generate.mjs": "7".repeat(64),
      "attestation-policy.ts": "8".repeat(64),
      [`attestation-runtime.template.${toolTemplateExtension}`]: "9".repeat(64),
    },
    sourceFilesSha256: sourceHashes,
    patchedFilesSha256: Object.fromEntries(Object.entries(oldPatched).map(([filePath, content]) => [filePath, sha256(content)])),
    patchSha256: "c".repeat(64),
    patchState: "applied",
    buildBinding,
  };
  const previousBindingPath = join(fixture.parent, "previous-v1-binding.json");
  writeFileSync(previousBindingPath, JSON.stringify(previousBinding), { mode: 0o600 });
  return { fixture, appSource, patchedLifecycle, previousBindingPath, newBindingPath: join(fixture.parent, "fresh-v2-binding.json") };
}

async function makePriorV2Fixture(t) {
  const fixture = await makeFixture(t, approvedHeads[0]);
  const oldNonce = fixedNonce;
  const bindingPath = join(fixture.parent, "previous-v2-binding.json");
  await applyPatchToDetachedCheckout(fixture.repo, {
    bindingPath,
    nonce: oldNonce,
    testOnlyApprovals: fixture.approvals,
  });
  const appPath = join(fixture.parent, "PreviousPatternly.app");
  mkdirSync(appPath);
  const embeddedJsPath = join(appPath, "main.jsbundle");
  writeFileSync(embeddedJsPath, "previous exact bound embedded JavaScript");
  writeFileSync(join(appPath, "Info.plist"), "opaque prior app metadata");
  bindBuiltApp(bindingPath, appPath, embeddedJsPath);
  return {
    fixture,
    bindingPath,
    newBindingPath: join(fixture.parent, "fresh-v2-binding.json"),
    oldNonce,
  };
}

async function makeFixture(t, ref) {
  const parent = mkdtempSync(join(tmpdir(), "q13-test-attestation-"));
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const repo = join(parent, "checkout");
  mkdirSync(repo);
  execGit(repo, ["init", "-q"]);
  execGit(repo, ["config", "user.name", "Q13 Fixture"]);
  execGit(repo, ["config", "user.email", "q13-fixture@invalid.example"]);
  const originals = readApprovedSources(ref);
  for (const [filePath, content] of Object.entries(originals)) {
    const destination = join(repo, filePath);
    mkdirSync(dirnameFor(destination), { recursive: true });
    writeFileSync(destination, content);
  }
  execGit(repo, ["add", "App.tsx", "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts", "src/content/generated/canonical-content/content-lock.json"]);
  execGit(repo, ["commit", "-q", "-m", "fixture"]);
  execGit(repo, ["checkout", "-q", "--detach", "HEAD"]);
  const head = execGit(repo, ["rev-parse", "HEAD"]).trim();
  const files = Object.fromEntries(Object.entries(originals).map(([filePath, content]) => [filePath, sha256(content)]));
  const content = parseContentLock(originals["src/content/generated/canonical-content/content-lock.json"]);
  const approval = { contentVersion: content.contentVersion, artifactSha256: content.artifactSha256, files };
  return { parent, repo, head, originals, approval, approvals: { [head]: approval } };
}

function readApprovedSources(ref) {
  const filePaths = [
    "App.tsx",
    "src/application/trainingLifecycle/TrainingLifecycleUseCases.ts",
    "src/content/generated/canonical-content/content-lock.json",
  ];
  return Object.fromEntries(filePaths.map((filePath) => [filePath, execFileSync("git", ["-C", repositoryRoot, "show", `${ref}:${filePath}`], { encoding: "utf8" })]));
}

function execGit(repo, args) {
  return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", env: { ...process.env, GIT_AUTHOR_NAME: "Q13 Fixture", GIT_AUTHOR_EMAIL: "q13-fixture@invalid.example", GIT_COMMITTER_NAME: "Q13 Fixture", GIT_COMMITTER_EMAIL: "q13-fixture@invalid.example" } });
}

function dirnameFor(filePath) {
  return resolve(filePath, "..");
}

async function pathExists(filePath) {
  try { readFileSync(filePath); return true; } catch { return false; }
}
