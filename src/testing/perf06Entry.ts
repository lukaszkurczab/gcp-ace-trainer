export type Perf06Entry = Readonly<{ kind: "regular" } | { kind: "fixture" } | { kind: "invalid" }>;

export function resolvePerf06Entry(mode: string | undefined, development: boolean, runtime: string | undefined, persistenceEntryKind: Persist13Entry["kind"]): Perf06Entry {
  if (mode === undefined) return { kind: "regular" };
  if (mode !== "lists" || !development || runtime !== "smoke" || persistenceEntryKind !== "regular") return { kind: "invalid" };
  return { kind: "fixture" };
}
import type { Persist13Entry } from "../application/runtimeAuditability/persist13Entry";
