import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useRef, useState } from "react";
import { createActivityReadOwner, loadActivityRecords, type ActivityReadOutcome, type ActivityReadToken, type ActivityRecord } from "../../application/activityReadModels";
import { operationalDiagnosticCode, type OperationalDiagnosticCode } from "../../application/operationalDiagnostics";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";
import { ActivityView } from "./ActivityView";
import { navigateToActivityResult } from "./activityNavigation";
import { ALL_ACTIVITY_TRACKS, buildActivityModel, type ActivityFilter } from "./tabs/activityModel";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ACTIVITY>;
type ViewState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "ready"; records: readonly ActivityRecord[] }>
  | Readonly<{ diagnosticCode: OperationalDiagnosticCode; kind: "unavailable" }>;

export function ActivityScreen({ navigation }: Props) {
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [filter, setFilter] = useState<ActivityFilter>(ALL_ACTIVITY_TRACKS);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedUnavailableSessionId, setSelectedUnavailableSessionId] = useState<string | null>(null);
  const [selectedSessionDetailsId, setSelectedSessionDetailsId] = useState<string | null>(null);
  const readOwner = useMemo(() => createActivityReadOwner(loadActivityRecords), []);
  const focusedRef = useRef(false);
  const currentTokenRef = useRef<ActivityReadToken | null>(null);

  const publish = useCallback((token: ActivityReadToken, outcome: ActivityReadOutcome) => {
    if (!readOwner.isCurrent(token) || outcome.kind === "stale") return;
    if (outcome.kind === "ready") {
      setState({ kind: "ready", records: outcome.records });
      return;
    }
    setState({ diagnosticCode: operationalDiagnosticCode(outcome.error), kind: "unavailable" });
  }, [readOwner]);

  const load = useCallback(() => {
    if (!focusedRef.current) return;
    const token = readOwner.begin();
    currentTokenRef.current = token;
    setState({ kind: "loading" });
    void readOwner.resolve(token).then((outcome) => publish(token, outcome));
  }, [publish, readOwner]);

  useFocusEffect(useCallback(() => {
    focusedRef.current = true;
    load();
    return () => {
      focusedRef.current = false;
      const token = currentTokenRef.current;
      if (token) readOwner.invalidate(token);
      currentTokenRef.current = null;
    };
  }, [load, readOwner]));

  const retry = useCallback(() => { load(); }, [load]);

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
