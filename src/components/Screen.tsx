import { useCallback, useEffect, useRef, type ReactNode, type RefObject } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle, useWindowDimensions } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { spacing } from "../theme";
import { useThemedStyles } from "../preferences/appPreferencesContext";
import type { AppColors } from "../theme";
import { AmbientBackdrop } from "./AmbientBackdrop";
import { BackLink, type BackLinkProps } from "./BackLink";


type ScreenProps = {
  backgroundColor?: string;
  backAction?: BackLinkProps;
  children: ReactNode;
  compact?: boolean;
  ambient?: boolean;
  ambientVariant?: "default" | "activity" | "goal" | "auth";
  edges?: Edge[];
  footer?: ReactNode;
  footerVariant?: "default" | "review" | "session" | "simulation" | "sticky";
  header?: ReactNode;
  scroll?: boolean;
  scrollFocus?: Readonly<{ key: string; target: RefObject<View | null> }>;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ ambient = true, ambientVariant = "default", backgroundColor, backAction, children, compact = false, edges = ["bottom"], footer, footerVariant = "default", header, scroll = true, scrollFocus, style }: ScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { fontScale } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const focusedKey = useRef<string | null>(null);
  const focusContent = useCallback(() => {
    if (!scroll || !scrollFocus || focusedKey.current === scrollFocus.key) return;
    const contentNode = contentRef.current;
    if (!contentNode || !scrollFocus.target.current || !scrollRef.current) return;
    scrollFocus.target.current.measureLayout(contentNode, (_x, y) => {
      if (focusedKey.current === scrollFocus.key) return;
      scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: false });
      focusedKey.current = scrollFocus.key;
    });
  }, [scroll, scrollFocus]);
  useEffect(() => {
    const frame = requestAnimationFrame(focusContent);
    return () => cancelAnimationFrame(frame);
  }, [focusContent]);
  const contentStyle = [styles.content, compact ? styles.contentCompact : null, footer ? styles.contentWithFooter : null, style];
  const content = <View ref={contentRef} collapsable={scrollFocus ? false : undefined} style={contentStyle}>{children}</View>;

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, backgroundColor ? { backgroundColor } : null, ambient ? styles.ambientSafeArea : null]}>
      {ambient ? <AmbientBackdrop variant={ambientVariant} /> : null}
      {backAction ? <View key={`navigation:${fontScale}`} style={styles.navigation}><BackLink {...backAction} /></View> : null}
      {header}
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          onContentSizeChange={scrollFocus ? focusContent : undefined}
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
  navigation: {
    backgroundColor: palette.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
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
    paddingVertical: spacing.lg
  },
  footerCompact: {
    padding: spacing.md
  },
  footerReview: {
    borderColor: palette.effects.divider,
    gap: 0,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  footerSession: {
    justifyContent: "flex-end",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  footerSimulation: {
    justifyContent: "flex-end",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  footerSticky: {
    borderColor: palette.effects.subtleBorder,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
});
