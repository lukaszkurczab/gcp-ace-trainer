import { existsSync } from "node:fs";
import { join } from "node:path";
import { createDependencyGraph, type Edge, type Graph, type Platform } from "./dependencyGraph";

export type Violation = Readonly<{ rule: string; path: readonly string[]; detail: string }>;
type Rule = Readonly<{
  id: string; forbidden: (file: string, edge: Edge, symbol?: string) => boolean;
  stop?: (file: string) => boolean;
  fullRuntime?: boolean;
  dataPort?: boolean;
}>;
const under = (file: string, directory: string) => file.startsWith(`${directory}/`);
const persistence = (file: string) => under(file, "src/storage/repositories") || under(file, "src/infrastructure/storage") || file === "npm:react-native-mmkv" || file === "src/storage/keys.ts";
const family = (file: string) => /^src\/(?:tracks|application)\/(coding-interview|certification|design-interview)\//u.exec(file)?.[1];
const scoring = (file: string, kind: Edge["kind"]) => file === "src/content/canonical/questionScoring.ts"
  || file === "src/domain/learning/reviewCycleTransition.ts"
  || (kind === "runtime" && under(file, "src/content/canonical/interactions") && !file.endsWith("/shared.ts") && !file.endsWith("/utils.ts") && !file.endsWith("/validation.ts"));
const kernelForbidden = (file: string) => ["src/content", "src/tracks", "src/features", "src/components", "src/application", "src/infrastructure", "src/storage"].some((directory) => under(file, directory))
  || ["src/domain/tracks/trackRegistry.ts", "src/domain/tracks/trackAdmission.ts", "src/domain/tracks/trackGoalPolicies.ts"].includes(file)
  || /^npm:(?:react(?:-native)?|react-native-mmkv)(?:\/|$)/u.test(file);

