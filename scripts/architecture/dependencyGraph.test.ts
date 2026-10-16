import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { createDependencyGraph, type Platform } from "./dependencyGraph";
import { checkBoundaries, formatViolations, runtimeTestSupportViolations } from "./checkBoundaries";

const metroRoot = process.cwd();
function fixture(files: Record<string, string>, platform: Platform = "typescript", options: Record<string, unknown> = {}) {
  const root = mkdtempSync(join(tmpdir(), "patternly-arch08-"));
  writeFileSync(join(root, "tsconfig.json"), JSON.stringify({ extends: join(metroRoot, "tsconfig.json"), include: ["App.ts", "src/**/*"], compilerOptions: options }));
  for (const [path, source] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), source);
  }
  try {
    const graph = createDependencyGraph({ root, metroRoot, platform });
    return { violations: checkBoundaries(graph, ["App.ts"]), graph };
  } finally { rmSync(root, { recursive: true, force: true }); }
}
const repo = "src/storage/repositories/secret.ts";
const store = "export const save = () => 1; export interface Record { value: number }";
const redCases: Record<string, { files: Record<string, string>; rule: string; path: string[] }> = {
  direct: { files: { "src/features/screen.ts": 'import { save } from "../storage/repositories/secret"; export { save };', [repo]: store }, rule: "UI delegates", path: [repo] },
  barrel: { files: { "src/features/screen.ts": 'import { save } from "../application/barrel"; export { save };', "src/application/barrel.ts": 'export { save } from "../storage/repositories/secret";', [repo]: store }, rule: "UI delegates", path: ["src/application/barrel.ts", repo] },
  "import then export alias": { files: { "src/features/screen.ts": 'import { hidden } from "../application/barrel"; export { hidden };', "src/application/barrel.ts": 'import { save } from "../storage/repositories/secret"; export { save as hidden };', [repo]: store }, rule: "UI delegates", path: [repo] },
  "export star barrel": { files: { "src/features/screen.ts": 'export * from "../application/barrel";', "src/application/barrel.ts": 'export * from "../storage/repositories/secret";', [repo]: store }, rule: "UI delegates", path: [repo] },
  namespace: { files: { "src/features/screen.ts": 'import * as api from "../application/barrel"; api.save();', "src/application/barrel.ts": 'export * from "../storage/repositories/secret";', [repo]: store }, rule: "UI delegates", path: [repo] },
  "type import": { files: { "src/application/coding-interview/codingInterviewContracts.ts": 'import type { Mode } from "../../features/mode"; export type Input = Mode;', "src/features/mode.ts": 'export type Mode = "practice";' }, rule: "F-08", path: ["src/features/mode.ts"] },
  "type import expression": { files: { "src/application/coding-interview/codingInterviewContracts.ts": 'export type Input = import("../../features/mode").Mode;', "src/features/mode.ts": 'export type Mode = "practice";' }, rule: "F-08", path: ["src/features/mode.ts"] },
  "type re-export": { files: { "src/features/screen.ts": 'import type { Record } from "../neutral/barrel"; export type R = Record;', "src/neutral/barrel.ts": 'export type { Record } from "../storage/repositories/secret";', [repo]: store }, rule: "UI delegates", path: [repo] },
  transitive: { files: { "src/domain/learning/kernel.ts": 'import { value } from "../../neutral/helper"; export { value };', "src/neutral/helper.ts": 'import { value } from "../content/catalog"; export const other = value; export const value2 = 2; export { value };', "src/content/catalog.ts": 'export const value = 1;' }, rule: "kernel isolation", path: ["src/neutral/helper.ts", "src/content/catalog.ts"] },
  "kernel runtime barrel loads sibling": { files: { "src/domain/learning/kernel.ts": 'import { safe } from "../../neutral/barrel"; export { safe };', "src/neutral/barrel.ts": 'export const safe = 1; export * from "../content/catalog";', "src/content/catalog.ts": 'export const value = 1;' }, rule: "kernel isolation", path: ["src/neutral/barrel.ts", "src/content/catalog.ts"] },
  cycle: { files: { "src/domain/learning/kernel.ts": 'export * from "../../neutral/a";', "src/neutral/a.ts": 'export * from "./b";', "src/neutral/b.ts": 'export * from "./a"; export * from "../content/catalog";', "src/content/catalog.ts": 'export const value = 1;' }, rule: "kernel isolation", path: ["src/content/catalog.ts"] },
  "family crossing": { files: { "src/tracks/coding-interview/model.ts": 'export type { Model } from "../certification/model";', "src/tracks/certification/model.ts": 'export type Model = string;' }, rule: "family isolation", path: ["src/tracks/certification/model.ts"] },
  "family raw storage": { files: { "src/application/coding-interview/codingInterviewTrainingRuntime.ts": 'import { save } from "../../storage/repositories/secret"; export { save };', [repo]: store }, rule: "family isolation", path: [repo] },
  "UI scoring": { files: { "src/features/screen.ts": 'import { score } from "../content/canonical/questionScoring"; score();', "src/content/canonical/questionScoring.ts": 'export const score = () => 1;' }, rule: "UI delegates", path: ["src/content/canonical/questionScoring.ts"] },
  "UI review mutation": { files: { "src/features/screen.ts": 'import { mutate } from "../domain/learning/reviewCycleTransition"; mutate();', "src/domain/learning/reviewCycleTransition.ts": 'export const mutate = () => 1;' }, rule: "UI delegates", path: ["src/domain/learning/reviewCycleTransition.ts"] },
  "domain content orchestration": { files: { "src/content/canonical/model.ts": 'import { run } from "../../application/controller"; run();', "src/application/controller.ts": 'export const run = () => 1;' }, rule: "domain content", path: ["src/application/controller.ts"] },
  "envelope guard item semantics": { files: { "src/storage/repositories/trainingModelGuards.ts": 'import { value } from "../../content/catalog"; export { value };', "src/content/catalog.ts": 'export const value = 1;' }, rule: "envelope guards", path: ["src/content/catalog.ts"] },
  "dynamic import": { files: { "src/features/screen.ts": 'export const load = () => import("../storage/repositories/secret");', [repo]: store }, rule: "UI delegates", path: [repo] },
  require: { files: { "src/features/screen.ts": 'const api = require("../storage/repositories/secret"); api.save();', [repo]: store }, rule: "UI delegates", path: [repo] },
  "raw public storage": { files: { "src/storage/index.ts": 'export * from "./keys";', "src/storage/keys.ts": 'export const secret = 1;' }, rule: "public storage", path: ["src/storage/keys.ts"] },
};
for (const [name, { files, rule, path }] of Object.entries(redCases)) test(`RED -> GREEN: ${name}`, () => {
  const red = fixture(files).violations;
  assert.ok(red.some((v) => v.rule.includes(rule) && path.every((file) => v.path.includes(file))), formatViolations(red));
  const owner = Object.keys(files)[0]!;
  const green = fixture({ ...files, [owner]: "export const neutral = 1;" }).violations;
  assert.equal(green.filter((v) => v.path[0] === owner).length, 0, formatViolations(green));
});

