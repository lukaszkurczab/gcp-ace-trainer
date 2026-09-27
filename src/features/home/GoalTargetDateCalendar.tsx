import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { IconButton } from "../../components";
import { useAppPreferences, useThemedStyles, type AppLocale } from "../../preferences";
import type { AppColors } from "../../theme";
import { radius, spacing, typography } from "../../theme";
import {
  buildGoalCalendarWeeks,
  formatGoalCalendarAccessibleDate,
  formatGoalCalendarAccessibleWeekday,
  formatGoalCalendarMonth,
  formatGoalCalendarWeekdayLabels,
  goalCalendarDateId,
  isSameGoalCalendarDate,
  shiftGoalCalendarMonth,
} from "./goalTargetDateCalendarModel";

type GoalTargetDateCalendarProps = Readonly<{
  locale: AppLocale;
  onChange: (date: Date) => void;
  value: Date;
}>;

export function GoalTargetDateCalendar({ locale, onChange, value }: GoalTargetDateCalendarProps) {
  const styles = useThemedStyles(createStyles);
  const { colors: palette } = useAppPreferences();
  const { t } = useTranslation("common");
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1, 12));

  useEffect(() => {
    setVisibleMonth(new Date(value.getFullYear(), value.getMonth(), 1, 12));
  }, [value]);

  const weeks = buildGoalCalendarWeeks(visibleMonth, locale);
  const weekdays = formatGoalCalendarWeekdayLabels(locale);
  const dayFormatter = new Intl.NumberFormat(locale, { useGrouping: false });

  return (
    <View style={styles.calendar} testID="goal-target-date-calendar">
      <View style={styles.monthHeader}>
        <IconButton
          accessibilityLabel={t("Previous month")}
          icon="chevron-left"
          onPress={() => setVisibleMonth((current) => shiftGoalCalendarMonth(current, -1))}
          testID="goal-calendar-previous-month"
        />
        <Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={2} style={styles.monthTitle} testID="goal-calendar-month-title">
          {formatGoalCalendarMonth(visibleMonth, locale)}
        </Text>
        <IconButton
          accessibilityLabel={t("Next month")}
          icon="chevron-right"
          onPress={() => setVisibleMonth((current) => shiftGoalCalendarMonth(current, 1))}
          testID="goal-calendar-next-month"
        />
      </View>

      <View style={styles.weekdayRow}>
        {weekdays.map((weekday, index) => {
          return (
            <Text accessibilityLabel={formatGoalCalendarAccessibleWeekday(index, locale)} key={`${locale}-${index}`} maxFontSizeMultiplier={2} style={styles.weekdayLabel}>
              {weekday}
            </Text>
          );
        })}
      </View>

      <View style={styles.weeks}>
        {weeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekRow}>
            {week.map((date, dayIndex) => {
              if (!date) {
                return <View accessibilityElementsHidden key={`empty-${weekIndex}-${dayIndex}`} style={styles.dayCell} />;
              }
              const selected = isSameGoalCalendarDate(date, value);
              const isoDate = goalCalendarDateId(date);
              return (
                <Pressable
                  accessibilityLabel={formatGoalCalendarAccessibleDate(date, locale)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={isoDate}
                  onPress={() => onChange(date)}
                  style={[styles.dayCell, selected ? styles.selectedDayCell : null]}
                  testID={`goal-calendar-date-${isoDate}`}
                >
                  <Text maxFontSizeMultiplier={2} style={[styles.dayLabel, selected ? styles.selectedDayLabel : null]}>
                    {dayFormatter.format(date.getDate())}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (palette: AppColors) => StyleSheet.create({
  calendar: { gap: spacing.md },
  monthHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  monthTitle: { ...typography.bodyStrong, color: palette.textPrimary, flex: 1, textAlign: "center" },
  weekdayRow: { flexDirection: "row", gap: spacing.xxs },
  weekdayLabel: { color: palette.textMuted, flex: 1, fontSize: 12, fontWeight: "600", lineHeight: 20, textAlign: "center" },
  weeks: { gap: spacing.xxs },
  weekRow: { flexDirection: "row", gap: spacing.xxs },
  dayCell: { alignItems: "center", borderRadius: radius.md, flex: 1, justifyContent: "center", minHeight: 44, minWidth: 36 },
  selectedDayCell: { backgroundColor: palette.primary },
  dayLabel: { color: palette.textPrimary, fontSize: 14, lineHeight: 20 },
  selectedDayLabel: { color: palette.onPrimary, fontWeight: "700" },
});
