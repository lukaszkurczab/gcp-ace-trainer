import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildGoalCalendarWeeks,
  formatGoalCalendarAccessibleDate,
  formatGoalCalendarMonth,
  formatGoalCalendarWeekdayLabels,
  goalCalendarDateId,
  goalCalendarWeekStartsOn,
  isSameGoalCalendarDate,
  shiftGoalCalendarMonth,
} from "./goalTargetDateCalendarModel";

const locales = ["en", "pl", "de", "fr", "es", "it", "et"] as const;
const calendarSource = readFileSync(new URL("./GoalTargetDateCalendar.tsx", import.meta.url), "utf8");
const screenSource = readFileSync(new URL("./GoalCadenceScreen.tsx", import.meta.url), "utf8");

test("GoalCadenceScreen passes its selected app locale into the calendar", () => {
  assert.match(screenSource, /const \{ colors: palette, locale \} = useAppPreferences\(\)/);
  assert.match(screenSource, /<GoalTargetDateCalendar\s+locale=\{locale\}[\s\S]*?onChange=\{setPendingDate\}[\s\S]*?value=\{pendingDate\}/);
});

test("the rendered month, weekday headings and accessible dates all use that locale", () => {
  assert.match(calendarSource, /formatGoalCalendarMonth\(visibleMonth, locale\)/);
  assert.match(calendarSource, /formatGoalCalendarWeekdayLabels\(locale\)/);
  assert.match(calendarSource, /accessibilityLabel=\{formatGoalCalendarAccessibleDate\(date, locale\)\}/);

  const month = new Date(2026, 0, 12, 12);
  const accessibleDate = new Date(2026, 0, 5, 12);
  const monthTitles = locales.map((locale) => formatGoalCalendarMonth(month, locale));
  const weekdayHeadings = locales.map((locale) => formatGoalCalendarWeekdayLabels(locale));
  const accessibleLabels = locales.map((locale) => formatGoalCalendarAccessibleDate(accessibleDate, locale));

  assert.equal(new Set(monthTitles).size, locales.length);
  assert.equal(new Set(accessibleLabels).size, locales.length);
  locales.forEach((locale, index) => {
    assert.equal(monthTitles[index], new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month));
    assert.deepEqual(
      weekdayHeadings[index],
      Array.from({ length: 7 }, (_, day) => {
        const weekday = (locale === "en" ? day : (day + 1) % 7);
        return new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" })
          .format(new Date(Date.UTC(2023, 0, 1 + weekday)));
      }),
    );
    assert.equal(
      accessibleLabels[index],
      new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", weekday: "long", year: "numeric" }).format(accessibleDate),
    );
  });
});

test("month boundaries, leap days and week starts build complete selectable grids", () => {
  const february = new Date(2024, 1, 1, 12);
  const englishWeeks = buildGoalCalendarWeeks(february, "en");
  const mondayFirstWeeks = buildGoalCalendarWeeks(february, "pl");
  const englishCells = englishWeeks.flat();
  const mondayCells = mondayFirstWeeks.flat();

  assert.equal(englishWeeks.length, 5);
  assert.equal(mondayFirstWeeks.length, 5);
  assert.equal(englishCells.filter(Boolean).length, 29);
  assert.equal(mondayCells.filter(Boolean).length, 29);
  assert.equal(englishCells[0], null);
  assert.equal(englishCells[4]?.getDate(), 1);
  assert.equal(mondayCells[3]?.getDate(), 1);
  assert.equal(englishCells.find((date) => date?.getDate() === 29)?.getMonth(), 1);

  const december = new Date(2026, 11, 1, 12);
  assert.deepEqual(
    [shiftGoalCalendarMonth(december, 1).getFullYear(), shiftGoalCalendarMonth(december, 1).getMonth()],
    [2027, 0],
  );
  const january = new Date(2027, 0, 1, 12);
  assert.deepEqual(
    [shiftGoalCalendarMonth(january, -1).getFullYear(), shiftGoalCalendarMonth(january, -1).getMonth()],
    [2026, 11],
  );
});

test("the selected date is exposed through button state and its press updates the pending date", () => {
  assert.match(calendarSource, /const selected = isSameGoalCalendarDate\(date, value\)/);
  assert.match(calendarSource, /accessibilityRole="button"[\s\S]*?accessibilityState=\{\{ selected \}\}/);
  assert.match(calendarSource, /onPress=\{\(\) => onChange\(date\)\}/);
  assert.match(calendarSource, /const isoDate = goalCalendarDateId\(date\)/);
  assert.match(calendarSource, /testID=\{`goal-calendar-date-\$\{isoDate\}`\}/);
  const selected = new Date(2024, 1, 29, 12);
  assert.equal(isSameGoalCalendarDate(selected, new Date(2024, 1, 29, 8)), true);
  assert.equal(isSameGoalCalendarDate(selected, new Date(2024, 1, 28, 12)), false);
  assert.equal(goalCalendarDateId(selected), "2024-02-29");
});

test("only English starts on Sunday and all other supported locales start on Monday", () => {
  assert.equal(goalCalendarWeekStartsOn("en"), 0);
  for (const locale of locales.filter((candidate) => candidate !== "en")) {
    assert.equal(goalCalendarWeekStartsOn(locale), 1);
  }
});
