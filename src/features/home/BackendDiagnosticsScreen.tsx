import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, InfoBlock, Screen } from "../../components";
import { PatternlyApiClientError } from "../../infrastructure/clients/PatternlyApiClientAdapter";
import { readPatternlyBackendRuntime } from "../../infrastructure/clients/patternlyBackendRuntime";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { spacing, typography, type AppColors } from "../../theme";

type CheckResult = Readonly<{ code?: string; id: string; label: string; status: "failed" | "passed" }>;
type RunState = Readonly<{ results: readonly CheckResult[]; status: "failed" | "idle" | "passed" | "running" }>;

const requiredPaths = [
  "/health",
  "/ready",
  "/openapi.json",
  "/v1/me",
  "/v1/entitlements",
  "/v1/progress",
  "/v1/progress/sync",
  "/v1/tracks",
  "/v1/content/versions",
] as const;

export function BackendDiagnosticsScreen() {
  const styles = useThemedStyles(createStyles);
  const { locale } = useAppPreferences();
  const text = locale === "pl" ? polishCopy : englishCopy;
  const runtime = useMemo(readPatternlyBackendRuntime, []);
  const [runState, setRunState] = useState<RunState>({ results: [], status: "idle" });

  const runChecks = useCallback(async () => {
    setRunState({ results: [], status: "running" });
    if (runtime.kind !== "configured") {
      setRunState({ results: [{ code: runtime.kind === "invalid" ? runtime.reason : "backend_e2e_disabled", id: "configuration", label: text.configuration, status: "failed" }], status: "failed" });
      return;
    }

    const results: CheckResult[] = [];
    const run = async (id: string, label: string, operation: () => Promise<void>): Promise<void> => {
      try {
        await operation();
        results.push({ id, label, status: "passed" });
      } catch (error) {
        results.push({ code: errorCode(error), id, label, status: "failed" });
      }
    };
    const client = runtime.client;

    await run("health", text.health, async () => {
      const response = await client.getHealth();
      if (response.status !== "ok") throw new PatternlyApiClientError("invalid_response");
    });
    await run("ready", text.ready, async () => {
      const response = await client.getReady();
      if (response.status !== "ready" || !response.checks.database || !response.checks.authentication) throw new PatternlyApiClientError("invalid_response");
    });
    await run("openapi", text.openapi, async () => {
      const response = await client.getOpenApi();
      if (requiredPaths.some((path) => !(path in response.paths))) throw new PatternlyApiClientError("invalid_response");
    });
    await run("me", text.me, async () => {
      const response = await client.getMe();
      if (!response.user.id) throw new PatternlyApiClientError("invalid_response");
    });
    await run("entitlements", text.entitlements, async () => { await client.getEntitlements(); });
    await run("progress-read", text.progressRead, async () => { await client.getProgress(); });
    await run("tracks", text.tracks, async () => { await client.getTracks(); });
    await run("content-versions", text.contentVersions, async () => { await client.getContentVersions(); });

    const targetId = `ios-simulator-backend-${Date.now()}`;
    const mutationId = `ios-simulator-${Date.now()}-apply`;
    const mutation = {
      mutationId,
      kind: "item" as const,
      trackId: "coding-interview-dsa-problem-solving",
      targetId,
      expectedVersion: null,
      state: { source: "ios_simulator", check: "backend_paths" },
    };
    await run("sync-apply", text.syncApply, async () => {
      const response = await client.syncProgress({ mutations: [mutation] });
      if (response.applied.length !== 1 || response.duplicates.length !== 0 || response.conflicts.length !== 0) throw new PatternlyApiClientError("invalid_response");
    });
    await run("sync-duplicate", text.syncDuplicate, async () => {
      const response = await client.syncProgress({ mutations: [mutation] });
      if (response.applied.length !== 0 || response.duplicates.length !== 1 || response.duplicates[0] !== mutationId) throw new PatternlyApiClientError("invalid_response");
    });
    await run("sync-conflict", text.syncConflict, async () => {
      const conflictMutation = { ...mutation, expectedVersion: 0, mutationId: `${mutationId}-conflict` };
      try {
        await client.syncProgress({ mutations: [conflictMutation] });
      } catch (error) {
        if (error instanceof PatternlyApiClientError && error.status === 409 && error.serverCode === "version_conflict") return;
        throw error;
      }
      throw new PatternlyApiClientError("invalid_response");
    });
    await run("progress-after-sync", text.progressAfterSync, async () => {
      const response = await client.getProgress();
      if (!response.records.some((record) => record.targetId === targetId && record.version === 1)) throw new PatternlyApiClientError("invalid_response");
    });

    setRunState({ results: Object.freeze(results), status: results.every((result) => result.status === "passed") ? "passed" : "failed" });
  }, [runtime, text]);

  useEffect(() => { void runChecks(); }, [runChecks]);

  const title = runState.status === "passed" ? text.passed : runState.status === "failed" ? text.failed : runState.status === "running" ? text.running : text.title;
  const tone = runState.status === "passed" ? "success" : runState.status === "failed" ? "warning" : "neutral";
  return (
    <Screen>
      <View style={styles.container} testID="backend-e2e-screen">
        <InfoBlock body={text.body} icon={<Text style={styles.icon}>↔</Text>} testID="backend-e2e-status" title={title} tone={tone} />
        <View style={styles.results}>
          {runState.results.map((result) => (
            <Text key={result.id} style={result.status === "passed" ? styles.passed : styles.failed} testID={`backend-e2e-check-${result.id}`}>
              {result.status === "passed" ? "✓" : "!"} {result.label}{result.code ? ` [${result.code}]` : ""}
            </Text>
          ))}
        </View>
        {runState.status === "passed" ? <Text style={styles.summary} testID="backend-e2e-summary">{text.summary}</Text> : null}
        <Button loading={runState.status === "running"} onPress={() => { void runChecks(); }} testID="backend-e2e-rerun" variant="secondary">{text.rerun}</Button>
      </View>
    </Screen>
  );
}