test("GREEN: UI application function -> port -> composition -> infrastructure; selected legal barrel export", () => {
  const { violations } = fixture({
    "src/features/screen.ts": 'import { command } from "../application/index"; command();',
    "src/application/index.ts": 'export { command } from "./facade"; export { save } from "../storage/repositories/secret";',
    "src/application/facade.ts": 'import { port } from "./composition"; export const command = () => port.save();',
    "src/application/composition.ts": 'import { save } from "../storage/repositories/secret"; export const port = { save };',
    [repo]: store,
  });
  assert.deepEqual(violations, [], formatViolations(violations));
});
test("GREEN: registry/config concrete track metadata and UI question types", () => {
  const { violations } = fixture({
    "src/features/screen.ts": 'import { tracks } from "../domain/tracks/trackRegistry"; import type { Question } from "../content/canonical"; export const id = tracks[0]; export type View = Question;',
    "src/domain/tracks/trackRegistry.ts": 'export const tracks = ["google-cloud-associate-cloud-engineer", "coding-interview-dsa-problem-solving"];',
    "src/content/canonical/index.ts": 'export type { Question } from "./questionTypes"; export { score } from "./questionScoring";',
    "src/content/canonical/questionTypes.ts": 'export interface Question { prompt: string }',
    "src/content/canonical/questionScoring.ts": 'export const score = () => 1;',
  });
  assert.deepEqual(violations, [], formatViolations(violations));
});
test("GREEN: harmless local names and legal cycles", () => {
  assert.deepEqual(fixture({ "src/features/screen.ts": 'export const saveTrainingSession = () => "commitMutation";', "src/domain/learning/a.ts": 'export * from "./b";', "src/domain/learning/b.ts": 'export * from "./a";' }).violations, []);
});
test("configured TS paths are resolved, not interpreted as external packages", () => {
  const { violations } = fixture({ "src/features/screen.ts": 'import { save } from "@store/secret"; save();', [repo]: store }, "typescript", { paths: { "@store/*": ["./src/storage/repositories/*"] } });
  assert.ok(violations.some((v) => v.path.includes(repo)), formatViolations(violations));
});
for (const platform of ["ios", "android"] as const) test(`RED -> GREEN: actual ${platform}/native selection and extension precedence`, () => {
  const files = { "src/features/screen.ts": 'import { value } from "../neutral/variant"; export { value };', "src/neutral/variant.ts": 'export const value = 1;', "src/neutral/variant.native.ts": 'export { save as value } from "../storage/repositories/secret";', [repo]: store };
  assert.deepEqual(fixture(files).violations, []);
  const native = fixture(files, platform);
  assert.ok(native.graph.edges.get(join(native.graph.root, "src/features/screen.ts"))?.some((e) => e.to.endsWith("variant.native.ts")));
  assert.ok(native.violations.some((v) => v.path.includes(repo)), formatViolations(native.violations) + JSON.stringify([...native.graph.edges.values()].flat().map(e=>({from:native.graph.label(e.from),to:native.graph.label(e.to),origins:native.graph.origins(e).map(o=>native.graph.label(o.file))}))));
  const green = fixture({ ...files, [`src/neutral/variant.${platform}.ts`]: 'export const value = 1;' }, platform);
  assert.deepEqual(green.violations, [], formatViolations(green.violations));
  // Metro prioritizes extension before platform: .ts beats .native.tsx.
  assert.deepEqual(fixture({ ...files, "src/neutral/variant.native.ts": 'export const value = 1;', [`src/neutral/variant.${platform}.tsx`]: 'export { save as value } from "../storage/repositories/secret";' }, platform).violations, []);
});
test("unresolved relative module and nonliteral active load fail explicitly", () => {
  assert.throws(() => fixture({ "src/features/screen.ts": 'import { save } from "./missing"; save();' }), /architecture\/resolve/);
  assert.ok(fixture({ "src/features/screen.ts": 'declare const name: string; require(name);' }).violations.some((v) => v.rule.includes("resolvable")));
});


