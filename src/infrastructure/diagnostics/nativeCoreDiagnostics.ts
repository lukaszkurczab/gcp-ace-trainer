/**
 * B0 native core verification in the Release perf build (Plan T1.1 "done" 1 and 3).
 *
 * Runs only in the Release perf build bundled with the native-core diagnostic
 * flag (installNativeCore.ts schedules it behind a compile-time gate; other
 * bundles drop this module and the vector file). It:
 *  1. replays every applicable T1.0 vector through the native object and through
 *     the accelerated domain functions;
 *  2. compares 10 000 random structures: accelerated domain path vs the TS
 *     reference executed in Hermes (the in-app oracle, including Hermes NFC);
 *  3. runs the `Analiza-technologii.md` §1.3 microbenchmark (history 100 sessions,
 *     one answer plan, content 10.8 MB) with the reference and the accelerated path.
 * The result is written to `<Documents>/perf-trace/native-core-<epoch>.json`.
 */
import { canonicalFingerprintPayload, canonicalJsonV1, canonicalSerialize, referenceCanonicalJsonV1, referenceCanonicalSerialize, CANONICAL_SERIALIZER_VERSION } from "../../domain/identity/canonicalSerialization";
import { recordFingerprintPayload, referenceRecordFingerprintPayload, type RecordFingerprintInput } from "../../domain/identity/recordFingerprint";
import { referenceSha256Utf8, sha256Utf8 } from "../../domain/identity/sha256";
import { getNativeCore, getNativeCoreStatus, NATIVE_CORE_PROFILE, type NativeCore } from "../identity/installNativeCore";
import { createRandom, generateFuzzCase, type FuzzProfile } from "./nativeCoreFuzz";

declare const require: (path: string) => unknown;
const now = () => globalThis.performance.now();

type Vector = Readonly<{
  id: string; profile: string; nativeApplicable: boolean;
  input: Readonly<{ json?: string; raw?: string; string?: string; repeat?: Readonly<{ unit: string; count: number }> }>;
  expect: Readonly<Record<string, unknown> & { ok: boolean; error?: Readonly<{ code: string }> }>;
}>;

function runVectors(native: NativeCore) {
  const file = require("../../../integration/contracts/identity-parity/vectors.v1.json") as { vectors: Vector[] };
  let checked = 0;
  const failures: string[] = [];
  const fail = (id: string, detail: string) => { if (failures.length < 50) failures.push(`${id}: ${detail}`.slice(0, 300)); };
  for (const vector of file.vectors) {
    if (!vector.nativeApplicable) continue;
    checked++;
    const expect = vector.expect;
    try {
      if (vector.profile === "sha256Utf8") {
        const value = vector.input.repeat ? vector.input.repeat.unit.repeat(vector.input.repeat.count) : vector.input.string!;
        if (native.sha256(value) !== expect.sha256) fail(vector.id, "native sha256");
        if (sha256Utf8(value) !== expect.sha256) fail(vector.id, "domain sha256");
        continue;
      }
      if (vector.profile === "envelope") {
        const code = native.validateEnvelope(vector.input.raw!);
        if (expect.ok ? code !== "ok" : code !== expect.error!.code) fail(vector.id, `envelope ${code}`);
        continue;
      }
      const profile = NATIVE_CORE_PROFILE[vector.profile as keyof typeof NATIVE_CORE_PROFILE];
      const json = vector.input.json!;
      const nativeOut = native.serialize(profile, json);
      const expected = (vector.profile === "recordFingerprintPayload" ? expect.payload : expect.output) as string | undefined;
      if (expect.ok) {
        // `undefined` is allowed only as an NFC fallback (native NFC disabled at install).
        if (nativeOut !== expected && !(nativeOut === undefined && native.lastError() === "nfc_unavailable")) fail(vector.id, `native ${String(nativeOut).slice(0, 120)} (${native.lastError()})`);
        const digest = expect.sha256 ?? expect.fingerprint;
        if (digest !== undefined && nativeOut !== undefined && native.fingerprint(profile, json) !== digest) fail(vector.id, "native fingerprint");
        const value = JSON.parse(json) as unknown;
        const domain = vector.profile === "canonicalSerialize" ? canonicalSerialize(value)
          : vector.profile === "canonicalFingerprintPayload" ? canonicalFingerprintPayload(value)
          : vector.profile === "canonicalJsonV1" ? canonicalJsonV1(value)
          : recordFingerprintPayload(value as RecordFingerprintInput);
        if (domain !== expected) fail(vector.id, "accelerated domain");
      } else if (nativeOut !== undefined || native.lastError() !== expect.error!.code) {
        fail(vector.id, `expected ${expect.error!.code}, native ${String(nativeOut).slice(0, 80)} / ${native.lastError()}`);
      }
    } catch (error) {
      fail(vector.id, `threw ${String(error)}`);
    }
  }
  return { checked, failed: failures.length, failures };
}

