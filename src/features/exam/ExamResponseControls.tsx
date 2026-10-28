import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AnswerOption, Button } from "../../components";
import type { CanonicalQuestionResponse } from "../../content/canonical";
import { useThemedStyles } from "../../preferences";
import { radius, spacing, typography, type AppColors } from "../../theme";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { toggleExamOption } from "./examResponseSelection";

export type ExamStatement = Readonly<{ id: string; label?: string; selectedValues?: readonly string[]; values: readonly Readonly<{ id: string; text: string }>[] }>;
export type ExamResponseRenderer = Readonly<{ kind?: string; options?: readonly Readonly<{ id: string; text: string }>[]; dimensions?: readonly ExamStatement[] }>;

/** Uses only the neutral interaction projection; no answer key enters a running exam. */
export function ExamResponseControls({ disabled = false, interactionType, itemId, onChange, renderer, requiredSelectionCount, response }: Readonly<{
  disabled?: boolean;
  interactionType: string;
  itemId: string;
  onChange: (response: CanonicalQuestionResponse | null) => void;
  renderer: ExamResponseRenderer;
  requiredSelectionCount?: number;
  response: CanonicalQuestionResponse | null;
}>) {
  const { t } = useTranslation("common");
  const styles = useThemedStyles(createStyles);
  if (interactionType === "decision_matrix" && renderer.kind === "complexity" && renderer.dimensions) {
    const selections = response?.type === "decision_matrix" ? response.selectedValueIdsByDimension : {};
    return <View style={styles.stack}>
      {renderer.dimensions.map((statement) => <StatementSelect disabled={disabled} itemId={itemId} key={statement.id} onChange={(id) => {
        const next = { ...selections };
        if (id === null) delete next[statement.id]; else next[statement.id] = [id];
        onChange(Object.keys(next).length ? { type: "decision_matrix", selectedValueIdsByDimension: next } : null);
      }} selectedId={selections[statement.id]?.[0] ?? null} statement={statement} />)}
    </View>;
  }
  if ((interactionType !== "choice_single" && interactionType !== "choice_multiple") || renderer.kind !== "choice" || !renderer.options) {
    return <Text accessibilityRole="alert" style={styles.text}>{t("This exam question type is unavailable.")}</Text>;
  }
  const multiple = interactionType === "choice_multiple";
  const selected = response?.type === "choice_single" ? [response.optionId] : response?.type === "choice_multiple" ? response.optionIds : [];
  return <View style={styles.stack}>
    {multiple ? <Text accessibilityLiveRegion="polite" style={styles.text} maxFontSizeMultiplier={2}>{requiredSelectionCount === undefined ? t("Select all that apply") : t("Select {{count}} answers", { count: requiredSelectionCount })}{` · ${selected.length} ${t("selected")}`}</Text> : null}
    {renderer.options.map((option, index) => <AnswerOption accessibilityLabel={option.text} accessibilityRole={multiple ? "checkbox" : "radio"} accessibilityState={{ checked: selected.includes(option.id), disabled }} disabled={disabled} key={option.id} letter={multiple ? selected.includes(option.id) ? "☑" : "☐" : String.fromCharCode(65 + index)} onPress={() => {
      if (multiple) {
        const optionIds = toggleExamOption(selected, option.id, requiredSelectionCount);
        onChange(optionIds.length ? { type: "choice_multiple", optionIds } : null);
      }
      else onChange(selected.includes(option.id) ? null : { type: "choice_single", optionId: option.id });
    }} state={selected.includes(option.id) ? "selected" : "default"} testID={runtimeSelectors.simulation.option(itemId, option.id)} text={option.text} />)}
  </View>;
}

function StatementSelect({ disabled, itemId, onChange, selectedId, statement }: Readonly<{ disabled: boolean; itemId: string; onChange: (id: string | null) => void; selectedId: string | null; statement: ExamStatement }>) {
  const { t } = useTranslation("common");
  const styles = useThemedStyles(createStyles);
  const [open, setOpen] = useState(false);
  const label = statement.label ?? statement.id;
  const selectedText = statement.values.find((value) => value.id === selectedId)?.text ?? t("Choose");
  return <View style={styles.statement}>
    <Text style={styles.text} maxFontSizeMultiplier={2}>{label}</Text>
    <Pressable accessibilityLabel={`${label}: ${selectedText}`} accessibilityRole="combobox" accessibilityState={{ disabled, expanded: open }} disabled={disabled} onPress={() => setOpen(true)} style={styles.select} testID={`exam-statement-${itemId}-${statement.id}`}>
      <Text style={styles.text} maxFontSizeMultiplier={2}>{selectedText} ▾</Text>
    </Pressable>
    <Modal animationType="fade" onRequestClose={() => setOpen(false)} transparent visible={open}>
      <View style={styles.modal}>
        <Pressable accessibilityLabel={t("Close")} accessibilityRole="button" onPress={() => setOpen(false)} style={styles.backdrop} />
        <View accessibilityViewIsModal style={styles.menu}>
          <Text style={styles.text} maxFontSizeMultiplier={2}>{label}</Text>
          <ScrollView>
            {[{ id: null, text: t("Choose") }, ...statement.values].map((value) => <Pressable accessibilityLabel={`${label}: ${value.text}`} accessibilityRole="radio" accessibilityState={{ checked: selectedId === value.id }} key={value.id ?? "empty"} onPress={() => { onChange(value.id); setOpen(false); }} style={styles.select} testID={`exam-statement-value-${itemId}-${statement.id}-${value.id ?? "empty"}`}>
              <Text style={styles.text} maxFontSizeMultiplier={2}>{value.text}</Text>
            </Pressable>)}
          </ScrollView>
          <Button onPress={() => setOpen(false)} variant="secondary">{t("Close")}</Button>
        </View>
      </View>
    </Modal>
  </View>;
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  stack: { gap: spacing.md },
  statement: { gap: spacing.sm },
  text: { ...typography.body, color: palette.textPrimary },
  select: { backgroundColor: palette.surfaceInput, borderColor: palette.border, borderRadius: radius.md, borderWidth: 1, minHeight: 48, padding: spacing.md, justifyContent: "center" },
  modal: { alignItems: "center", justifyContent: "center", flex: 1, padding: spacing.lg },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: palette.effects.scrim },
  menu: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, maxHeight: "85%", maxWidth: 480, width: "100%" },
});
