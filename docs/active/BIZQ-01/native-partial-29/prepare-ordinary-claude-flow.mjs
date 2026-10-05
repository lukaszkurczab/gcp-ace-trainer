#!/usr/bin/env node
// Builds a private Maestro flow from the immutable active session observed by snapshot-canonical-state.mjs.
// It never creates a session, chooses/reorders questions, or writes app storage.
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { openSync, writeFileSync, closeSync, readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { loadCanonicalRuntimeCatalog } = require("../../../../src/content/canonical/runtimeCatalog.ts");
const { isCanonicalResponseComplete, scoreCanonicalQuestion } = require("../../../../src/content/canonical/questionScoring.ts");
const { runtimeSelectors } = require("../../../../src/testing/runtimeSelectors.ts");

const TRACK_ID = "claude-certified-architect-professional-certification";
const MODE_ID = "certification-focus-practice";
const PREFIX = "patternly:canonical:v1:";
const WORKSPACE_ROOT = resolve(fileURLToPath(new URL("../../../../..", import.meta.url)));
const PRIVATE_ROOTS = ["/private/tmp", process.env.TMPDIR].filter(Boolean).map((value) => resolve(value));

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    if (name === "--snapshot") args.snapshot = argv[++index];
    else if (name === "--session-id") args.sessionId = argv[++index];
    else if (name === "--partial-question-id") args.partialQuestionId = argv[++index];
    else if (name === "--out") args.out = argv[++index];
    else throw new Error("usage: node --import tsx prepare-ordinary-claude-flow.mjs --snapshot /private/tmp/snapshot.json --session-id <observed-id> --out /private/tmp/flow.yaml [--partial-question-id <observed-question-id>]");
  }
  if (!args.snapshot || !args.sessionId || !args.out) throw new Error("snapshot_session_and_private_output_required");
  return args;
}

function assertPrivatePath(path, label) {
  const target = resolve(path);
  if (target === WORKSPACE_ROOT || target.startsWith(`${WORKSPACE_ROOT}${sep}`)) throw new Error(`${label}_must_be_outside_repository`);
  if (!PRIVATE_ROOTS.some((root) => target.startsWith(`${root}${sep}`))) throw new Error(`${label}_must_be_under_private_tmp`);
  return target;
}

function sha256(value) { return createHash("sha256").update(value, "utf8").digest("hex"); }
function parseEnvelope(record, label) {
  if (!record || record.present !== true || typeof record.raw !== "string" || record.sha256 !== sha256(record.raw)) throw new Error(`${label}_snapshot_record_missing_or_hash_mismatch`);
  const envelope = JSON.parse(record.raw);
  if (!envelope || envelope.schemaIdentity !== "patternly:canonical:v1" || !Number.isSafeInteger(envelope.revision) || envelope.revision < 1 || !Object.hasOwn(envelope, "payload")) throw new Error(`${label}_snapshot_record_envelope_invalid`);
  return envelope.payload;
}

function yamlString(value) { return JSON.stringify(value); }
function command(name, value, indent = 0) { return `${" ".repeat(indent)}- ${name}:\n${" ".repeat(indent + 4)}id: ${yamlString(value)}`; }
function scrollVisible(id, direction = "DOWN", percentage = 30, center = false) { return `- scrollUntilVisible:\n    element:\n      id: ${yamlString(id)}\n    direction: ${direction}\n    visibilityPercentage: ${percentage}\n    centerElement: ${center}`; }
function assertVisible(id, indent = 0) { return `${" ".repeat(indent)}- assertVisible:\n${" ".repeat(indent + 4)}id: ${yamlString(id)}`; }
function assertEnabled(id) { return `- assertVisible:\n    id: ${yamlString(id)}\n    enabled: true`; }
const RADIO_UNCHECKED_TEXT = "radio button, unchecked";
const RADIO_CHECKED_TEXT = "radio button, checked, Selected";
const CHECKBOX_UNCHECKED_TEXT = "checkbox, unchecked";
const CHECKBOX_CHECKED_TEXT = "checkbox, checked, Selected";
function optionStateText(interactionType, checked) {
  if (interactionType === "choice_single") return checked ? RADIO_CHECKED_TEXT : RADIO_UNCHECKED_TEXT;
  if (interactionType === "choice_multiple") return checked ? CHECKBOX_CHECKED_TEXT : CHECKBOX_UNCHECKED_TEXT;
  throw new Error("unsupported_option_accessibility_role");
}
function assertOptionChecked(id, interactionType) { return `- assertVisible:\n    id: ${yamlString(id)}\n    text: ${yamlString(optionStateText(interactionType, true))}`; }
function tapOptionUnchecked(id, interactionType) { return `- tapOn:\n    id: ${yamlString(id)}\n    text: ${yamlString(optionStateText(interactionType, false))}`; }
function recoverOptionTap(id, interactionType) { return `- runFlow:\n    when:\n      notVisible:\n        id: ${yamlString(id)}\n        text: ${yamlString(optionStateText(interactionType, true))}\n    commands:\n      - swipe:\n          start: 50%, 70%\n          end: 50%, 45%\n      - tapOn:\n          id: ${yamlString(id)}\n          text: ${yamlString(optionStateText(interactionType, false))}`; }
function waitVisible(id, indent = 0) { return `${" ".repeat(indent)}- extendedWaitUntil:\n${" ".repeat(indent + 4)}visible:\n${" ".repeat(indent + 6)}id: ${yamlString(id)}\n${" ".repeat(indent + 4)}timeout: 20000`; }

