import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { colors, spacing } from "../theme";

type ScreenProps = {
  children: ReactNode;
  compact?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, compact = false, edges = ["bottom"], footer, scroll = true, style }: ScreenProps) {
  const contentStyle = [styles.content, compact ? styles.contentCompact : null, footer ? styles.contentWithFooter : null, style];
  const content = <View style={contentStyle}>{children}</View>;

  return (
    <SafeAreaView edges={edges} style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, compact ? styles.scrollContentCompact : null]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
      {footer ? <View style={[styles.footer, compact ? styles.footerCompact : null]}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.dark.background,
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg
  },
  scrollContentCompact: {
    paddingBottom: spacing.md
  },
  content: {
    flex: 1,
    gap: spacing.lg,
    padding: spacing.lg
  },
  contentCompact: {
    gap: spacing.md,
    padding: spacing.md
  },
  contentWithFooter: {
    paddingBottom: spacing.md
  },
  footer: {
    backgroundColor: colors.dark.background,
    borderColor: colors.dark.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.lg
  },
  footerCompact: {
    padding: spacing.md
  }
});