// These are actual composition owners, not exemptions for arbitrary feature code.
// Q13 assembles a storage receipt (including the UI-owned in-memory privacy draft).
// The Certification preview constructs smoke-only evidence; its gating has independent tests.
const compositionRoots = new Set([
  "src/application/canonicalTrainingFamilyComposition.ts",
  "src/application/runtimeAuditability/Q13StorageReceiptHost.tsx",
  "src/application/runtimeAuditability/q13StorageReceiptOwner.ts",
  "src/features/exam/certificationExamReviewFixtureNavigator.tsx",
  "src/features/exam/CertificationPracticeFeedbackPreview.tsx",
  "src/features/exam/certificationExamReviewFixtureRuntime.smoke.ts",
]);
/** The rule IDs cite existing contracts; metadata and declared application commands are legal crossings. */
export function rulesFor(source: string): Rule[] {
  const result: Rule[] = [];
  if (under(source, "src/domain/learning")) result.push({ id: "ARCH-01/F-01 kernel isolation", fullRuntime: true, forbidden: kernelForbidden });
  if (source === "src/storage/repositories/trainingModelGuards.ts") result.push({
    id: "ARCH-01/F-01 envelope guards without item semantics", fullRuntime: true, forbidden: (file) => under(file, "src/content") || under(file, "src/tracks") || under(file, "src/application") || under(file, "src/features") || file === "src/domain/tracks/trackAdmission.ts" || file === "src/domain/tracks/trackRegistry.ts",
  });
  if ((under(source, "src/application") || under(source, "src/content/application")) && !compositionRoots.has(source)) result.push({
    id: "ARCH-01/F-08 application owns command contracts", forbidden: (file) => under(file, "src/features"), stop: (file) => compositionRoots.has(file) || (!under(file, "src/application") && !under(file, "src/content/application")),
  });
  const ownFamily = family(source);
  if (ownFamily && (under(source, "src/tracks") || source.endsWith("TrainingRuntime.ts"))) result.push({
    id: "ARCH-02/F-02 family isolation", forbidden: (file) => persistence(file) || (family(file) !== undefined && family(file) !== ownFamily),
    // Family semantics stay pure even when a helper has an application path.
  });
  if (under(source, "src/features") && !compositionRoots.has(source)) result.push({
    id: "ARCH-04/05/F-06 UI delegates persistence, scoring and review mutation", dataPort: true, forbidden: (file, edge) => persistence(file) || under(file, "src/application/learningMutations") || scoring(file, edge.kind),
    stop: (file) => compositionRoots.has(file) || under(file, "src/application") || under(file, "src/content/application") || under(file, "src/preferences") || file === "src/infrastructure/diagnostics/startupTrace.ts"
      || file === "src/content/canonical/productModeConfig.ts" || file === "src/content/canonical/questionTypes.ts"
      || file === "src/content/canonical/planningPolicy.ts" || under(file, "src/domain/tracks"),
  });
  if (under(source, "src/application/trainingLifecycle")) result.push({
    id: "ARCH-02/04 lifecycle consumes ports", forbidden: (file, edge, symbol) => persistence(file) || under(file, "src/application/learningMutations")
      || scoring(file, edge.kind)
      || (file === "src/content/canonical/questionTypes.ts" && ["Question", "CanonicalQuestionResponse"].some((name) => edge.names.includes(name) || name === symbol))
      || (edge.kind === "type" && under(file, "src/content/canonical/interactions") && !file.endsWith("/shared.ts")),
    stop: (file) => file === "src/content/canonical/questionTypes.ts" || under(file, "src/domain") || under(file, "src/application/runtime") || under(file, "src/infrastructure/identity"),
  });
  if (under(source, "src/application/trainingLifecycle") || source === "src/application/contentPackageRuntimeOwner.ts" || source === "src/application/trainingFamilyRuntimeResolver.ts") result.push({
    id: "ARCH-02/F-02 shared orchestration uses registered family factories",
    forbidden: (file) => family(file) !== undefined && file.endsWith("TrainingRuntime.ts"),
    stop: (file) => compositionRoots.has(file),
  });
  if (under(source, "src/application/learningMutations")) result.push({
    id: "ARCH-08 journal uses repository ports, not raw storage", dataPort: true, forbidden: (file) => under(file, "src/infrastructure/storage") || file === "src/storage/keys.ts" || file === "npm:react-native-mmkv",
    stop: (file) => under(file, "src/storage/repositories"),
  });
  if (under(source, "src/content/canonical")) result.push({
    id: "ARCH-08 domain content cannot orchestrate application", forbidden: (file) => (under(file, "src/application") && file !== "src/application/operationalDiagnostics.ts") || under(file, "src/content/application"),
    stop: (file) => under(file, "src/domain"),
  });
  if (under(source, "src/domain/tracks") || under(source, "src/storage/repositories")) result.push({
    id: "ARCH-01/08 registry and repository exclude concrete item semantics",
    forbidden: (file, edge, symbol) => file === "src/content/canonical/runtimeCatalog.ts" || file === "src/content/canonical/questionCatalog.ts"
      || scoring(file, edge.kind) || under(file, "src/content/generated/canonical-content") || under(file, "src/content/generated/retained-content")
      || (file === "src/content/canonical/questionTypes.ts" && ["Question", "CanonicalQuestionResponse", "CanonicalArtifact"].some(name => edge.names.includes(name) || name === symbol)),
    stop: (file) => under(file, "src/infrastructure") || under(file, "src/application"),
  });
  if (source === "src/storage/index.ts") result.push({
    id: "ARCH-08 public storage excludes raw keys", forbidden: (file) => file === "src/storage/keys.ts" || file === "src/storage/storageCodec.ts",
    stop: () => true,
  });
  return result;
}

