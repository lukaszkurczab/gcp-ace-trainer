import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import i18n from "../../i18n";
import enLearningPlan from "../../locales/en/learningPlan.json";
import plLearningPlan from "../../locales/pl/learningPlan.json";
import type {
  GuidanceAction,
  GuidanceFact,
  GuidanceMessageKey,
  TargetDateGuidance,
  TargetDateGuidanceReason,
  TargetDateGuidanceState,
} from "./targetDateGuidance";
import {
  presentTargetDateGuidance,
  TargetDateGuidancePresentationError,
  type TargetDateGuidanceLocale,
} from "./targetDateGuidancePresentation";

const TARGET = "2026-02-01";

const messageKeys: Record<string, GuidanceMessageKey> = {
  no_goal: "targetDateGuidance.noGoal",
  goal_paused: "targetDateGuidance.goalPaused",
  no_plan: "targetDateGuidance.noPlan",
  target_changed: "targetDateGuidance.updateRequired.targetChanged",
  package_changed: "targetDateGuidance.updateRequired.packageChanged",
  cadence_changed: "targetDateGuidance.updateRequired.cadenceChanged",
  plan_paused: "targetDateGuidance.planPaused",
  completed: "targetDateGuidance.completed",
  overdue: "targetDateGuidance.overdue",
  insufficient_sessions: "targetDateGuidance.unreachable.insufficientSessions",
  no_future_slots: "targetDateGuidance.unreachable.noFutureSlots",
  at_risk: "targetDateGuidance.atRisk",
  on_track: "targetDateGuidance.onTrack",
  no_target: "targetDateGuidance.openEnded",
  unknown_completion_rule: "targetDateGuidance.unavailable.unknownCompletionRule",
  insufficient_elapsed_evidence: "targetDateGuidance.unavailable.insufficientElapsedEvidence",
  calculation_error: "targetDateGuidance.unavailable.calculationError",
};

const primaryKinds: Record<TargetDateGuidanceState, GuidanceAction["kind"]> = {
  no_goal: "set_goal",
  goal_paused: "adjust_goal",
  no_plan: "create_plan",
  update_required: "review_updated_plan",
  plan_paused: "resume_plan",
  completed: "view_progress",
  overdue: "adjust_goal",
  unreachable: "adjust_schedule",
  at_risk: "start_next_session",
  on_track: "start_next_session",
  open_ended: "continue_plan",
  unavailable: "adjust_goal",
};

const destinations: Record<GuidanceAction["kind"], GuidanceAction["destination"]> = {
  set_goal: "GoalCadence",
  adjust_goal: "GoalCadence",
  create_plan: "LearningPlanProposal",
  review_updated_plan: "LearningPlanProposal",
  resume_plan: "LearningPlanEditor",
  adjust_schedule: "LearningPlanEditor",
  view_progress: "Progress",
  start_next_session: "Practice",
  continue_plan: "Practice",
  try_again: "TargetDateGuidanceRecompute",
};

const tones: Record<TargetDateGuidanceState, TargetDateGuidance["tone"]> = {
  no_goal: "neutral",
  goal_paused: "muted",
  no_plan: "neutral",
  update_required: "warning",
  plan_paused: "muted",
  completed: "positive",
  overdue: "danger",
  unreachable: "danger",
  at_risk: "warning",
  on_track: "positive",
  open_ended: "neutral",
  unavailable: "neutral",
};

function unavailable(reason: Extract<GuidanceFact, { kind: "unavailable" }>["reason"]): GuidanceFact {
  return { kind: "unavailable", reason };
}

function numeric(value: number): GuidanceFact {
  return { kind: "numeric", value, unit: "questions_per_week" };
}

function date(value = TARGET): GuidanceFact {
  return { kind: "date", value };
}

function text(value: Extract<GuidanceFact, { kind: "text" }>["value"]): GuidanceFact {
  return { kind: "text", value };
}