test("RED -> GREEN: test support follows the runtime entry, not helper filename", () => {
  const files = {
    "App.ts": 'export const app = 1;',
    "src/testing/terminalWireFixture.ts": 'import { install } from "./journalTestSupport"; export const fixture = () => install();',
    "src/testing/journalTestSupport.ts": 'export const install = () => 1;',
  };
  assert.deepEqual(runtimeTestSupportViolations(fixture(files).graph, ["App.ts"]), []);
  const red = fixture({ ...files, "App.ts": 'import { fixture } from "./src/testing/terminalWireFixture"; fixture();' });
  assert.ok(runtimeTestSupportViolations(red.graph, ["App.ts"]).some((value) => value.includes("terminalWireFixture.ts") && value.includes("journalTestSupport.ts")));
});
test("RED -> GREEN: mixed default and named imports retain both bindings", () => {
  const files = { "src/features/screen.ts": 'import save, { label } from "../application/barrel"; save(); export { label };', "src/application/barrel.ts": 'export { save as default } from "../storage/repositories/secret"; export const label = "safe";', [repo]: store };
  assert.ok(fixture(files).violations.some((v) => v.path.includes(repo)));
  assert.deepEqual(fixture({ ...files, "src/features/screen.ts": 'import { label } from "../application/barrel"; export { label };' }).violations, []);
});


