import { useEffect, useState, type ReactElement } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, Text, View } from "react-native";
import { createEnvironmentGuard, createNativeEnvironmentMarkerStore, EnvironmentGuardError, type EnvironmentGuardState } from "./environmentGuard";
import { readEnvironmentIdentity, type EnvironmentIdentity } from "./environmentIdentity";

type Guard = ReturnType<typeof createEnvironmentGuard>;
type State = Readonly<{ kind: "loading" | EnvironmentGuardState | "error"; code?: string; identity?: EnvironmentIdentity }>;
let runtime: Readonly<{ guard: Guard; identity: EnvironmentIdentity }> | null = null;

function environmentRuntime() {
  if (runtime) return runtime;
  const identity = readEnvironmentIdentity();
  const constants = (require("expo-constants") as typeof import("expo-constants")).default;
  if (constants.expoConfig?.extra?.patternlyEnvironmentFingerprint !== identity.fingerprint) throw new EnvironmentGuardError("environment_configuration_mismatch");
  runtime = Object.freeze({ identity, guard: createEnvironmentGuard(createNativeEnvironmentMarkerStore(), identity.fingerprint) });
  return runtime;
}

/** The application loader is invoked only after the whole-installation fence passes.
 * This surface cannot import preferences, translations or application providers:
 * those modules may themselves open durable state. */
export default function EnvironmentGate({ loadApplication }: Readonly<{ loadApplication: () => ReactElement }>) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ kind: "loading" });
    void Promise.resolve().then(async () => {
      const { guard, identity } = environmentRuntime();
      const kind = await guard.inspect();
      if (active) setState({ kind, identity });
    }).catch((error: unknown) => {
      if (active) setState({ kind: "error", code: error instanceof EnvironmentGuardError ? error.code : "environment_identity_configuration_invalid" });
    });
    return () => { active = false; };
  }, [revision]);

  const assign = () => {
    const { guard, identity } = environmentRuntime();
    Alert.alert("Assign local data?", `Confirm that all existing local data belongs to ${identity.mode}, API ${identity.apiOrigin}, Firebase ${identity.firebaseProjectId}. This confirmation does not verify its origin. If you are unsure, cancel and return to the previous build.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Assign to this environment", onPress: () => {
        setState({ kind: "loading" });
        // Re-inspect on completion; an uncertain write never opens the application directly.
        void guard.assign().then(() => setRevision((value) => value + 1)).catch((error: unknown) => {
          setState({ kind: "error", code: error instanceof EnvironmentGuardError ? error.code : "environment_marker_write_unconfirmed" });
        });
      } },
    ]);
  };

  if (state.kind === "ready") return loadApplication();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0C1324", justifyContent: "center", padding: 24 }}>
      <View accessibilityLiveRegion="polite" testID={`environment-${state.kind}`} style={{ gap: 16 }}>
        <Text accessibilityRole="header" style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "600" }}>
          {state.kind === "loading" ? "Checking local environment…" : state.kind === "unassigned" ? "Local data needs an environment" : "Local data is protected"}
        </Text>
        {state.kind === "loading" ? <ActivityIndicator color="#FFFFFF" /> : <>
          <Text style={{ color: "#FFFFFF", fontSize: 17 }}>
            {state.kind === "unassigned"
              ? "An owner must assign this installation before its data can be opened. Existing data will be kept."
              : state.kind === "mismatch"
                ? "This build uses a different environment from the saved data. Return to the matching build to open it. Your data has been kept."
                : "The local environment could not be verified. Retry after resolving the configuration or storage problem. Your data remains closed."}
          </Text>
          {state.identity && <Text selectable style={{ color: "#FFFFFF", fontSize: 16 }}>{`${state.identity.mode}\n${state.identity.apiOrigin}\nFirebase: ${state.identity.firebaseProjectId}\n${state.identity.fingerprint}`}</Text>}
          {state.code && <Text selectable style={{ color: "#FFFFFF", fontSize: 16 }}>{state.code}</Text>}
          <Pressable accessibilityRole="button" onPress={state.kind === "unassigned" ? assign : () => setRevision((value) => value + 1)} style={{ paddingVertical: 16 }}>
            <Text style={{ color: "#7DD3FC", fontSize: 17 }}>{state.kind === "unassigned" ? "Assign existing data…" : "Retry"}</Text>
          </Pressable>
        </>}
      </View>
    </SafeAreaView>
  );
}
