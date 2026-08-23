import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { colorWithOpacity, spacing } from "../theme";
import { useThemedStyles } from "../preferences";
import type { AppColors } from "../theme";


type ScreenProps = {
  children: ReactNode;
  compact?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
  footerVariant?: "default" | "sticky";
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, compact = false, edges = ["bottom"], footer, footerVariant = "default", scroll = true, style }: ScreenProps) {
  const styles = useThemedStyles(createStyles);
  const contentStyle = [styles.content, compact ? styles.contentCompact : null, footer ? styles.contentWithFooter : null, style];
  const content = <View style={contentStyle}>{children}</View>;

  return (
    <SafeAreaView edges={edges} style={styles.safeArea}>
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
      {footer ? <View style={[styles.footer, compact ? styles.footerCompact : null, footerVariant === "sticky" ? styles.footerSticky : null]}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  safeArea: {
    backgroundColor: palette.background,
    flex: 1
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
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
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
    paddingVertical: spacing.lg
  },
  footerCompact: {
    padding: spacing.md
  },
  footerSticky: {
    borderColor: colorWithOpacity("#FFFFFF", 0.05),
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
});
