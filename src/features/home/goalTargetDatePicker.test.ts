import assert from "node:assert/strict";
import test from "node:test";

import { targetDatePickerValue, targetDateToLocalIso } from "./goalTargetDatePicker";

test("saved ISO dates initialize the native picker at local noon and preserve leap days", () => {
  const value = targetDatePickerValue("2024-02-29", new Date(2026, 0, 15, 8));
  assert.equal(value.getFullYear(), 2024);
  assert.equal(value.getMonth(), 1);
  assert.equal(value.getDate(), 29);
  assert.equal(value.getHours(), 12);
  assert.equal(targetDateToLocalIso(value), "2024-02-29");
});

test("empty dates initialize to device-local today at noon", () => {
  const now = new Date(2026, 6, 9, 23, 45);
  const value = targetDatePickerValue("", now);
  assert.equal(value.getFullYear(), 2026);
  assert.equal(value.getMonth(), 6);
  assert.equal(value.getDate(), 9);
  assert.equal(value.getHours(), 12);
});

test("non-empty saved dates must satisfy the persisted ISO calendar-date contract", () => {
  assert.throws(() => targetDatePickerValue("2026-02-29", new Date(2026, 0, 15)), RangeError);
  assert.throws(() => targetDatePickerValue("not-a-date", new Date(2026, 0, 15)), RangeError);
});

test("local calendar dates round-trip across a daylight-saving transition", () => {
  const originalTimezone = process.env.TZ;
  process.env.TZ = "Europe/Warsaw";
  try {
    const before = targetDatePickerValue("2026-03-28", new Date());
    const transition = targetDatePickerValue("2026-03-29", new Date());
    const after = targetDatePickerValue("2026-03-30", new Date());
    assert.equal(before.getHours(), 12);
    assert.equal(transition.getHours(), 12);
    assert.equal(after.getHours(), 12);
    assert.equal(transition.getTime() - before.getTime(), 23 * 60 * 60 * 1000);
    assert.equal(after.getTime() - transition.getTime(), 24 * 60 * 60 * 1000);
    assert.equal(targetDateToLocalIso(before), "2026-03-28");
    assert.equal(targetDateToLocalIso(transition), "2026-03-29");
    assert.equal(targetDateToLocalIso(after), "2026-03-30");
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});
