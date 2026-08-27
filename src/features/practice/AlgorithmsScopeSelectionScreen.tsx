import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { AppShellHeader, EmptyState, Icon, IconTile, ListRow, LoadingState, Screen, SectionHeader } from "../../components";
import { loadAlgorithmsDeclaredScopeOptions } from "../../application/learningReadModels";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { ROUTES } from "../../constants/routes";
import { CODING_INTERVIEW_TRACK_ID } from "../../domain";
import { goBackOrHome } from "../../navigation/goBackOrHome";
import type { RootStackParamList } from "../../navigation/types";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { spacing } from "../../theme";
import { useAppPreferences } from "../../preferences";
import { getAlgorithmMode } from "../../tracks/coding-interview";
import { buildPracticeSessionConfig } from "./sessionConfig";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_SCOPE_SELECTION>;
type State =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "ready"; options: Awaited<ReturnType<typeof loadAlgorithmsDeclaredScopeOptions>> }>
  | Readonly<{ kind: "unavailable"; reason: string }>;

export function AlgorithmsScopeSelectionScreen({ navigation, route }: Props) {
  const { colors, t } = useAppPreferences();
  const [state, setState] = useState<State>({ kind: "loading" });
  const modeTitle = getAlgorithmMode(route.params.modeId).title;

  useEffect(() => {
    let active = true;
    void loadAlgorithmsDeclaredScopeOptions({ modeId: route.params.modeId, targetMentalUnitId: route.params.targetMentalUnitId })
      .then((options) => {
        if (!active) return;
        setState(options.length > 0 ? { kind: "ready", options } : { kind: "unavailable", reason: "No declared practice scope is available for this recommendation." });
      })
      .catch((error) => { if (active) setState({ kind: "unavailable", reason: describeOperationalFailure(error, "Declared practice scopes are unavailable.") }); });
    return () => { active = false; };
  }, [route.params.modeId, route.params.targetMentalUnitId]);

  if (state.kind === "unavailable") {
    return <Screen edges={["top"]}><AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Coding Interview")} /><EmptyState title={t("Practice scope unavailable")} description={t(state.reason)} actionLabel={t("Back to practice")} onActionPress={() => goBackOrHome(navigation)} /></Screen>;
  }
  if (state.kind === "loading") return <Screen edges={["top"]}><AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Coding Interview")} /><LoadingState title={t("Loading practice scopes")} description={t("Reading the declared content scopes.")} /></Screen>;
  const codingInterviewTrackId = CODING_INTERVIEW_TRACK_ID;

  return (
    <Screen scroll edges={["top"]} style={{ gap: spacing.lg }}>
      <AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Coding Interview")} />
      <SectionHeader title={`${t("Choose a scope for")} ${t(modeTitle)}`} subtitle={t("Choose a topic. Questions mix the skills in that topic without hints.")} />
      <View style={{ gap: spacing.sm }}>
        {state.options.map((option) => (
          <ListRow
            detail={t(option.detail)}
            key={JSON.stringify(option.scope)}
            leading={<IconTile name="route" tone="primary" />}
            onPress={() => navigation.navigate(ROUTES.PRACTICE_SESSION, buildPracticeSessionConfig({ algorithmScope: option.scope, mode: route.params.modeId, source: route.params.source, topicId: option.topicId, trackId: codingInterviewTrackId }))}
            testID={runtimeSelectors.practice.declaredScope(option.topicId)}
            title={option.title}
            trailing={<Icon color={colors.textMuted} name="chevron-right" size={18} />}
          />
        ))}
      </View>
    </Screen>
  );
}
