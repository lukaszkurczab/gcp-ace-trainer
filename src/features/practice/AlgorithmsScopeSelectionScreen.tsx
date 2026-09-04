import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";

import { AppShellHeader, EmptyState, Icon, IconTile, ListRow, Screen, SectionHeader, SkeletonShape, useSkeletonGlassMotion } from "../../components";
import { loadAlgorithmsDeclaredScopeOptions } from "../../application/learningReadModels";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { ROUTES } from "../../constants/routes";
import { CODING_INTERVIEW_TRACK_ID } from "../../domain";
import { goBackOrHome } from "../../navigation/goBackOrHome";
import type { RootStackParamList } from "../../navigation/types";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { radius, spacing, type AppColors } from "../../theme";
import { useAppPreferences, useThemedStyles } from "../../preferences";
import { getAlgorithmMode } from "../../tracks/coding-interview";
import { buildPracticeSessionConfig } from "./sessionConfig";

type Props = NativeStackScreenProps<RootStackParamList, typeof ROUTES.ALGORITHMS_SCOPE_SELECTION>;
type State =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "ready"; options: Awaited<ReturnType<typeof loadAlgorithmsDeclaredScopeOptions>> }>
  | Readonly<{ kind: "unavailable"; reason: string }>;

export function AlgorithmsScopeSelectionScreen({ navigation, route }: Props) {
  const { colors } = useAppPreferences();
  const { t } = useTranslation("common");
  const [state, setState] = useState<State>({ kind: "loading" });
  const modeTitle = getAlgorithmMode(route.params.modeId).title;

  useEffect(() => {
    let active = true;
    void loadAlgorithmsDeclaredScopeOptions({ modeId: route.params.modeId, targetMentalUnitId: route.params.targetMentalUnitId })
      .then((options) => {
        if (!active) return;
        setState(options.length > 0 ? { kind: "ready", options } : { kind: "unavailable", reason: "No topics are available for this practice mode." });
      })
      .catch((error) => { if (active) setState({ kind: "unavailable", reason: describeOperationalFailure(error, t("We couldn’t load the available topics.")) }); });
    return () => { active = false; };
  }, [route.params.modeId, route.params.targetMentalUnitId, t]);

  if (state.kind === "unavailable") {
    return <Screen edges={["top"]}><AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Coding Interview")} /><EmptyState title={t("Practice scope unavailable")} description={t(state.reason)} actionLabel={t("Back to practice")} onActionPress={() => goBackOrHome(navigation)} /></Screen>;
  }
  if (state.kind === "loading") return <Screen edges={["top"]} style={{ gap: spacing.lg }}><AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Coding Interview")} /><ScopeLoadingSkeleton /></Screen>;
  const codingInterviewTrackId = CODING_INTERVIEW_TRACK_ID;

  return (
    <Screen scroll edges={["top"]} style={{ gap: spacing.lg }}>
      <AppShellHeader backAction={{ onPress: () => goBackOrHome(navigation) }} context={t("Coding Interview")} />
      <SectionHeader title={t("Choose a topic for {{mode}}", { mode: t(modeTitle) })} subtitle={t("Choose a topic. Questions mix the skills in that topic without hints.")} />
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

export function ScopeLoadingSkeleton() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation("common");
  const { fontScale } = useWindowDimensions();
  const textScale = Math.min(fontScale, 2);
  const motion = useSkeletonGlassMotion();

  return (
    <View
      accessibilityLabel={t("Loading topics…")}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessible
      style={styles.scopeLoading}
    >
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.scopeLoadingShapes}>
        <View style={styles.scopeLoadingSection}>
          <SkeletonShape motion={motion} style={[styles.scopeLoadingLine, styles.scopeLoadingHeading, { height: 22 * textScale }]} />
          <SkeletonShape motion={motion} style={[styles.scopeLoadingLine, styles.scopeLoadingSubtitle, { height: 14 * textScale }]} />
        </View>
        <View style={styles.scopeLoadingRows}>
          <View style={styles.scopeLoadingRow}>
            <SkeletonShape motion={motion} style={styles.scopeLoadingIcon} />
            <View style={styles.scopeLoadingCopy}>
              <SkeletonShape motion={motion} style={[styles.scopeLoadingLine, styles.scopeLoadingTitle, { height: 15 * textScale }]} />
              <SkeletonShape motion={motion} style={[styles.scopeLoadingLine, styles.scopeLoadingDetail, { height: 12 * textScale }]} />
            </View>
            <SkeletonShape motion={motion} style={styles.scopeLoadingChevron} />
          </View>
          <View style={styles.scopeLoadingRow}>
            <SkeletonShape motion={motion} style={styles.scopeLoadingIcon} />
            <View style={styles.scopeLoadingCopy}>
              <SkeletonShape motion={motion} style={[styles.scopeLoadingLine, styles.scopeLoadingTitleShort, { height: 15 * textScale }]} />
              <SkeletonShape motion={motion} style={[styles.scopeLoadingLine, styles.scopeLoadingDetailLong, { height: 12 * textScale }]} />
            </View>
            <SkeletonShape motion={motion} style={styles.scopeLoadingChevron} />
          </View>
          <View style={styles.scopeLoadingRow}>
            <SkeletonShape motion={motion} style={styles.scopeLoadingIcon} />
            <View style={styles.scopeLoadingCopy}>
              <SkeletonShape motion={motion} style={[styles.scopeLoadingLine, styles.scopeLoadingTitle, { height: 15 * textScale }]} />
              <SkeletonShape motion={motion} style={[styles.scopeLoadingLine, styles.scopeLoadingDetail, { height: 12 * textScale }]} />
            </View>
            <SkeletonShape motion={motion} style={styles.scopeLoadingChevron} />
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  scopeLoading: { gap: spacing.lg, width: "100%" },
  scopeLoadingShapes: { gap: spacing.lg, width: "100%" },
  scopeLoadingSection: { gap: spacing.xs },
  scopeLoadingLine: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.pill },
  scopeLoadingHeading: { width: "72%" },
  scopeLoadingSubtitle: { width: "88%" },
  scopeLoadingRows: { gap: spacing.sm },
  scopeLoadingRow: { alignItems: "center", backgroundColor: palette.listRow.surface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", gap: spacing.md, minHeight: 72, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  scopeLoadingIcon: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.md, height: 40, width: 40 },
  scopeLoadingCopy: { flex: 1, gap: spacing.xxs, minWidth: 0 },
  scopeLoadingTitle: { width: "68%" },
  scopeLoadingTitleShort: { width: "54%" },
  scopeLoadingDetail: { width: "82%" },
  scopeLoadingDetailLong: { width: "90%" },
  scopeLoadingChevron: { backgroundColor: palette.progress.loadingTrack, borderRadius: radius.pill, height: 14, width: 14 },
});