// Identity-domain failures carry a closed set of code messages (canonicalSerialization.ts,
// recordFingerprint.ts). Only those are written to the report; any other failure is
// reduced to its name plus a digest, which keeps exact-equality comparison without
// writing raw operational text (validate:runtime-privacy-boundary, T1.1b).
const IDENTITY_FAILURE_CODE = /^(?:(?:canonical_json|record_fingerprint)_[a-z_]+|Canonical values cannot contain (?:non-finite numbers|unsupported values)\.)$/u;

function failureOutcome(thrown: unknown): string {
  if (!(thrown instanceof Error)) return `error:${typeof thrown}:${referenceSha256Utf8(String(thrown)).slice(0, 16)}`;
  const text = thrown.message;
  return IDENTITY_FAILURE_CODE.test(text) ? `error:${text}` : `error:${thrown.name}:${referenceSha256Utf8(text).slice(0, 16)}`;
}

function outcome(run: () => string): string {
  try { return `ok:${run()}`; } catch (thrown) { return failureOutcome(thrown); }
}

function runFuzz(cases: number) {
  const random = createRandom(0x7111);
  let mismatches = 0;
  const examples: string[] = [];
  const byProfile: Record<string, number> = {};
  for (let index = 0; index < cases; index++) {
    const { profile, value } = generateFuzzCase(random);
    byProfile[profile] = (byProfile[profile] ?? 0) + 1;
    const pair: Record<FuzzProfile, [() => string, () => string]> = {
      canonicalSerialize: [() => referenceCanonicalSerialize(value), () => canonicalSerialize(value)],
      canonicalFingerprintPayload: [() => referenceCanonicalSerialize({ serializerVersion: CANONICAL_SERIALIZER_VERSION, value }), () => canonicalFingerprintPayload(value)],
      recordFingerprintPayload: [() => referenceRecordFingerprintPayload(value as RecordFingerprintInput), () => recordFingerprintPayload(value as RecordFingerprintInput)],
      canonicalJsonV1: [() => referenceCanonicalJsonV1(value), () => canonicalJsonV1(value)],
      sha256Utf8: [() => referenceSha256Utf8(value as string), () => sha256Utf8(value as string)],
    };
    const [reference, accelerated] = pair[profile];
    const expected = outcome(reference);
    const actual = outcome(accelerated);
    if (expected !== actual) {
      mismatches++;
      if (examples.length < 10) examples.push(`${profile} ${JSON.stringify(value).slice(0, 200)} expected ${expected.slice(0, 150)} actual ${actual.slice(0, 150)}`);
    }
  }
  return { cases, mismatches, byProfile, examples };
}

// ---- Microbenchmark (port of blackbox/evidence/tech/src/{generate,kernel}.mjs) ----