const errorCode = (error: unknown): string => error instanceof PatternlyApiClientError ? error.code : "unexpected_error";

const englishCopy = {
  body: "This development-only flow checks health, readiness, OpenAPI, identity, read routes, idempotent sync, and version conflicts against the local backend.",
  configuration: "Simulator configuration",
  contentVersions: "Content versions",
  entitlements: "Entitlements",
  failed: "Backend checks failed",
  health: "Health",
  me: "Identity mapping",
  openapi: "OpenAPI route inventory",
  passed: "All backend paths passed",
  progressAfterSync: "Progress after sync",
  progressRead: "Progress read",
  ready: "Readiness",
  rerun: "Run backend checks again",
  running: "Running backend checks",
  summary: "All backend paths passed",
  syncApply: "Sync applies mutation",
  syncConflict: "Sync rejects stale version",
  syncDuplicate: "Sync deduplicates retry",
  title: "Backend simulator checks",
  tracks: "Track access",
} as const;

const polishCopy = {
  body: "Ten przepływ deweloperski sprawdza health, readiness, OpenAPI, tożsamość, odczyty, idempotentną synchronizację i konflikt wersji z lokalnym backendem.",
  configuration: "Konfiguracja symulatora",
  contentVersions: "Wersje contentu",
  entitlements: "Uprawnienia",
  failed: "Testy backendu nie przeszły",
  health: "Health",
  me: "Mapowanie tożsamości",
  openapi: "Inwentarz tras OpenAPI",
  passed: "Wszystkie ścieżki backendu przeszły",
  progressAfterSync: "Postęp po synchronizacji",
  progressRead: "Odczyt postępu",
  ready: "Readiness",
  rerun: "Uruchom testy backendu ponownie",
  running: "Trwa testowanie backendu",
  summary: "Wszystkie ścieżki backendu przeszły",
  syncApply: "Sync aplikuje mutację",
  syncConflict: "Sync odrzuca nieaktualną wersję",
  syncDuplicate: "Sync deduplikuje retry",
  title: "Testy backendu na symulatorze",
  tracks: "Dostęp do tracków",
} as const;

const createStyles = (palette: AppColors) => StyleSheet.create({
  container: { gap: spacing.lg },
  failed: { ...typography.small, color: palette.danger },
  icon: { color: palette.primary, fontSize: 22, fontWeight: "700" },
  passed: { ...typography.small, color: palette.success },
  results: { gap: spacing.sm },
  summary: { ...typography.bodyStrong, color: palette.success },
});
