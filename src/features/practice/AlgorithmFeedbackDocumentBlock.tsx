import { StyleSheet, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import type { ContentItemRef } from "../../domain";
import type { AlgorithmFeedbackBlock, AlgorithmFeedbackCalloutKind, AlgorithmFeedbackDocument } from "../../content/contracts";
import type { AppColors } from "../../theme";
import { radius, spacing, typography } from "../../theme";
import { useThemedStyles } from "../../preferences";
import { tokenizeFeedbackCode } from "./feedbackCodeHighlighting";

const CALLOUT_LABEL: Readonly<Record<AlgorithmFeedbackCalloutKind, string>> = {
  decision_rule: "Decision rule",
  worked_example: "Worked example",
  counterexample: "Counterexample",
  common_mistake: "Common mistake",
  edge_case: "Edge case",
  complexity_note: "Complexity note",
  key_takeaway: "Key takeaway",
};

export function AlgorithmFeedbackDocumentBlock({ document, item }: Readonly<{ document: AlgorithmFeedbackDocument; item: ContentItemRef }>) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.document}>{document.blocks.map((block, index) => <FeedbackBlock block={block} index={index} item={item} key={`${block.type}-${index}`} styles={styles} />)}</View>;
}

function FeedbackBlock({ block, index, item, styles }: Readonly<{ block: AlgorithmFeedbackBlock; index: number; item: ContentItemRef; styles: ReturnType<typeof createStyles> }>) {
  if (block.type === "paragraph") return <Text maxFontSizeMultiplier={2} style={styles.paragraph}>{block.text}</Text>;
  if (block.type === "heading") return <Text accessibilityRole="header" maxFontSizeMultiplier={2} style={block.level === 2 ? styles.headingTwo : styles.headingThree}>{block.text}</Text>;
  if (block.type === "bullet_list" || block.type === "ordered_list") return <View accessibilityLabel={`${block.type === "bullet_list" ? "Bullet" : "Numbered"} list`} style={styles.list}>{block.items.map((item, itemIndex) => <View key={`${index}-${itemIndex}`} style={styles.listRow}><Text maxFontSizeMultiplier={2} style={styles.listMarker}>{block.type === "bullet_list" ? "•" : `${itemIndex + 1}.`}</Text><Text maxFontSizeMultiplier={2} style={styles.listText}>{item}</Text></View>)}</View>;
  if (block.type === "code") return <View accessible accessibilityLabel={`Code sample in ${block.language}`} style={styles.codeShell}><Text maxFontSizeMultiplier={2} style={styles.codeLanguage}>{block.language}</Text><Text maxFontSizeMultiplier={2} selectable style={styles.code}>{tokenizeFeedbackCode(block.language, block.code).map((token, tokenIndex) => <Text key={`${index}-${tokenIndex}`} style={styles[`code${token.kind[0]!.toUpperCase()}${token.kind.slice(1)}` as keyof ReturnType<typeof createStyles>]}>{token.text}</Text>)}</Text></View>;
  if (block.type === "image") return <View accessible accessibilityLabel={block.alt} style={styles.image}><SvgXml height="100%" width="100%" xml={contentPackageRuntimeOwner.resolveTextAsset(item, block.assetId).text} /></View>;
  return <View accessible accessibilityLabel={`${CALLOUT_LABEL[block.kind]}. ${block.title ? `${block.title}. ` : ""}${block.text}`} style={styles.callout}><Text maxFontSizeMultiplier={2} style={styles.calloutKind}>{CALLOUT_LABEL[block.kind]}</Text>{block.title ? <Text maxFontSizeMultiplier={2} style={styles.calloutTitle}>{block.title}</Text> : null}<Text maxFontSizeMultiplier={2} style={styles.calloutText}>{block.text}</Text></View>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  document: { gap: spacing.md },
  paragraph: { color: palette.textSecondary, fontSize: 13, lineHeight: 20 },
  headingTwo: { color: palette.textPrimary, fontSize: 13, fontWeight: "600", lineHeight: 20, marginTop: spacing.xs },
  headingThree: { color: palette.textPrimary, fontSize: 13, lineHeight: 20, marginTop: spacing.xs },
  list: { gap: spacing.xs },
  listRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm },
  listMarker: { ...typography.small, color: palette.accentPurple, minWidth: 20 },
  listText: { color: palette.textSecondary, flex: 1, fontSize: 13, lineHeight: 20 },
  codeShell: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radius.sm, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  codeLanguage: { ...typography.small, color: palette.textSecondary, textTransform: "uppercase" },
  code: { color: palette.textPrimary, fontFamily: "Menlo", fontSize: 13, lineHeight: 20 },
  codePlain: { color: palette.textPrimary },
  codeKeyword: { color: palette.accentPurple },
  codeString: { color: palette.success },
  codeComment: { color: palette.textSecondary },
  codeNumber: { color: palette.accentTeal },
  codeOperator: { color: palette.accentPurple },
  image: { alignSelf: "stretch", aspectRatio: 16 / 9, borderRadius: radius.sm, resizeMode: "contain" },
  callout: { backgroundColor: palette.surface, borderColor: palette.border, borderLeftColor: palette.accentPurple, borderLeftWidth: 3, borderRadius: radius.sm, gap: spacing.xs, padding: spacing.md },
  calloutKind: { ...typography.small, color: palette.accentPurple, textTransform: "uppercase" },
  calloutTitle: { ...typography.bodyStrong, color: palette.textPrimary },
  calloutText: { color: palette.textSecondary, fontSize: 13, lineHeight: 20 },
});