const SHA = /^[a-f0-9]{64}$/u;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/u;
const WS = /^\s|\s$/u;
type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const isSafeId = (v: unknown) => typeof v === "string" && v.length > 0 && v !== "." && v !== ".." && !WS.test(v) && !/[\\/\u0000]/u.test(v);
const REF_KEYS = ["trackId", "questionId", "contentVersion", "artifactSha256"];
const exactKeys = (d: Json, keys: string[]) => { const k = Object.keys(d); return k.length === keys.length && keys.every((x) => Object.hasOwn(d, x)); };
const validRef = (v: unknown) => isObj(v) && exactKeys(v, REF_KEYS) && isSafeId(v.trackId) && isSafeId(v.questionId) && isSafeId(v.contentVersion) && typeof v.artifactSha256 === "string" && SHA.test(v.artifactSha256);
type Serialize = (value: unknown) => string;
function validPayload(kind: string, p: Json, serialize: Serialize): boolean {
  if (kind === "index") return Array.isArray(p.ids) && p.ids.every(isSafeId);
  if (kind === "review") return isSafeId(p.id) && validRef(p.item) && typeof p.reason === "string" && ISO.test(String(p.dueAt));
  if (kind === "attempt") {
    for (const k of ["id", "sessionId", "trackId", "modeId", "occurrenceId"]) if (!isSafeId(p[k])) return false;
    const ev = p.reviewEvidence as Json;
    return validRef(p.item) && isObj(ev) && validRef(ev.sourceItem) && serialize(ev.sourceItem) === serialize(p.item) && Array.isArray(ev.taxonomyOrSkillRefs)
      && isObj(p.result) && typeof p.result.kind === "string" && ISO.test(String(p.answeredAt)) && ISO.test(String(p.committedAt));
  }
  for (const k of ["id", "trackId", "modeId", "contentVersion"]) if (!isSafeId(p[k])) return false;
  if (!Array.isArray(p.itemOrder) || !isObj(p.optionOrderByOccurrence) || !SHA.test(String(p.artifactSha256)) || !ISO.test(String(p.startedAt))) return false;
  const seen = new Set<string>();
  for (const o of p.itemOrder as Json[]) {
    if (!isObj(o) || !isSafeId(o.occurrenceId) || !validRef(o.item) || seen.has(o.occurrenceId as string)) return false;
    seen.add(o.occurrenceId as string);
    const oo = (p.optionOrderByOccurrence as Json)[o.occurrenceId as string];
    if (!Array.isArray(oo) || !oo.every(isSafeId)) return false;
  }
  return true;
}
const validEnvelope = (v: unknown): Json | null => isObj(v) && Object.keys(v).length === 3 && typeof v.schemaIdentity === "string" && Number.isSafeInteger(v.revision) && (v.revision as number) >= 1 && isObj(v.payload) ? v.payload : null;

