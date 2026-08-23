import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { colorWithOpacity, spacing } from "../theme";
import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";
import { AmbientBackdrop } from "./AmbientBackdrop";


type ScreenProps = {
  children: ReactNode;
  compact?: boolean;
  ambient?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
  footerVariant?: "default" | "review" | "session" | "simulation" | "sticky";
  header?: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ ambient = false, children, compact = false, edges = ["bottom"], footer, footerVariant = "default", header, scroll = true, style }: ScreenProps) {
  const styles = useThemedStyles(createStyles);
  const contentStyle = [styles.content, compact ? styles.contentCompact : null, footer ? styles.contentWithFooter : null, style];
  const content = <View style={contentStyle}>{children}</View>;

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, ambient ? styles.ambientSafeArea : null]}>
      {ambient ? <AmbientBackdrop /> : null}
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, compact ? styles.scrollContentCompact : null]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
      {footer ? <View style={[styles.footer, compact ? styles.footerCompact : null, footerVariant === "review" ? styles.footerReview : null, footerVariant === "session" ? styles.footerSession : null, footerVariant === "simulation" ? styles.footerSimulation : null, footerVariant === "sticky" ? styles.footerSticky : null]}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  safeArea: {
    backgroundColor: palette.background,
    flex: 1
  },
  ambientSafeArea: {
    backgroundColor: "transparent",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg
  },
  scroll: {
    flex: 1,
  },
  scrollContentCompact: {
    paddingBottom: spacing.md
  },
  content: {
    flex: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl
  },
  contentCompact: {
    gap: spacing.md,
    padding: spacing.md
  },
  contentWithFooter: {
    paddingBottom: spacing.md
  },
  footer: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderTopWidth: 1,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl
  },
  footerCompact: {
    padding: spacing.md
  },
  footerReview: {
    borderColor: colorWithOpacity("#FFFFFF", 0.04),
    gap: 0,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  footerSession: {
    justifyContent: "flex-end",
    minHeight: 228,
    gap: spacing.sm,
  },
  footerSimulation: {
    justifyContent: "flex-end",
    minHeight: 361,
    gap: spacing.sm,
  },
  footerSticky: {
    borderColor: colorWithOpacity("#FFFFFF", 0.05),
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
});
