import { resolvePerf06Entry, type Perf06Entry } from "./src/testing/perf06Entry";
import { markStartup } from "./src/infrastructure/diagnostics/startupTrace";
import { resolvePersist13Entry, type Persist13Entry } from "./src/application/runtimeAuditability/persist13Entry";
import type { ReactElement } from "react";

declare const require: (path: string) => unknown;

/** Select the isolated fixture before loading any regular application providers. */
export default function App() {
  const entry = resolvePersist13Entry({
    mode: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE,
    runId: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID,
    scenario: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO,
  });
  const listEntry = resolvePerf06Entry(process.env.EXPO_PUBLIC_PATTERNLY_PERF06_FIXTURE, typeof __DEV__ !== "undefined" && __DEV__, process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE, entry.kind);
  if (listEntry.kind !== "regular") {
    const Perf06ListFixtureRoot = (require("./src/testing/Perf06ListFixtureRoot") as { default: (props: Readonly<{ entry: Perf06Entry }>) => ReactElement }).default;
    return <Perf06ListFixtureRoot entry={listEntry} />;
  }
  if (entry.kind === "regular") {
    const EnvironmentGate = (require("./src/infrastructure/runtime/EnvironmentGate") as { default: (props: Readonly<{ loadApplication: () => ReactElement }>) => ReactElement }).default;
    return <EnvironmentGate loadApplication={() => {
      markStartup("regular_root_module", "begin");
      const RegularApplicationRoot = (require("./src/RegularApplicationRoot") as { default: () => ReactElement }).default;
      markStartup("regular_root_module", "end");
      return <RegularApplicationRoot />;
    }} />;
  }
  const Persist13ResetFixtureRoot = (require("./src/application/runtimeAuditability/Persist13ResetFixtureRoot") as { default: (props: Readonly<{ entry: Persist13Entry }>) => ReactElement }).default;
  return <Persist13ResetFixtureRoot entry={entry} />;
}