type Artifact = { trackId: string; contentVersion: string; questions: Json[] };
function buildPayloads(artifact: Artifact, artifactText: string, hash: (s: string) => string) {
  const SESSIONS = 100;
  const trackId = artifact.trackId, contentVersion = artifact.contentVersion;
  const artifactSha256 = hash(artifactText);
  const iso = (ms: number) => new Date(ms).toISOString();
  const env = (payload: unknown, revision = 1) => JSON.stringify({ schemaIdentity: "patternly-canonical-record-v1", revision, payload });
  const qs = artifact.questions.filter((q) => (q.interaction as Json | undefined)?.type === "choice_single");
  let qi = 0;
  const records: { key: string; kind: string; raw: string }[] = [];
  const attemptIds: string[] = [], sessionIds: string[] = [], reviewIds: string[] = [];
  const t0 = Date.parse("2026-06-01T08:00:00.000Z");
  for (let s = 0; s < SESSIONS; s++) {
    const sessionId = `session-${s.toString().padStart(4, "0")}-6f1c2a`;
    const start = t0 + s * 86_400_000;
    const itemOrder: Json[] = [], optionOrderByOccurrence: Json = {};
    const picks: { q: Json; item: Json; occurrenceId: string }[] = [];
    for (let i = 0; i < 10; i++) {
      const q = qs[(qi++) % qs.length]!;
      const occurrenceId = `${sessionId}:occ:${i}`;
      const item = { trackId, questionId: q.questionId, contentVersion, artifactSha256 };
      itemOrder.push({ occurrenceId, item });
      optionOrderByOccurrence[occurrenceId] = ((q.interaction as Json).options as Json[]).map((o) => o.optionId);
      picks.push({ q, item, occurrenceId });
    }
    const session = {
      id: sessionId, trackId, modeId: "coding-interview-guided-practice",
      configurationSnapshot: { feedbackTiming: "after_each_answer", sessionLength: 10, scope: ["current_mental_units"] },
      requestedLength: 10, actualLength: 10, currentItemIndex: 9, itemOrder, optionOrderByOccurrence,
      activeForegroundMs: 56_000 + s, contentVersion, artifactSha256, taxonomyVersion: "dsa-taxonomy-v3",
      planFingerprint: hash(sessionId), status: "completed", startedAt: iso(start), completedAt: iso(start + 600_000),
    };
    records.push({ key: `session:${sessionId}`, kind: "session", raw: env(session, 12) });
    sessionIds.push(sessionId);
    picks.forEach(({ q, item, occurrenceId }, i) => {
      const id = `${sessionId}:attempt:${i}`;
      const correct = (s + i) % 3 !== 0;
      const options = (q.interaction as Json).options as Json[];
      const chosen = correct ? ((q.answer as Json | undefined)?.optionIds as string[] | undefined)?.[0] ?? options[0]!.optionId : options.at(-1)!.optionId;
      const attempt = {
        id, sessionId, trackId, modeId: "coding-interview-guided-practice", occurrenceId, item,
        response: { kind: "choice_single", selectedOptionIds: [chosen] },
        result: { kind: correct ? "correct" : "incorrect", earnedPoints: correct ? 1 : 0, maxPoints: 1 },
        reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [{ kind: "mental_unit", id: q.mentalUnitId }, { kind: "node", id: q.nodeId }] },
        answeredAt: iso(start + i * 55_000), committedAt: iso(start + i * 55_000 + 120), durationMs: 41_000 + i,
      };
      records.push({ key: `attempt:${id}`, kind: "attempt", raw: env(attempt) });
      attemptIds.push(id);
      if (!correct && reviewIds.length < 300) {
        const rid = `review-${id}`;
        records.push({ key: `review:${rid}`, kind: "review", raw: env({ id: rid, item, reason: "incorrect_answer", stage: "repair24", policyVersion: "bizq04-v1", sourceAttemptId: id, createdAt: iso(start + i * 55_000), dueAt: iso(start + 86_400_000), status: "active" }, 2) });
        reviewIds.push(rid);
      }
    });
  }
  const idx = (ids: string[], key: string) => ({ key, kind: "index", raw: env({ ids }, ids.length) });
  records.push(idx(sessionIds, "session-index"), idx(attemptIds, "attempt-index"), idx(reviewIds, "review-index"));
  const last = (JSON.parse(records.find((r) => r.kind === "session")!.raw) as Json).payload as Json;
  const nextSession: Json = { ...last, id: "session-next", currentItemIndex: 3, status: "active" };
  delete nextSession.completedAt;
  const nextAttempt = (JSON.parse(records.find((r) => r.kind === "attempt")!.raw) as Json).payload as Json;
  const pw = (key: string, kind: string, before: string | null, after: string) => ({ key, kind, before, after });
  const plan = {
    operation: "answer_training_item", status: "journal_durable", createdAt: "2026-11-12T10:00:00.000Z", sessionId: "session-next", trackId,
    artifactSha256, commandIdentity: { version: 1, fingerprint: "a".repeat(64) },
    expectedRevisions: records.slice(-3).map((r) => ({ key: r.key, revision: (JSON.parse(r.raw) as Json).revision })),
    physicalWrites: [
      pw("session-next", "session", env({ ...nextSession, currentItemIndex: 2 }, 3), env(nextSession, 4)),
      pw("attempt-next", "attempt", null, env({ ...nextAttempt, id: "next-attempt", sessionId: "session-next" })),
      pw("attempt-index", "index", env({ ids: attemptIds }, attemptIds.length), env({ ids: [...attemptIds, "next-attempt"] }, attemptIds.length + 1)),
      pw("session-index", "index", env({ ids: sessionIds }, sessionIds.length), env({ ids: [...sessionIds, "session-next"] }, sessionIds.length + 1)),
      pw("review-index", "index", env({ ids: reviewIds }, 300), env({ ids: reviewIds }, 301)),
    ],
  };
  return { history: JSON.stringify({ records }), answer: JSON.stringify(plan), records: records.length };
}

type Mode = Readonly<{ serialize: Serialize; fingerprintPayload: Serialize; hash: (s: string) => string }>;

function runHistory(text: string, mode: Mode) {
  const started = now();
  const root = JSON.parse(text) as { records: { kind: string; raw: string }[] };
  const parsed = root.records.map((r) => { const p = validEnvelope(JSON.parse(r.raw)); if (!p) throw new Error("env"); return [r.kind, p] as const; });
  for (const [k, p] of parsed) if (!validPayload(k, p, mode.serialize)) throw new Error(`payload ${k}`);
  const fingerprintStart = now();
  const fps = parsed.map(([, p]) => mode.hash(mode.serialize(p)));
  const digest = mode.hash(mode.serialize(fps));
  return { totalMs: now() - started, fingerprintMs: now() - fingerprintStart, digest };
}