function availableFacts(overrides: Partial<TargetDateGuidance["facts"]> = {}): TargetDateGuidance["facts"] {
  return {
    requiredPace: numeric(4),
    actualPace: numeric(3.5),
    forecast: date("2026-01-30"),
    target: date(),
    ...overrides,
  };
}

function guidance(
  state: TargetDateGuidanceState,
  reason: TargetDateGuidanceReason,
  facts: TargetDateGuidance["facts"],
  overrides: Partial<Pick<TargetDateGuidance, "tone" | "messageKey">> = {},
): TargetDateGuidance {
  const primaryKind = state === "unavailable"
    ? reason === "calculation_error" ? "try_again" : reason === "insufficient_elapsed_evidence" ? "continue_plan" : "adjust_goal"
    : primaryKinds[state];
  const primary = { kind: primaryKind, destination: destinations[primaryKind] } as GuidanceAction;
  const secondary = state === "at_risk"
    ? ({ kind: "adjust_schedule", destination: "LearningPlanEditor" } as const)
    : state === "unreachable"
      ? ({ kind: "adjust_goal", destination: "GoalCadence" } as const)
      : null;
  return {
    state,
    reason,
    tone: overrides.tone ?? (state === "unavailable" && reason === "calculation_error" ? "warning" : tones[state]),
    messageKey: overrides.messageKey ?? (state === "unavailable" && reason === "no_target" ? "targetDateGuidance.unavailable.noTarget" : messageKeys[reason]!),
    home: { primary },
    progress: { primary, secondary },
    facts,
  };
}

function allGuidances(): readonly TargetDateGuidance[] {
  const values: TargetDateGuidance[] = [
    guidance("no_goal", "no_goal", { requiredPace: unavailable("no_goal"), actualPace: unavailable("no_goal"), forecast: unavailable("no_goal"), target: unavailable("no_goal") }),
    guidance("goal_paused", "goal_paused", { requiredPace: unavailable("goal_paused"), actualPace: unavailable("goal_paused"), forecast: unavailable("goal_paused"), target: unavailable("goal_paused") }),
    guidance("no_plan", "no_plan", { requiredPace: unavailable("no_plan"), actualPace: unavailable("no_plan"), forecast: unavailable("no_plan"), target: unavailable("no_plan") }),
    guidance("update_required", "target_changed", { requiredPace: unavailable("update_required"), actualPace: unavailable("update_required"), forecast: unavailable("update_required"), target: unavailable("update_required") }),
    guidance("update_required", "package_changed", { requiredPace: unavailable("update_required"), actualPace: unavailable("update_required"), forecast: unavailable("update_required"), target: unavailable("update_required") }),
    guidance("update_required", "cadence_changed", { requiredPace: unavailable("update_required"), actualPace: unavailable("update_required"), forecast: unavailable("update_required"), target: unavailable("update_required") }),
    guidance("plan_paused", "plan_paused", { requiredPace: unavailable("plan_paused"), actualPace: unavailable("plan_paused"), forecast: unavailable("plan_paused"), target: date() }),
    guidance("completed", "completed", { requiredPace: unavailable("completed"), actualPace: unavailable("completed"), forecast: text("completed"), target: date() }),
    guidance("overdue", "overdue", availableFacts()),
    guidance("unreachable", "insufficient_sessions", availableFacts({ target: date() })),
    guidance("unreachable", "no_future_slots", { requiredPace: unavailable("no_future_slots"), actualPace: unavailable("no_future_slots"), forecast: unavailable("no_future_slots"), target: date() }),
    guidance("at_risk", "at_risk", availableFacts()),
    guidance("on_track", "on_track", availableFacts()),
    guidance("open_ended", "no_target", { requiredPace: text("flexible"), actualPace: text("flexible"), forecast: text("flexible"), target: text("no_target_date") }),
    guidance("unavailable", "unknown_completion_rule", { requiredPace: unavailable("unknown_completion_rule"), actualPace: unavailable("unknown_completion_rule"), forecast: unavailable("unknown_completion_rule"), target: date() }),
    guidance("unavailable", "insufficient_elapsed_evidence", { requiredPace: unavailable("insufficient_elapsed_evidence"), actualPace: unavailable("insufficient_elapsed_evidence"), forecast: unavailable("insufficient_elapsed_evidence"), target: date() }),
    guidance("unavailable", "calculation_error", { requiredPace: unavailable("calculation_error"), actualPace: unavailable("calculation_error"), forecast: unavailable("calculation_error"), target: date() }),
    guidance("unavailable", "no_target", { requiredPace: unavailable("no_target"), actualPace: unavailable("no_target"), forecast: unavailable("no_target"), target: date() }),
  ];
  return values;
}

