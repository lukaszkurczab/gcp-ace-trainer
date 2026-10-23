import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useRef, useState } from "react";
import { createActivityReadOwner, loadActivityRecords, type ActivityReadToken, type ActivityRecord } from "../../application/activityReadModels";
import { operationalDiagnosticCode, type OperationalDiagnosticCode } from "../../application/operationalDiagnostics";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { ActivityView } from "./ActivityView";
import { navigateToActivityResult } from "./activityNavigation";
import { ALL_ACTIVITY_TRACKS, buildActivityModel, type ActivityFilter } from "./tabs/activityModel";
import { readLearningPlanStorageScope } from "../../application/learningReadModels";
import { useScopedReadSnapshot } from "../../application/useScopedReadSnapshot";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ACTIVITY>;
type ViewState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "ready"; records: readonly ActivityRecord[] }>
  | Readonly<{ diagnosticCode: OperationalDiagnosticCode; kind: "unavailable" }>;

const classifyActivityReadError = (error: unknown): OperationalDiagnosticCode => operationalDiagnosticCode(error);

export function ActivityScreen({ navigation }: Props) {
  let scope: object | null;
  try { scope = readLearningPlanStorageScope(); } catch { scope = null; }
  const { snapshot, refresh, invalidate } = useScopedReadSnapshot<readonly ActivityRecord[], OperationalDiagnosticCode>({
    owner: scope,
    classifyError: classifyActivityReadError,
  });
  const [filter, setFilter] = useState<ActivityFilter>(ALL_ACTIVITY_TRACKS);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedUnavailableSessionId, setSelectedUnavailableSessionId] = useState<string | null>(null);
  const [selectedSessionDetailsId, setSelectedSessionDetailsId] = useState<string | null>(null);
  const readOwner = useMemo(() => createActivityReadOwner(loadActivityRecords), []);
  const focusedRef = useRef(false);
  const currentTokenRef = useRef<ActivityReadToken | null>(null);
  const priorScopeRef = useRef<object | null>(null);

  const load = useCallback(() => {
    if (!focusedRef.current) return;
    const owner = scope;
    if (!owner) return;
    const token = readOwner.begin();
    currentTokenRef.current = token;
    const sameScope = priorScopeRef.current === owner;
    if (!sameScope) {
      setSelectedUnavailableSessionId(null);
      setSelectedSessionDetailsId(null);
    }
    priorScopeRef.current = owner;
    void refresh(async () => {
      const outcome = await readOwner.resolve(token);
      if (outcome.kind === "stale") throw new Error("Activity read expired.");
      if (outcome.kind === "error") throw outcome.error;
      return outcome.records;
    });
  }, [readOwner, refresh, scope]);

  useFocusEffect(useCallback(() => {
    focusedRef.current = true;
    load();
    return () => {
      focusedRef.current = false;
      invalidate();
      const token = currentTokenRef.current;
      if (token) readOwner.invalidate(token);
      currentTokenRef.current = null;
    };
  }, [invalidate, load, readOwner]));

  const retry = useCallback(() => { load(); }, [load]);

  const state: ViewState = snapshot.kind === "loading"
    ? { kind: "loading" }
    : snapshot.kind === "unavailable"
      ? { kind: "unavailable", diagnosticCode: snapshot.error }
      : { kind: "ready", records: snapshot.value };

  return <ActivityView
    state={state.kind === "ready" ? { kind: "ready", model: buildActivityModel(state.records, filter) } : state}
    filter={filter} filterVisible={filterVisible}
    selectedUnavailableSessionId={selectedUnavailableSessionId} selectedSessionDetailsId={selectedSessionDetailsId}
    onFilterChange={setFilter} onFilterVisibleChange={setFilterVisible}
    onBack={() => navigation.goBack()} onRetry={retry} onOpenPractice={() => navigation.navigate(ROUTES.PRACTICE_HUB)}
    onItemPress={(item) => {
      if (item.interaction.kind === "toggle_unavailable_details") {
        setSelectedSessionDetailsId(null);
        setSelectedUnavailableSessionId((current) => current === item.sessionId ? null : item.sessionId);
        return;
      }
      if (item.interaction.kind === "toggle_session_details") {
        setSelectedUnavailableSessionId(null);
        setSelectedSessionDetailsId((current) => current === item.sessionId ? null : item.sessionId);
        return;
      }
      navigateToActivityResult(navigation, item);
    }}
  />;
}
