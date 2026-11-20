import { installCanonicalSerializationAccelerator, type CanonicalSerializationProfile } from "../../domain/identity/canonicalSerialization";
import { installRecordFingerprintAccelerator, type RecordFingerprintInput } from "../../domain/identity/recordFingerprint";
import { installSha256Utf8Accelerator } from "../../domain/identity/sha256";
import { isPatternlyPerfBuild } from "../runtime/runtimeMode";
import type { HybridObject } from "react-native-nitro-modules";

/**
 * B0 native data primitives (Plan T1.1): installs the C++ core
 * (`native/patternly-core`, Nitro object "PatternlyCore") as accelerator of the
 * domain identity functions. The TS implementations stay the oracle and the
 * fallback: each hook is installed only after its probes match the reference,
 * is removed on an unexpected native failure, and returns `undefined` (reference
 * path) for inputs the transport cannot represent exactly.

 */
export type NativeCore = Readonly<{
  sha256: (value: string) => string;
  serialize: (profile: number, json: string) => string | undefined;
  fingerprint: (profile: number, json: string) => string | undefined;
  validateEnvelope: (raw: string) => string;
  lastError: () => string;
  setNfcEnabled: (enabled: boolean) => void;
}>;

type NativeCoreHybrid = HybridObject<{ ios: "c++"; android: "c++" }> & NativeCore;

export type NativeCoreStatus = Readonly<{
  installed: boolean;
  reason?: string;
  sha256: boolean;
  serialization: boolean;
  recordFingerprint: boolean;
  /** Native NFC agrees with Hermes `normalize` on the divergence probes. */
  nfc: boolean;
  installMs: number;
}>;

export const NATIVE_CORE_PROFILE = Object.freeze({
  canonicalSerialize: 0, canonicalFingerprintPayload: 1, recordFingerprintPayload: 2, canonicalJsonV1: 3,
} as const);

// Sequences on which NFC implementations are known to disagree (CoreFoundation vs
// ICU reorder U+0F71/U+0F72 against U+0323/U+0307 differently), plus ordinary cases.
const NFC_PROBES = Object.freeze([
  "é", "Å", "Å", "각", "q̣̇", "ཱི̣̇", "ཱི̣", "̈́",
  "क़", "\ud800qཱི̣̇", "ཱི̈́", "ཱྀིུ̣",
]);

let core: NativeCore | null = null;
let status: NativeCoreStatus = Object.freeze({ installed: false, reason: "not_attempted", sha256: false, serialization: false, recordFingerprint: false, nfc: false, installMs: 0 });

const BAIL = Symbol("native-core-bail");

/**
 * `JSON.stringify` restricted to the domain the reference accepts unchanged:
 * finite numbers, strings, booleans, null, dense arrays and plain objects. Any
 * other value (undefined, functions, symbols, bigint, NaN/±Infinity, holes,
 * Date/Map/class instances, null prototypes, `toJSON`, cycles) returns
 * `undefined`, so the reference produces its exact result or exception.
 * `strictRecord` adds the record profile's symbol and extra-array-key checks.
 */
export function guardedJson(value: unknown, strictRecord: boolean): string | undefined {
  const guard = function (this: Record<string, unknown>, key: string): unknown {
    const raw = this[key];
    switch (typeof raw) {
      case "string":
      case "boolean":
        return raw;
      case "number":
        if (raw !== raw || raw === Infinity || raw === -Infinity) throw BAIL;
        return raw;
      case "object":
        if (raw === null) return null;
        if (Array.isArray(raw)) {
          if (strictRecord && (Object.keys(raw).length !== raw.length || Object.getOwnPropertySymbols(raw).length > 0)) throw BAIL;
          return raw;
        }
        if (Object.getPrototypeOf(raw) !== Object.prototype) throw BAIL;
        if (strictRecord && Object.getOwnPropertySymbols(raw).length > 0) throw BAIL;
        return raw;
      default:
        throw BAIL;
    }
  };
  try {
    const json = JSON.stringify(value, guard);
    return typeof json === "string" ? json : undefined;
  } catch {
    return undefined;
  }
}

function isContainer(value: unknown): boolean {
  return typeof value === "object" && value !== null;
}