function present(value: TargetDateGuidance, locale: TargetDateGuidanceLocale = "en", timezone = "Europe/Warsaw") {
  return presentTargetDateGuidance({ guidance: value, locale, timezone });
}

function assertPresentationError(action: () => unknown, code: string): void {
  assert.throws(action, (error: unknown) => error instanceof TargetDateGuidancePresentationError && error.code === code);
}

test("maps every guidance state, reason, message key, action and fact variant", () => {
  for (const value of allGuidances()) {
    for (const locale of ["en", "pl"] as const) {
      const output = present(value, locale);
      assert.equal(output.state, value.state);
      assert.equal(output.reason, value.reason);
      assert.equal(output.message.length > 0, true);
      assert.equal(output.primaryLabel.length > 0, true);
      assert.equal(output.facts.length, 4);
      assert.deepEqual(output.facts.map((fact) => fact.key), ["requiredPace", "actualPace", "forecast", "target"]);
      assert.ok(output.facts.every((fact) => fact.label.length > 0 && fact.value.length > 0 && fact.value !== "-" && fact.value !== "Unavailable" && fact.value !== "Niedostępne"));
      assert.equal(Object.isFrozen(output), true);
      assert.equal(Object.isFrozen(output.facts), true);
      assert.ok(output.facts.every((fact) => Object.isFrozen(fact)));
      assert.equal(value.state === "at_risk" || value.state === "unreachable", output.secondaryLabel !== null);
    }
  }
});

test("accepts canonical overdue guidance with an unavailable forecast", () => {
  const value = guidance("overdue", "overdue", {
    requiredPace: unavailable("insufficient_elapsed_evidence"),
    actualPace: unavailable("insufficient_elapsed_evidence"),
    forecast: unavailable("insufficient_elapsed_evidence"),
    target: date(),
  });
  const output = present(value, "en");
  assert.equal(output.state, "overdue");
  assert.equal(output.facts[0]?.value, "Not enough history");
  assert.equal(output.facts[1]?.value, "Not enough history");
  assert.equal(output.facts[2]?.value, "Not enough history");
  assert.equal(output.facts[3]?.value, "February 1, 2026");
  assert.equal(output.secondaryLabel, null);
  assertPresentationError(() => present({ ...value, facts: { ...value.facts, actualPace: numeric(3) } } as TargetDateGuidance), "inconsistent_guidance");
});

test("covers no-target text facts for paused and completed states", () => {
  const paused = present(guidance("plan_paused", "plan_paused", {
    requiredPace: unavailable("plan_paused"),
    actualPace: unavailable("plan_paused"),
    forecast: unavailable("plan_paused"),
    target: text("no_target_date"),
  }), "pl");
  assert.equal(paused.facts[3]?.value, "Brak daty docelowej");

  const completed = present(guidance("completed", "completed", {
    requiredPace: unavailable("completed"),
    actualPace: unavailable("completed"),
    forecast: text("completed"),
    target: text("goal_complete"),
  }), "pl");
  assert.equal(completed.facts[2]?.value, "Ukończono");
  assert.equal(completed.facts[3]?.value, "Cel ukończony");
});