function runAnswer(text: string, mode: Mode) {
  const started = now();
  const plan = JSON.parse(text) as Json;
  const clone = JSON.parse(JSON.stringify(plan)) as Json;
  const digest = mode.hash(mode.fingerprintPayload(clone));
  for (const w of clone.physicalWrites as Json[]) for (const side of ["before", "after"]) {
    const raw = w[side];
    if (typeof raw !== "string") continue;
    const p = validEnvelope(JSON.parse(raw));
    if (!p || !validPayload(w.kind as string, p, mode.serialize)) throw new Error("write");
    mode.hash(raw);
  }
  return { totalMs: now() - started, digest };
}

function runContent(artifact: unknown, text: string, mode: Mode) {
  const started = now();
  const serialized = mode.serialize(artifact);
  const serializeMs = now() - started;
  const shaStart = now();
  const digest = mode.hash(serialized);
  const shaSerializedMs = now() - shaStart;
  const rawStart = now();
  mode.hash(text);
  const shaRawMs = now() - rawStart;
  return { totalMs: now() - started, serializeMs, shaSerializedMs, shaRawMs, rawBytes: text.length, digest };
}

const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;

function runBenchmark() {
  const artifact = require("../../content/generated/canonical-content/coding-interview-dsa-problem-solving.json") as Artifact;
  const artifactText = JSON.stringify(artifact);
  const payloads = buildPayloads(artifact, artifactText, referenceSha256Utf8);
  const modes: Record<string, Mode> = {
    reference: { serialize: referenceCanonicalSerialize, fingerprintPayload: (v) => referenceCanonicalSerialize({ serializerVersion: CANONICAL_SERIALIZER_VERSION, value: v }), hash: referenceSha256Utf8 },
    native: { serialize: canonicalSerialize, fingerprintPayload: canonicalFingerprintPayload, hash: sha256Utf8 },
  };
  const results: Record<string, unknown> = { records: payloads.records, historyBytes: payloads.history.length, answerBytes: payloads.answer.length };
  const digests: Record<string, string[]> = {};
  for (const [name, mode] of Object.entries(modes)) {
    const reps = name === "reference" ? 3 : 5;
    const history = Array.from({ length: reps }, () => runHistory(payloads.history, mode));
    const answer = Array.from({ length: reps }, () => runAnswer(payloads.answer, mode));
    const content = Array.from({ length: name === "reference" ? 1 : 5 }, () => runContent(artifact, artifactText, mode));
    digests[name] = [history[0]!.digest, answer[0]!.digest, content[0]!.digest];
    results[name] = {
      historyMs: median(history.map((r) => r.totalMs)), historyFingerprintMs: median(history.map((r) => r.fingerprintMs)),
      answerMs: median(answer.map((r) => r.totalMs)),
      contentMs: median(content.map((r) => r.totalMs)), contentSerializeMs: median(content.map((r) => r.serializeMs)),
      contentShaSerializedMs: median(content.map((r) => r.shaSerializedMs)), sha10MbRawMs: median(content.map((r) => r.shaRawMs)), contentRawChars: content[0]!.rawBytes,
    };
  }
  results.digestsEqual = JSON.stringify(digests.reference) === JSON.stringify(digests.native);
  return results;
}

export function runNativeCoreDiagnostics(): void {
  const started = now();
  const native = getNativeCore();
  const report: Record<string, unknown> = { at: new Date().toISOString(), status: getNativeCoreStatus() };
  if (native) {
    try { report.vectors = runVectors(native); } catch (error) { report.vectors = { error: String(error) }; }
    try { report.fuzz = runFuzz(10_000); } catch (error) { report.fuzz = { error: String(error) }; }
    try { report.benchmark = runBenchmark(); } catch (error) { report.benchmark = { error: String(error) }; }
  }
  report.durationMs = now() - started;
  try {
    const { Directory, File, Paths } = require("expo-file-system") as typeof import("expo-file-system");
    const directory = new Directory(Paths.document, "perf-trace");
    directory.create({ intermediates: true, idempotent: true });
    const file = new File(directory, `native-core-${Date.now()}.json`);
    file.create();
    file.write(JSON.stringify(report, null, 1));
  } catch { /* Diagnostics never affect the app. */ }
}
