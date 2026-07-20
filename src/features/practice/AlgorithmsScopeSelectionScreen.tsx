import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { EmptyState, Icon, IconTile, ListRow, Screen, SectionHeader } from "../../components";
import { loadAlgorithmsDeclaredScopeOptions } from "../../application/learningReadModels";
import { ROUTES } from "../../constants/routes";
import { ALGORITHMS_TRACK_ID } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import { colors, spacing } from "../../theme";
import { AppStackHeader } from "../navigation/AppStackHeader";
import { buildPracticeSessionConfig } from "./sessionConfig";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_SCOPE_SELECTION>;
type State =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "ready"; options: Awaited<ReturnType<typeof loadAlgorithmsDeclaredScopeOptions>> }>
  | Readonly<{ kind: "unavailable"; reason: string }>;

export function AlgorithmsScopeSelectionScreen({ navigation, route }: Props) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const modeTitle = route.params.modeId === "algorithms-contrast-practice" ? "Contrast Practice" : route.params.modeId === "algorithms-independent-practice" ? "Independent Practice" : "Recognize Patterns";

  useEffect(() => {
    let active = true;
    void loadAlgorithmsDeclaredScopeOptions({ modeId: route.params.modeId, targetMentalUnitId: route.params.targetMentalUnitId })
      .then((options) => {
        if (!active) return;
        setState(options.length > 0 ? { kind: "ready", options } : { kind: "unavailable", reason: "No declared practice scope is available for this recommendation." });
      })
      .catch((error) => { if (active) setState({ kind: "unavailable", reason: error instanceof Error ? error.message : "Declared practice scopes are unavailable." }); });
    return () => { active = false; };
  }, [route.params.modeId, route.params.targetMentalUnitId]);

  if (state.kind === "unavailable") {
    return <Screen><EmptyState title="Practice scope unavailable" description={state.reason} actionLabel="Back to practice" onActionPress={() => navigation.goBack()} /></Screen>;
  }
  if (state.kind === "loading") return <Screen><AppStackHeader navigation={navigation} showBack subtitle="Algorithms" /><SectionHeader title="Loading practice scopes" subtitle="Reading the declared content scopes." /></Screen>;

  return (
    <Screen scroll edges={["top"]} style={{ gap: spacing.lg }}>
      <AppStackHeader navigation={navigation} showBack subtitle="Algorithms" />
      <SectionHeader title={`Choose a scope for ${modeTitle}`} subtitle="Each option is declared by the active Algorithms content artifact." />
      <View style={{ gap: spacing.sm }}>
        {state.options.map((option) => (
          <ListRow
            detail={option.detail}
            key={JSON.stringify(option.scope)}
            leading={<IconTile name="route" tone="primary" />}
            onPress={() => navigation.navigate(ROUTES.PRACTICE_SESSION, buildPracticeSessionConfig({ algorithmScope: option.scope, mode: route.params.modeId, source: route.params.source, topicId: option.topicId, trackId: ALGORITHMS_TRACK_ID }))}
            title={option.title}
            trailing={<Icon color={colors.dark.textMuted} name="chevron-right" size={18} />}
          />
        ))}
      </View>
    </Screen>
  );
}
