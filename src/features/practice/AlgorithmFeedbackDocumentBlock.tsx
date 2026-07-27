import { StyleSheet, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { resolveAlgorithmFeedbackAsset } from "../../content/algorithmsFeedbackAssets";
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

export function AlgorithmFeedbackDocumentBlock({ document }: Readonly<{ document: AlgorithmFeedbackDocument }>) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.document}>{document.blocks.map((block, index) => <FeedbackBlock block={block} index={index} key={`${block.type}-${index}`} styles={styles} />)}</View>;
}

function FeedbackBlock({ block, index, styles }: Readonly<{ block: AlgorithmFeedbackBlock; index: number; styles: ReturnType<typeof createStyles> }>) {
  if (block.type === "paragraph") return <Text style={styles.paragraph}>{block.text}</Text>;
  if (block.type === "heading") return <Text accessibilityRole="header" style={block.level === 2 ? styles.headingTwo : styles.headingThree}>{block.text}</Text>;
  if (block.type === "bullet_list" || block.type === "ordered_list") return <View accessibilityLabel={`${block.type === "bullet_list" ? "Bullet" : "Numbered"} list`} style={styles.list}>{block.items.map((item, itemIndex) => <View key={`${index}-${itemIndex}`} style={styles.listRow}><Text style={styles.listMarker}>{block.type === "bullet_list" ? "•" : `${itemIndex + 1}.`}</Text><Text style={styles.listText}>{item}</Text></View>)}</View>;
  if (block.type === "code") return <View accessible accessibilityLabel={`Code sample in ${block.language}`} style={styles.codeShell}><Text style={styles.codeLanguage}>{block.language}</Text><Text selectable style={styles.code}>{tokenizeFeedbackCode(block.language, block.code).map((token, tokenIndex) => <Text key={`${index}-${tokenIndex}`} style={styles[`code${token.kind[0]!.toUpperCase()}${token.kind.slice(1)}` as keyof ReturnType<typeof createStyles>]}>{token.text}</Text>)}</Text></View>;
  if (block.type === "image") return <View accessible accessibilityLabel={block.alt} style={styles.image}><SvgXml height="100%" width="100%" xml={resolveAlgorithmFeedbackAsset(block.assetId).xml} /></View>;
  return <View accessible accessibilityLabel={`${CALLOUT_LABEL[block.kind]}. ${block.title ? `${block.title}. ` : ""}${block.text}`} style={styles.callout}><Text style={styles.calloutKind}>{CALLOUT_LABEL[block.kind]}</Text>{block.title ? <Text style={styles.calloutTitle}>{block.title}</Text> : null}<Text style={styles.calloutText}>{block.text}</Text></View>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  document: { gap: spacing.md },
  paragraph: { ...typography.small, color: palette.textSecondary },
  headingTwo: { ...typography.bodyStrong, color: palette.textPrimary, marginTop: spacing.xs },
  headingThree: { ...typography.small, color: palette.textPrimary, marginTop: spacing.xs },
  list: { gap: spacing.xs },
  listRow: { alignItems: "flex-start", flexDirection: "row", gap: spacing.sm },
  listMarker: { ...typography.small, color: palette.accentPurple, minWidth: 20 },
  listText: { ...typography.small, color: palette.textSecondary, flex: 1 },
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
  calloutText: { ...typography.small, color: palette.textSecondary },
});