export function checkBoundaries(graph: Graph, entries = ["App.tsx"]): Violation[] {
  const active = entries.some((entry) => existsSync(join(graph.root, entry))) ? graph.reachable(entries, true) : new Set(graph.edges.keys());
  const violations: Violation[] = [];
  const keys = new Set<string>();
  const report = (rule: Rule, path: string[], edge: Edge, symbol?: string) => {
    const key = `${rule.id}:${path.join("->")}:${symbol ?? ""}`;
    if (keys.has(key)) return;
    keys.add(key);
    violations.push({ rule: rule.id, path,
      detail: `${graph.label(edge.from)}:${edge.line} ${edge.kind} ${edge.form} ${edge.specifier}${symbol ? ` [${symbol}]` : ""}` });
  };
  for (const file of graph.edges.keys()) {
    const source = graph.label(file);
    // Pure owners also have standalone contracts; test-only presentation harnesses are not runtime entrypoints.
    if (!active.has(file) && under(source, "src/features")) continue;
    for (const rule of rulesFor(source)) {
      const seen = new Set<string>();
      const walk = (current: string, path: string[], kind: Edge["kind"] = "runtime"): void => {
        const key = `${current}:${kind}`;
        if (seen.has(key)) return;
        seen.add(key);
        for (const declaredEdge of graph.edges.get(current) ?? []) {
          let edge = declaredEdge;
          if (kind === "type" && edge.kind === "runtime") {
            const typeNames = graph.typeNames(edge);
            if (!typeNames.length) continue;
            const names = typeNames.includes("*") ? [] : edge.names.length && !edge.names.includes("*") ? edge.names.filter(name => typeNames.includes(name)) : [...typeNames];
            if (!names.length && !typeNames.includes("*")) continue;
            edge = { ...edge, kind: "type", names };
          }
          const target = graph.label(edge.to);
          const next = [...path, target];
          if (rule.forbidden(target, edge)) { report(rule, next, edge); continue; }
          // A type explicitly exposed by an allowed application/repository port is a data contract.
          // Direct type imports into forbidden owners and aliases through neutral barrels still fail above.
          if (rule.dataPort && edge.kind === "type" && rule.stop?.(target)) continue;
          // Follow the selected declarations, not every sibling export of a barrel.
          // A local application function is a delegation boundary; a re-export retains its owner.
          const origins = graph.origins(edge);
          for (const origin of origins) {
            const declaration = graph.label(origin.file);
            // The profile repository explicitly owns this lifecycle read port; no raw KV API is exposed.
            if (rule.id.startsWith("ARCH-08 journal") && target === "src/storage/repositories/profileStorageRepository.ts"
              && declaration === "src/infrastructure/storage/mmkvClient.ts" && origin.symbol === "getActiveStorageProfile") continue;
            const originEdge = { ...edge, kind: origin.kind };
            const originPath = declaration === target ? next : [...next, declaration];
            if (rule.forbidden(declaration, originEdge, origin.symbol)) report(rule, originPath, originEdge, origin.symbol);
            else if (!rule.stop?.(declaration)) walk(origin.file, originPath, origin.kind);
          }
          if ((!origins.length || (rule.fullRuntime && edge.kind === "runtime")) && !rule.stop?.(target)) walk(edge.to, next, edge.kind);
        }
      };
      walk(file, [source]);
    }
  }
  for (const message of graph.unresolved) if (active.has(message.file) || (!under(graph.label(message.file), "src/features") && rulesFor(graph.label(message.file)).length)) violations.push({ rule: "ARCH-08 resolvable static dependency", path: [graph.label(message.file)], detail: message.detail });
  return violations;
}
export function formatViolations(violations: readonly Violation[]): string {
  return violations.map((violation) => `${violation.rule}: ${violation.path.join(" -> ")} (${violation.detail})`).join("\n");
}
export function checkRepository(root: string, platform: Platform, mode: "release" | "smoke" = "release") {
  const graph = createDependencyGraph({ root, platform, mode });
  return { graph, violations: checkBoundaries(graph) };
}

/** Test-only helpers are rejected only when an actual runtime entry can load their importer. */
export function runtimeTestSupportViolations(graph: Graph, entries = ["App.tsx"]): string[] {
  const active = graph.reachable(entries);
  return [...graph.edges.values()].flat().filter((edge) => active.has(edge.from)
    && graph.label(edge.to) === "src/testing/journalTestSupport.ts")
    .map((edge) => `runtime source imports test-only support: ${graph.label(edge.from)}:${edge.line} -> ${graph.label(edge.to)} (${edge.kind})`);
}
