import { StatusBar } from "expo-status-bar";

import { AlgorithmsVisualHarness } from "./AlgorithmsVisualHarness";

/** Separate Expo project entrypoint. It is never imported by production App.tsx. */
export default function AlgorithmsAuditApp() {
  return <><StatusBar style="light" /><AlgorithmsVisualHarness /></>;
}
