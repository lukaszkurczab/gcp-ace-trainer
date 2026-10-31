import { resolveStartupPreviewEntry, type StartupPreviewEntry } from "./src/testing/startupPreparationPreview";
import { resolvePerf06Entry, type Perf06Entry } from "./src/testing/perf06Entry";
import { markStartup } from "./src/infrastructure/diagnostics/startupTrace";
import { resolvePersist13Entry, type Persist13Entry } from "./src/application/runtimeAuditability/persist13Entry";
import { resolveACMNativeFixtureEntry, type ACMNativeFixtureNativeIdentity } from "./src/application/runtimeAuditability/acmNativeFixtureProtocol";
import type { ReactElement } from "react";

declare const require: (path: string) => unknown;

/** Select the isolated fixture before loading any regular application providers. */
export default function App() {
  const nativeIdentity = (require("react-native") as { NativeModules?: Record<string, unknown> }).NativeModules?.PatternlyACMNativeFixtureIdentity as ACMNativeFixtureNativeIdentity | undefined;
  const acmEntry = resolveACMNativeFixtureEntry({
    jsEnabled: process.env.EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE,
    jsRuntimeMode: process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE,
    jsRunUUID: process.env.EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_RUN_UUID,
    jsOperation: process.env.EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_OPERATION,
    development: typeof __DEV__ !== "undefined" && __DEV__,
    native: nativeIdentity ?? null,
    environment: {
      EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE,
      EXPO_PUBLIC_PATTERNLY_PERF06_FIXTURE: process.env.EXPO_PUBLIC_PATTERNLY_PERF06_FIXTURE,
      EXPO_PUBLIC_PATTERNLY_STARTUP_PREVIEW: process.env.EXPO_PUBLIC_PATTERNLY_STARTUP_PREVIEW,
    },
  });
  if (acmEntry.kind === "unavailable") {
    return <UnavailableFixtureRoot reason={acmEntry.reason} />;
  }
  if (acmEntry.kind === "fixture") {
    const ACMNativeFixtureRoot = (require("./src/application/runtimeAuditability/ACMNativeFixtureRoot") as { default: (props: { entry: typeof acmEntry }) => ReactElement }).default;
    return <ACMNativeFixtureRoot entry={acmEntry} />;
  }
  const entry = resolvePersist13Entry({
    mode: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE,
    runId: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID,
    scenario: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO,
    observation: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_UI_OBSERVATION,
    startStage: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_START_STAGE,
  });
  const listEntry = resolvePerf06Entry(process.env.EXPO_PUBLIC_PATTERNLY_PERF06_FIXTURE, typeof __DEV__ !== "undefined" && __DEV__, process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE, entry.kind);
  const previewEntry = resolveStartupPreviewEntry(process.env.EXPO_PUBLIC_PATTERNLY_STARTUP_PREVIEW, typeof __DEV__ !== "undefined" && __DEV__, process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE, entry.kind, listEntry.kind);
  if (previewEntry.kind !== "regular") {
    const StartupPreparationPreviewRoot = (require("./src/testing/StartupPreparationPreviewRoot") as { default: (props: Readonly<{ entry: StartupPreviewEntry }>) => ReactElement }).default;
    return <StartupPreparationPreviewRoot entry={previewEntry} />;
  }
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

function UnavailableFixtureRoot({ reason }: Readonly<{ reason: string }>) {
  const { View, Text } = require("react-native") as typeof import("react-native");
  return <View accessibilityRole="summary" style={{ flex: 1, justifyContent: "center", padding: 24 }}>
    <Text accessibilityLabel="ACM native fixture unavailable">ACM native fixture unavailable: {reason}</Text>
  </View>;
}