test("uses native English and Polish plural categories for pace facts", () => {
  const enOne = present(guidance("on_track", "on_track", availableFacts({ requiredPace: numeric(1), actualPace: numeric(2) })), "en");
  const enOther = present(guidance("on_track", "on_track", availableFacts({ requiredPace: numeric(2), actualPace: numeric(1.5) })), "en");
  assert.equal(enOne.facts[0]?.value, "1 question per week");
  assert.equal(enOther.facts[0]?.value, "2 questions per week");

  const plOne = present(guidance("on_track", "on_track", availableFacts({ requiredPace: numeric(1), actualPace: numeric(1) })), "pl");
  const plFew = present(guidance("on_track", "on_track", availableFacts({ requiredPace: numeric(2), actualPace: numeric(3) })), "pl");
  const plMany = present(guidance("on_track", "on_track", availableFacts({ requiredPace: numeric(5), actualPace: numeric(5) })), "pl");
  const plOther = present(guidance("on_track", "on_track", availableFacts({ requiredPace: numeric(1.5), actualPace: numeric(1.5) })), "pl");
  assert.equal(plOne.facts[0]?.value, "1 pytanie tygodniowo");
  assert.equal(plFew.facts[0]?.value, "2 pytania tygodniowo");
  assert.equal(plMany.facts[0]?.value, "5 pytań tygodniowo");
  assert.equal(plOther.facts[0]?.value, "1.5 pytania tygodniowo");
});

test("formats civil dates in the supplied timezone without UTC day drift", () => {
  const value = guidance("on_track", "on_track", availableFacts({ forecast: date("2026-02-01"), target: date("2026-02-01") }));
  const en = present(value, "en", "America/Los_Angeles");
  const pl = present(value, "pl", "Pacific/Kiritimati");
  assert.equal(en.facts[2]?.value, "February 1, 2026");
  assert.equal(en.facts[3]?.value, "February 1, 2026");
  assert.equal(pl.facts[2]?.value, "1 lutego 2026");
  assert.equal(pl.facts[3]?.value, "1 lutego 2026");
});

test("rejects invalid locale, timezone, date and unknown runtime variants explicitly", () => {
  const value = allGuidances()[12]!;
  assertPresentationError(() => present(value, "de" as TargetDateGuidanceLocale), "invalid_locale");
  assertPresentationError(() => present(value, "en", "Mars/Olympus"), "invalid_timezone");
  assertPresentationError(() => present({ ...value, facts: { ...value.facts, forecast: { kind: "date", value: "2026-02-31" } } } as TargetDateGuidance), "invalid_date");
  assertPresentationError(() => present({ ...value, state: "future" } as unknown as TargetDateGuidance), "unknown_state");
  assertPresentationError(() => present({ ...value, reason: "future" } as unknown as TargetDateGuidance), "unknown_reason");
  assertPresentationError(() => present({ ...value, messageKey: "future.key" } as unknown as TargetDateGuidance), "unknown_message_key");
  assertPresentationError(() => present({ ...value, progress: { ...value.progress, primary: { kind: "future", destination: "Practice" } } } as unknown as TargetDateGuidance), "unknown_action");
  assertPresentationError(() => present({ ...value, tone: "muted" } as unknown as TargetDateGuidance), "unknown_tone");
  assertPresentationError(() => present({ ...value, progress: { ...value.progress, primary: { kind: "start_next_session", destination: "GoalCadence" } } } as unknown as TargetDateGuidance), "unknown_action_destination");
  assertPresentationError(() => present({ ...value, facts: { ...value.facts, requiredPace: { kind: "numeric", value: 4, unit: "minutes" } } } as unknown as TargetDateGuidance), "unknown_fact_unit");
  assertPresentationError(() => present({ ...allGuidances()[7]!, facts: { ...allGuidances()[7]!.facts, forecast: { kind: "text", value: "future" } } } as unknown as TargetDateGuidance), "unknown_fact_text");
  assertPresentationError(() => present({ ...value, facts: { ...value.facts, forecast: { kind: "future", value: "x" } } } as unknown as TargetDateGuidance), "unknown_fact_kind");
  assertPresentationError(() => present({ ...value, facts: { ...value.facts, forecast: { kind: "unavailable", reason: "future" } } } as unknown as TargetDateGuidance), "unknown_fact_reason");
});