test("GREEN: explicit data contracts crossing application and repository ports", () => {
  assert.deepEqual(fixture({
    "src/features/screen.ts": 'import type { StorageIssue } from "../application/reads"; export type View = StorageIssue;',
    "src/application/reads.ts": 'export type { StorageIssue } from "../storage/repositories/result";',
    "src/storage/repositories/result.ts": 'export interface StorageIssue { key: string }',
    "src/application/learningMutations/command.ts": 'import type { Lease } from "../../storage/repositories/journal"; export type Command = Lease;',
    "src/storage/repositories/journal.ts": 'export type { Lease } from "../../infrastructure/storage/client";',
    "src/infrastructure/storage/client.ts": 'export interface Lease { revision: number }',
  }).violations, []);
});
test("RED -> GREEN: shared family switch imports concrete runtimes outside composition", () => {
  const files = {
    "src/application/contentPackageRuntimeOwner.ts": 'import { CodingRuntime } from "./coding-interview/codingInterviewTrainingRuntime"; export function select(family: string) { switch (family) { case "coding_interview": return new CodingRuntime(); default: throw Error("unknown"); } }',
    "src/application/coding-interview/codingInterviewTrainingRuntime.ts": 'export class CodingRuntime {}',
  };
  const red = fixture(files).violations;
  assert.ok(red.some(v => v.rule.includes("registered family factories") && v.path.includes("src/application/coding-interview/codingInterviewTrainingRuntime.ts")), formatViolations(red));
  const green = fixture({ ...files,
    "src/application/contentPackageRuntimeOwner.ts": 'import { create } from "./canonicalTrainingFamilyComposition"; export { create };',
    "src/application/canonicalTrainingFamilyComposition.ts": 'import { CodingRuntime } from "./coding-interview/codingInterviewTrainingRuntime"; export const create = () => new CodingRuntime();',
  }).violations;
  assert.deepEqual(green, [], formatViolations(green));
});
test("RED -> GREEN: shared lifecycle cannot take a closed concrete interaction payload", () => {
  const files = {
    "src/application/trainingLifecycle/contracts.ts": 'import type { Question } from "../../content/canonical"; export type Catalog = Question;',
    "src/content/canonical/index.ts": 'export type { Question } from "./questionTypes";',
    "src/content/canonical/questionTypes.ts": 'export type Question = { type: "choice" } | { type: "ordering" };',
  };
  assert.ok(fixture(files).violations.some(v => v.rule.includes("lifecycle consumes")));
  assert.deepEqual(fixture({ ...files, "src/application/trainingLifecycle/contracts.ts": 'export interface Catalog { questionId: string; payload: unknown }' }).violations, []);
});
for (const platform of ["ios", "android"] as const) test(`RED: configured alias uses actual Expo ${platform} variant selection`, () => {
  const files = { "src/features/screen.ts": 'import { value } from "@variant"; export { value };', "src/neutral/variant.ts": 'export const value = 1;', "src/neutral/variant.native.ts": 'export { save as value } from "../storage/repositories/secret";', [repo]: store };
  const { violations } = fixture(files, platform, { paths: { "@variant": ["./src/neutral/variant"] } });
  assert.ok(violations.some(v => v.path.includes(repo)), formatViolations(violations));
});