function loadCore(): NativeCore | null {
  const { Platform } = require("react-native") as typeof import("react-native");
  if (Platform.OS !== "ios") return null;  // D15 (b): no Android adapter yet.
  const { NitroModules } = require("react-native-nitro-modules") as typeof import("react-native-nitro-modules");
  return NitroModules.createHybridObject<NativeCoreHybrid>("PatternlyCore");
}

function nfcAgreesWithHermes(native: NativeCore): boolean {
  try {
    for (const probe of NFC_PROBES) {
      const expected = JSON.stringify(probe.normalize("NFC"));
      const actual = native.serialize(NATIVE_CORE_PROFILE.canonicalJsonV1, JSON.stringify(probe));
      if (actual !== expected) return false;
    }
    return true;
  } catch { return false; }
}

/** Idempotent. Call once, early in startup (App.tsx). */
export function installNativeCore(load: () => NativeCore | null = loadCore, now: () => number = () => Date.now()): NativeCoreStatus {
  if (status.reason !== "not_attempted") return status;
  const started = now();
  const finish = (next: Omit<NativeCoreStatus, "installMs">): NativeCoreStatus => {
    status = Object.freeze({ ...next, installMs: now() - started });
    return status;
  };
  let native: NativeCore | null;
  try { native = load(); } catch { native = null; }
  if (!native) return finish({ installed: false, reason: "unavailable", sha256: false, serialization: false, recordFingerprint: false, nfc: false });

  // NFC first: when the native normalizer disagrees with Hermes on any probe,
  // NFC-requiring inputs take the TS path (the core reports nfc_unavailable).
  const nfc = nfcAgreesWithHermes(native);
  if (!nfc) { try { native.setNfcEnabled(false); } catch { /* serialization probes below decide */ } }

  const sha256 = installSha256Utf8Accelerator((value) => native.sha256(value));
  const serialization = installCanonicalSerializationAccelerator((profile: CanonicalSerializationProfile, value: unknown) => {
    // Scalars are cheaper in the reference than across the bridge.
    if (profile !== "canonicalFingerprintPayload" && !isContainer(value)) return undefined;
    const json = guardedJson(value, false);
    return json === undefined ? undefined : native.serialize(NATIVE_CORE_PROFILE[profile], json);
  });
  const recordFingerprint = installRecordFingerprintAccelerator((kind, record: RecordFingerprintInput) => {
    const json = guardedJson({ recordId: record.recordId, recordType: record.recordType, state: record.state, trackId: record.trackId }, true);
    if (json === undefined) return undefined;
    return kind === "payload"
      ? native.serialize(NATIVE_CORE_PROFILE.recordFingerprintPayload, json)
      : native.fingerprint(NATIVE_CORE_PROFILE.recordFingerprintPayload, json);
  });
  core = native;
  // Release perf build only (Plan T1.1 verification). The direct diagnostic flag read is the
  // compile-time gate that lets other bundles drop the module; the perf build itself is
  // checked through runtimeMode, the owner of the perf flag (T1.1b).
  if (process.env.EXPO_PUBLIC_PATTERNLY_PERF_NATIVE_CORE_DIAG === "1" && isPatternlyPerfBuild()) {
    setTimeout(() => {
      try { (require("../diagnostics/nativeCoreDiagnostics") as typeof import("../diagnostics/nativeCoreDiagnostics")).runNativeCoreDiagnostics(); } catch { /* diagnostics only */ }
    }, 4000);
  }
  return finish({ installed: sha256 || serialization || recordFingerprint, reason: sha256 && serialization && recordFingerprint ? "ok" : "partial", sha256, serialization, recordFingerprint, nfc });
}

/** Tests only: removes every hook and forgets the attempt. */
export function resetNativeCoreForTests(): void {
  installSha256Utf8Accelerator(null);
  installCanonicalSerializationAccelerator(null);
  installRecordFingerprintAccelerator(null);
  core = null;
  status = Object.freeze({ installed: false, reason: "not_attempted", sha256: false, serialization: false, recordFingerprint: false, nfc: false, installMs: 0 });
}

export function getNativeCoreStatus(): NativeCoreStatus {
  return status;
}

/** The loaded native object, for the perf-build diagnostic only. */
export function getNativeCore(): NativeCore | null {
  return core;
}