test("rejects a secondary action outside its two allowed states and inconsistent missing secondary", () => {
  const onTrack = allGuidances()[12]!;
  assertPresentationError(() => present({ ...onTrack, progress: { ...onTrack.progress, secondary: { kind: "adjust_schedule", destination: "LearningPlanEditor" } } } as TargetDateGuidance), "inconsistent_guidance");
  const atRisk = allGuidances()[11]!;
  assertPresentationError(() => present({ ...atRisk, progress: { ...atRisk.progress, secondary: null } } as TargetDateGuidance), "inconsistent_guidance");
});

test("fails closed for missing translations and unresolved placeholders", () => {
  const value = allGuidances()[12]!;
  const originalPlural = enLearningPlan["targetDateGuidance.fact.questionsPerWeek_other"];
  i18n.removeResourceBundle("en", "learningPlan");
  try {
    assertPresentationError(() => present(value, "en"), "missing_translation");
  } finally {
    i18n.addResourceBundle("en", "learningPlan", enLearningPlan, true, true);
  }
  i18n.addResource("en", "learningPlan", "targetDateGuidance.fact.questionsPerWeek_other", "{{missing}}", { silent: true });
  try {
    assertPresentationError(() => present(value, "en"), "invalid_translation");
  } finally {
    i18n.addResource("en", "learningPlan", "targetDateGuidance.fact.questionsPerWeek_other", originalPlural, { silent: true });
  }
});

test("fails closed when the selected English or Polish plural suffix is missing", () => {
  const value = allGuidances()[12]!;
  const enKey = "targetDateGuidance.fact.questionsPerWeek_other";
  const plKey = "targetDateGuidance.fact.questionsPerWeek_few";
  const originalEn = enLearningPlan[enKey]!;
  const originalPl = plLearningPlan[plKey]!;

  i18n.addResource("en", "learningPlan", enKey, undefined as unknown as string, { silent: true });
  try {
    assertPresentationError(() => present(value, "en"), "missing_translation");
  } finally {
    i18n.addResource("en", "learningPlan", enKey, originalEn, { silent: true });
  }

  i18n.addResource("pl", "learningPlan", plKey, undefined as unknown as string, { silent: true });
  try {
    assertPresentationError(() => present(value, "pl"), "missing_translation");
  } finally {
    i18n.addResource("pl", "learningPlan", plKey, originalPl, { silent: true });
  }
});

test("does not mutate guidance input and keeps the presentation deeply immutable", () => {
  const value = allGuidances()[11]!;
  const before = structuredClone(value);
  const output = present(value, "en");
  assert.deepEqual(value, before);
  assert.equal(Object.isFrozen(output), true);
  assert.equal(Object.isFrozen(output.facts), true);
  assert.equal(Object.isFrozen(output.facts[0]), true);
  assert.equal(Object.isFrozen(output.facts[0]?.label), true);
});

test("keeps locale resource keys flat and exactly in parity", () => {
  const en = JSON.parse(readFileSync("src/locales/en/learningPlan.json", "utf8")) as Record<string, unknown>;
  const pl = JSON.parse(readFileSync("src/locales/pl/learningPlan.json", "utf8")) as Record<string, unknown>;
  assert.deepEqual(Object.keys(pl).sort(), Object.keys(en).sort());
  for (const key of Object.keys(en)) assert.equal(typeof en[key], "string");
  for (const key of Object.keys(pl)) assert.equal(typeof pl[key], "string");
  assert.equal(Object.keys(en).some((key) => key.includes(".")), true);
  assert.equal(Object.values(en).some((value) => typeof value === "string" && value.includes("{{count}}")), true);
  assert.equal(Object.values(pl).some((value) => typeof value === "string" && value.includes("{{count}}")), true);
});