test("RED -> GREEN: family cannot hide persistence behind an application helper", () => {
  const files = {
    "src/application/coding-interview/codingInterviewTrainingRuntime.ts": 'import { submit } from "../helper"; export const run = () => submit();',
    "src/application/helper.ts": 'import { save } from "../storage/repositories/secret"; export const submit = () => save();', [repo]: store,
  };
  assert.ok(fixture(files).violations.some(v => v.rule.includes("family isolation") && v.path.includes(repo)));
  assert.deepEqual(fixture({ ...files, "src/application/helper.ts": 'export const submit = () => ({ command: "save" });' }).violations, []);
});
test("RED -> GREEN: registry metadata stays legal but concrete item catalog does not", () => {
  const files = { "src/domain/tracks/trackRegistry.ts": 'export { questions } from "../../content/canonical/runtimeCatalog";', "src/content/canonical/runtimeCatalog.ts": 'export const questions = [1];' };
  assert.ok(fixture(files).violations.some(v => v.rule.includes("registry and repository")));
  assert.deepEqual(fixture({ ...files, "src/domain/tracks/trackRegistry.ts": 'export const tracks = ["google-cloud-associate-cloud-engineer"];' }).violations, []);
});
test("GREEN profile lifecycle port; RED raw KV capability through the same repository barrel", () => {
  const files = {
    "src/application/learningMutations/command.ts": 'import { getActiveStorageProfile } from "../../storage/repositories/profileStorageRepository"; export const run = () => getActiveStorageProfile();',
    "src/storage/repositories/profileStorageRepository.ts": 'export { getActiveStorageProfile, getKeyValueStorage } from "../../infrastructure/storage/mmkvClient";',
    "src/infrastructure/storage/mmkvClient.ts": 'export const getActiveStorageProfile = () => ({ id: "A" }); export const getKeyValueStorage = () => ({ set: () => {} });',
  };
  assert.deepEqual(fixture(files).violations, []);
  const red = fixture({ ...files, "src/application/learningMutations/command.ts": 'import { getKeyValueStorage } from "../../storage/repositories/profileStorageRepository"; getKeyValueStorage().set();' }).violations;
  assert.ok(red.some(v => v.path.includes("src/infrastructure/storage/mmkvClient.ts")), formatViolations(red));
});
for (const [owner, facade, repository, symbols] of [
  ["src/features/home/tabs/SettingsTab.tsx", "src/application/premiumTesting.ts", "src/storage/repositories/premiumTestingRepository.ts", ["hasPremiumTestingAccess", "setPremiumTestingAccess"]],
  ["src/features/home/BackendDiagnosticsScreen.tsx", "src/application/account/accountDataService.ts", "src/storage/repositories/accountDataRepository.ts", ["accountDataRecordFingerprint"]],
] as const) test(`current residual RED -> repaired owner GREEN: ${facade}`, () => {
  const from = facade === "src/application/premiumTesting.ts" ? "../../../application/premiumTesting" : "../../application/account/accountDataService";
  const to = facade === "src/application/premiumTesting.ts" ? "../storage/repositories/premiumTestingRepository" : "../../storage/repositories/accountDataRepository";
  const declarations = symbols.map(symbol => `export const ${symbol} = () => 1;`).join("\n");
  const files = { [owner]: `import { ${symbols.join(", ")} } from "${from}";`, [facade]: `export { ${symbols.join(", ")} } from "${to}";`, [repository]: declarations };
  const red = fixture(files).violations;
  for (const symbol of symbols) assert.ok(red.some(v => v.path.includes(repository) && v.detail.includes(symbol)), formatViolations(red));
  assert.deepEqual(fixture({ ...files, [facade]: declarations }).violations, []);
});
test("Premium original direct journal edge RED -> application composition GREEN", () => {
  const owner = "src/features/premium/PremiumPurchaseScreen.tsx";
  const repository = "src/storage/repositories/premiumPurchaseAttemptRepository.ts";
  const files = { [owner]: 'import { capturePremiumPurchaseJournal } from "../../storage/repositories/premiumPurchaseAttemptRepository"; capturePremiumPurchaseJournal();', [repository]: 'export const capturePremiumPurchaseJournal = () => 1;' };
  assert.ok(fixture(files).violations.some(v => v.path.includes(repository)));
  assert.deepEqual(fixture({ ...files,
    [owner]: 'import { compose } from "../../application/account/premiumPurchaseComposition"; compose();',
    "src/application/account/premiumPurchaseComposition.ts": 'import { capturePremiumPurchaseJournal } from "../../storage/repositories/premiumPurchaseAttemptRepository"; export const compose = () => capturePremiumPurchaseJournal();',
  }).violations, []);
});