const args = parseArgs(process.argv.slice(2));
const snapshotPath = assertPrivatePath(args.snapshot, "snapshot_path");
const outputPath = assertPrivatePath(args.out, "flow_output_path");
const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
if (snapshot.schema !== "bizq01-native29-private-snapshot-v1" || snapshot.profile?.kind !== "guest" || snapshot.profile.transitionActive !== false) throw new Error("snapshot_profile_or_schema_not_supported");
const activePointer = parseEnvelope(snapshot.records.find((entry) => entry.key === `${PREFIX}active-training-session`), "active_session_pointer");
if (activePointer !== args.sessionId) throw new Error("observed_session_is_not_active_pointer");
const session = parseEnvelope(snapshot.records.find((entry) => entry.key === `${PREFIX}training-session:${args.sessionId}`), "active_training_session");
if (session.id !== args.sessionId || session.status !== "active" || session.currentItemIndex !== 0 || session.trackId !== TRACK_ID || session.modeId !== MODE_ID) throw new Error("session_is_not_a_fresh_ordinary_claude_focus_session");
if (session.actualLength !== session.itemOrder?.length || session.requestedLength !== session.actualLength || ![10, 40].includes(session.actualLength)) throw new Error("session_length_does_not_match_ordinary_route");
if ((session.actualLength === 40 && args.partialQuestionId) || (session.actualLength === 10 && !args.partialQuestionId)) throw new Error("partial_target_must_be_absent_for_40_and_present_for_follow_on_10");
const draft = snapshot.records.find((entry) => entry.key === `${PREFIX}active-training-session-draft`);
if (draft?.present) throw new Error("active_draft_must_be_empty_before_answer_flow");
const attempts = snapshot.records.filter((entry) => entry.category === "learning-progress" && entry.key.startsWith(`${PREFIX}training-attempt:`));
if (attempts.some((entry) => parseEnvelope(entry, "training_attempt").sessionId === args.sessionId)) throw new Error("session_already_has_durable_attempts");

const catalog = await loadCanonicalRuntimeCatalog();
const track = catalog.getTrack(TRACK_ID);
if (session.contentVersion !== track.contentVersion || session.artifactSha256 !== track.artifactSha256) throw new Error("session_content_pin_does_not_match_current_canonical_bundle");
track.getMode(MODE_ID);
const questions = session.itemOrder.map((occurrence) => {
  if (occurrence?.item?.trackId !== TRACK_ID || occurrence.item.contentVersion !== session.contentVersion || occurrence.item.artifactSha256 !== session.artifactSha256) throw new Error("session_item_identity_mismatch");
  const question = track.getQuestion(occurrence.item.questionId);
  if (!question || question.trackId !== TRACK_ID) throw new Error("session_question_unavailable_in_pinned_bundle");
  if (question.interaction.type !== "choice_single" && question.interaction.type !== "choice_multiple") throw new Error("ordinary_claude_focus_contains_unsupported_interaction");
  return { occurrence, question };
});
if (new Set(questions.map(({ question }) => question.questionId)).size !== questions.length) throw new Error("session_question_ids_are_not_unique_for_native_selectors");
const partialMatches = args.partialQuestionId ? questions.filter(({ question }) => question.questionId === args.partialQuestionId) : [];
if (args.partialQuestionId && (partialMatches.length !== 1 || partialMatches[0].question.interaction.type !== "choice_multiple")) throw new Error("partial_target_is_not_one_observed_multi_choice_question");

