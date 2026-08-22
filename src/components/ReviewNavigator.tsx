import { useEffect, useState } from "react";
import { AccessibilityInfo, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { useAppPreferences, useThemedStyles } from "../preferences";
import { radius, spacing, type AppColors } from "../theme";
import { IconButton } from "./IconButton";

export type ReviewNavigatorItem = Readonly<{ answered: boolean; id: string; ordinal: number }>;

type ReviewNavigatorProps = Readonly<{
  currentOrdinal: number;
  items: readonly ReviewNavigatorItem[];
  onClose: () => void;
  onSelect: (ordinal: number) => void;
  visible: boolean;
}>;

/** Shared Figma answer navigator for read-only review surfaces. */
export function ReviewNavigator({ currentOrdinal, items, onClose, onSelect, visible }: ReviewNavigatorProps) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  const { t } = useAppPreferences();
  const reduceMotion = useReducedMotion();
  const columns = fontScale >= 1.8 ? 3 : fontScale >= 1.3 ? 4 : 6;
  const answeredCount = items.filter((item) => item.answered).length;
  return (
    <Modal animationType={reduceMotion ? "none" : "slide"} onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel={t("Close answer navigator")} accessibilityRole="button" onPress={onClose} style={styles.dismissArea} />
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text maxFontSizeMultiplier={2} style={styles.title}>{t("Answer navigator")}</Text>
            <IconButton accessibilityLabel={t("Close answer navigator")} icon="close" onPress={onClose} />
          </View>
          <View style={styles.summary}><Text maxFontSizeMultiplier={2} style={styles.summaryText}>{`${answeredCount} ${t("answered")}`}</Text></View>
          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const selected = item.ordinal === currentOrdinal;
              return (
                <Pressable
                  accessibilityLabel={`${t("Question")} ${item.ordinal}${item.answered ? `, ${t("answered")}` : `, ${t("unanswered")}`}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={item.id}
                  onPress={() => onSelect(item.ordinal)}
                  style={[styles.cell, { width: columns === 6 ? 48 : 64 }, item.answered ? styles.answeredCell : null, selected ? styles.currentCell : null]}
                >
                  <Text maxFontSizeMultiplier={2} style={[styles.cellText, selected || item.answered ? styles.activeCellText : null]}>{item.ordinal}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let subscribed = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => { if (subscribed) setReduceMotion(enabled); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { subscribed = false; subscription.remove(); };
  }, []);
  return reduceMotion;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  activeCellText: { color: palette.onPrimary },
  answeredCell: { backgroundColor: palette.primary, borderColor: palette.primary },
  backdrop: { backgroundColor: "rgba(2,6,23,0.56)", flex: 1, justifyContent: "flex-end" },
  cell: { alignItems: "center", backgroundColor: palette.elevatedSurface, borderColor: palette.border, borderRadius: radius.lg, borderWidth: 1, height: 48, justifyContent: "center" },
  cellText: { color: palette.textSecondary, fontSize: 12, fontWeight: "600", letterSpacing: 0.5, lineHeight: 16 },
  currentCell: { backgroundColor: palette.primary, borderColor: palette.primary },
  dismissArea: { ...StyleSheet.absoluteFill },
  grid: { alignContent: "flex-start", columnGap: 9, flexDirection: "row", flexWrap: "wrap", paddingBottom: spacing.xl, paddingHorizontal: spacing.xl, paddingTop: spacing.sm, rowGap: spacing.sm },
  handle: { alignSelf: "center", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 2, height: 4, marginVertical: 10, width: 36 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.xl },
  sheet: { backgroundColor: palette.elevatedSurface, borderColor: palette.borderStrong, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, gap: spacing.sm, maxHeight: "86%", paddingBottom: spacing.lg },
  summary: { paddingHorizontal: spacing.xl, paddingTop: spacing.xs },
  summaryText: { color: palette.primary, fontSize: 12, fontWeight: "500", lineHeight: 16 },
  title: { color: palette.textPrimary, fontSize: 16, fontWeight: "600", lineHeight: 20 },
});