test("RED -> GREEN: transitive type contract using a value import in heritage", () => {
  const files = {
    "src/domain/learning/kernel.ts": 'import type { Input } from "../../neutral/contract"; export type Request = Input;',
    "src/neutral/contract.ts": 'import { RepoModel } from "../storage/repositories/model"; export interface Input extends RepoModel {}',
    "src/storage/repositories/model.ts": 'export class RepoModel { value = 1; }',
  };
  const red = fixture(files).violations;
  assert.ok(red.some(v => v.rule.includes("kernel isolation") && v.path.includes("src/storage/repositories/model.ts")), formatViolations(red));
  assert.deepEqual(fixture({ ...files, "src/neutral/contract.ts": 'export interface Input { value: number }' }).violations, []);
});


test("GREEN: a type-used binding does not pull its runtime-only barrel sibling", () => {
  const files = {
    "src/domain/learning/kernel.ts": 'import type { Input } from "../../neutral/contract"; export type Request = Input;',
    "src/neutral/contract.ts": 'import { Shape, save } from "./barrel"; export interface Input extends Shape {} export const write = () => save();',
    "src/neutral/barrel.ts": 'export { Shape } from "./shape"; export { save } from "../storage/repositories/secret";',
    "src/neutral/shape.ts": 'export class Shape { value = 1; }', [repo]: store,
  };
  assert.deepEqual(fixture(files).violations, []);
  const runtime = fixture({ ...files, "src/domain/learning/kernel.ts": 'import { write } from "../../neutral/contract"; write();' }).violations;
  assert.ok(runtime.some(v => v.path.includes(repo)), formatViolations(runtime));
});


test("RED -> GREEN: combined default and namespace preserves a transitive type member", () => {
  const files = {
    "src/domain/learning/kernel.ts": 'import type { Input } from "../../neutral/contract"; export type Request = Input;',
    "src/neutral/contract.ts": 'import Default, * as API from "./barrel"; export interface Input extends API.Shape {} export const label = Default;',
    "src/neutral/barrel.ts": 'export default "safe"; export { RepoModel as Shape } from "../storage/repositories/model";',
    "src/storage/repositories/model.ts": 'export class RepoModel { value = 1; }',
  };
  const red = fixture(files).violations;
  assert.ok(red.some(v => v.path.includes("src/storage/repositories/model.ts")), formatViolations(red));
  assert.deepEqual(fixture({ ...files, "src/neutral/barrel.ts": 'export default "safe"; export class Shape { value = 1; }' }).violations, []);
});
test("RED -> GREEN: identity value alias is not an application command wrapper", () => {
  const files = {
    "src/features/screen.ts": 'import { save } from "../application/facade"; save();',
    "src/application/facade.ts": 'import { save as writer } from "../storage/repositories/secret"; export const save = (writer);', [repo]: store,
  };
  const red = fixture(files).violations;
  assert.ok(red.some(v => v.path.includes(repo)), formatViolations(red));
  assert.deepEqual(fixture({ ...files, "src/application/facade.ts": 'import { save as writer } from "../storage/repositories/secret"; export const save = () => writer();' }).violations, []);
});