const planned = questions.map(({ occurrence, question }) => {
  let response;
  let selected;
  let expectedResult = "correct";
  if (question.interaction.type === "choice_single") {
    response = { type: "choice_single", optionId: question.answer.optionId };
    selected = [question.answer.optionId];
  } else {
    const isPartialTarget = question.questionId === args.partialQuestionId;
    if (isPartialTarget) {
      if (question.answer.optionIds.length < 2) throw new Error("partial_target_has_fewer_than_two_accepted_choices");
      selected = [question.answer.optionIds[0]];
      response = { type: "choice_multiple", optionIds: selected };
      expectedResult = "partial";
    } else {
      selected = [...question.answer.optionIds];
      response = { type: "choice_multiple", optionIds: selected };
    }
  }
  if (!isCanonicalResponseComplete(question, response)) throw new Error("planned_response_is_not_complete");
  const scored = scoreCanonicalQuestion(question, response);
  if (scored.kind !== expectedResult) throw new Error("authored_response_does_not_produce_expected_result");
  const plannedOptionIds = session.optionOrderByOccurrence?.[occurrence.occurrenceId];
  if (!Array.isArray(plannedOptionIds) || plannedOptionIds.length !== question.interaction.options.length || new Set(plannedOptionIds).size !== plannedOptionIds.length || plannedOptionIds.some((id) => !question.interaction.options.some((option) => option.optionId === id))) throw new Error("saved_option_order_does_not_match_pinned_question");
  return { questionId: question.questionId, occurrenceId: occurrence.occurrenceId, selectedOptionIds: selected, expectedResult, interactionType: question.interaction.type };
});
if (args.partialQuestionId && planned.filter((item) => item.expectedResult === "partial").length !== 1) throw new Error("exactly_one_partial_response_required");

const lines = [
  "appId: com.lkurczab.patternly",
  `name: ${yamlString(`BIZQ01 ordinary Claude ${session.actualLength} ${args.partialQuestionId ? "partial" : "correct"} ${session.id}`)}`,
  "---",
  assertVisible(runtimeSelectors.session.root(session.id)),
];
for (let index = 0; index < planned.length; index += 1) {
  const item = planned[index];
  lines.push(assertVisible(runtimeSelectors.session.counter(session.id, index + 1, planned.length)));
  lines.push(scrollVisible(runtimeSelectors.session.question(item.questionId), "UP", 20));
  for (const optionId of item.selectedOptionIds) {
    const optionSelector = runtimeSelectors.session.option(item.questionId, optionId);
    lines.push(scrollVisible(optionSelector, "DOWN", 100, false));
    lines.push(tapOptionUnchecked(optionSelector, item.interactionType));
    lines.push(recoverOptionTap(optionSelector, item.interactionType));
    lines.push(assertOptionChecked(optionSelector, item.interactionType));
  }
  lines.push(assertEnabled(runtimeSelectors.session.submit(item.questionId)));
  lines.push(command("tapOn", runtimeSelectors.session.submit(item.questionId)));
  lines.push(scrollVisible(runtimeSelectors.session.result(item.questionId, item.expectedResult), "DOWN", 20));
  if (item.expectedResult === "partial") lines.push(`- takeScreenshot: native29-claude-partial-${item.questionId}`);
  lines.push(command("tapOn", runtimeSelectors.session.continue(item.questionId)));
  if (index < planned.length - 1) lines.push(scrollVisible(runtimeSelectors.session.question(planned[index + 1].questionId), "UP", 20));
}
lines.push(waitVisible(runtimeSelectors.summary.root(session.id)));
const flow = `${lines.join("\n")}\n`;
let descriptor;
try {
  descriptor = openSync(outputPath, "wx", 0o600);
  writeFileSync(descriptor, flow, { encoding: "utf8" });
  closeSync(descriptor);
} catch {
  if (descriptor !== undefined) try { closeSync(descriptor); } catch {}
  throw new Error("private_flow_write_failed");
}
const planHash = sha256(planned.map((item) => `${item.occurrenceId}\0${item.questionId}\0${item.selectedOptionIds.join(",")}\0${item.expectedResult}`).join("\n"));
console.log(JSON.stringify({ status: "private_flow_written", sessionLength: planned.length, interactionTypes: { choice_single: questions.filter((item) => item.question.interaction.type === "choice_single").length, choice_multiple: questions.filter((item) => item.question.interaction.type === "choice_multiple").length }, partialItemCount: planned.filter((item) => item.expectedResult === "partial").length, authoredAnswerPlanSha256: planHash, contentVersion: session.contentVersion, artifactSha256: session.artifactSha256, output: "private_path_written" }));
