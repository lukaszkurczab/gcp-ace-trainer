import { resolvePersist13Entry, type Persist13Entry } from "./src/application/runtimeAuditability/persist13Entry";
import type { ReactElement } from "react";

declare const require: (path: string) => unknown;

/** Select the isolated fixture before loading any regular application providers. */
export default function App() {
  const entry = resolvePersist13Entry({
    mode: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE,
    runId: process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID,
  });
  if (entry.kind === "regular") {
    const RegularApplicationRoot = (require("./src/RegularApplicationRoot") as { default: () => ReactElement }).default;
    return <RegularApplicationRoot />;
  }
  const Persist13ResetFixtureRoot = (require("./src/application/runtimeAuditability/Persist13ResetFixtureRoot") as { default: (props: Readonly<{ entry: Persist13Entry }>) => ReactElement }).default;
  return <Persist13ResetFixtureRoot entry={entry} />;
}
