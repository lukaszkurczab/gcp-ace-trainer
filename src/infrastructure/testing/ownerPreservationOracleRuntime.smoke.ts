import type { OwnerPreservationOracle, OwnerPreservationOracleResult } from "../../application/testing/ownerPreservationOracle";
import type { KeyValueStorage } from "../storage/mmkvClient";
import { getLegacyOwnerReadOnlyScope } from "./ownerPreservationSourceRuntime";
import type { OwnerPreservationScope } from "./ownerPreservationSourceRuntime.disabled";
import { sha256Utf8 } from "../identity/sha256";

const RECORD_KEY = "patternly.smoke.owner-preservation-oracle.v1";
const VERSION = 1 as const;
const MAX_AGE_MS = 15 * 60 * 1000;
const RECORD_FIELDS = "checksum,createdAt,digest,phase,result,salt,version";

type SecureStorePort = Readonly<{
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}>;

type SecureStoreOptions = Readonly<{ keychainAccessible: number; keychainService: string }>;

type OracleRecord = Readonly<{
  version: typeof VERSION;
  phase: "armed" | "terminal";
  createdAt: number;
  salt: string;
  digest: string;
  result: OwnerPreservationOracleResult | null;
  checksum: string;
}>;

type OracleOptions = Readonly<{
  secureStore?: SecureStorePort;
  now?: () => number;
  randomSalt?: () => Promise<string>;
  ownerScope?: () => OwnerPreservationScope | null;
}>;

function checksumBody(record: Omit<OracleRecord, "checksum">): string {
  return sha256Utf8(JSON.stringify(record));
}

function serializeRecord(record: Omit<OracleRecord, "checksum">): string {
  return JSON.stringify({ ...record, checksum: checksumBody(record) });
}

function parseRecord(value: string | null): OracleRecord | null {
  if (value === null) return null;
  try {
    const candidate = JSON.parse(value) as Record<string, unknown>;
    if (Object.keys(candidate).sort().join(",") !== RECORD_FIELDS) return null;
    const { checksum, ...body } = candidate;
    if (body.version !== VERSION || (body.phase !== "armed" && body.phase !== "terminal")) return null;
    if (!Number.isSafeInteger(body.createdAt) || Number(body.createdAt) < 0) return null;
    if (typeof body.salt !== "string" || !/^[a-f0-9]{64}$/u.test(body.salt)) return null;
    if (typeof body.digest !== "string" || !/^[a-f0-9]{64}$/u.test(body.digest)) return null;
    if (body.phase === "armed" && body.result !== null) return null;
    if (body.phase === "terminal" && body.result !== "unchanged" && body.result !== "changed") return null;
    if (typeof checksum !== "string" || checksum !== checksumBody(body as Omit<OracleRecord, "checksum">)) return null;
    return Object.freeze({ ...body, checksum }) as OracleRecord;
  } catch {
    return null;
  }
}

function lengthDelimited(value: string): string {
  return `${value.length}:${value}`;
}

function captureDigest(storage: KeyValueStorage, salt: string): string {
  const keys = [...storage.getAllKeys()].sort();
  if (new Set(keys).size !== keys.length) throw new Error("duplicate_owner_scope_key");
  let material = lengthDelimited(salt);
  for (const key of keys) {
    const value = storage.getString(key);
    if (value === undefined) throw new Error("owner_scope_value_unavailable");
    material += `${lengthDelimited(key)}${lengthDelimited(value)}`;
  }
  return sha256Utf8(material);
}

function isFresh(record: OracleRecord, now: number): boolean {
  const age = now - record.createdAt;
  return Number.isSafeInteger(now) && age >= 0 && age <= MAX_AGE_MS;
}

function realSecureStore(): SecureStorePort {
  const secureStore = require("expo-secure-store") as typeof import("expo-secure-store");
  const options: SecureStoreOptions = Object.freeze({
    keychainAccessible: secureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    keychainService: "com.lkurczab.patternly.owner-preservation-oracle",
  });
  return Object.freeze({
    getItemAsync(key: string) { return secureStore.getItemAsync(key, options); },
    setItemAsync(key: string, value: string) { return secureStore.setItemAsync(key, value, options); },
    deleteItemAsync(key: string) { return secureStore.deleteItemAsync(key, options); },
  });
}

async function randomSecureSalt(): Promise<string> {
  const crypto = require("expo-crypto") as Readonly<{ getRandomBytesAsync(count: number): Promise<Uint8Array> }>;
  return Array.from(await crypto.getRandomBytesAsync(32), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Testable factory is exported only from this smoke-selected infrastructure module. */
export function createSmokeOwnerPreservationOracle(options: OracleOptions = {}): OwnerPreservationOracle {
  const secureStore = options.secureStore;
  const store = () => secureStore ?? realSecureStore();
  const now = options.now ?? Date.now;
  const randomSalt = options.randomSalt ?? randomSecureSalt;
  const ownerScope = options.ownerScope ?? getLegacyOwnerReadOnlyScope;

  const readCurrent = async (): Promise<OracleRecord | null> => {
    const raw = await store().getItemAsync(RECORD_KEY);
    const record = parseRecord(raw);
    if (!record || !isFresh(record, now())) return null;
    return record;
  };

  const saveAndReadBack = async (record: Omit<OracleRecord, "checksum">): Promise<boolean> => {
    const serialized = serializeRecord(record);
    await store().setItemAsync(RECORD_KEY, serialized);
    return (await store().getItemAsync(RECORD_KEY)) === serialized;
  };

  return Object.freeze({
    async arm(): Promise<OwnerPreservationOracleResult> {
      try {
        const scope = ownerScope();
        if (!scope) return "blocked";
        const { storage, profile } = scope;
        if (profile.kind !== "legacy_owner" || scope.selectedProfile.kind !== "legacy_owner" || scope.selectedProfile.id !== profile.id) return "blocked";
        if (await store().getItemAsync(RECORD_KEY) !== null) return "blocked";
        const salt = await randomSalt();
        if (!/^[a-f0-9]{64}$/u.test(salt)) return "blocked";
        const digest = captureDigest(storage, salt);
        const createdAt = now();
        if (!Number.isSafeInteger(createdAt) || createdAt < 0) return "blocked";
        const saved = await saveAndReadBack({ version: VERSION, phase: "armed", createdAt, salt, digest, result: null });
        return saved ? "unchanged" : "blocked";
      } catch {
        return "blocked";
      }
    },
    async verify(): Promise<OwnerPreservationOracleResult> {
      try {
        const scope = ownerScope();
        if (!scope) return "blocked";
        const { storage, profile } = scope;
        if (profile.kind !== "legacy_owner" || scope.selectedProfile.kind !== "guest" || scope.selectedProfile.id === profile.id) return "blocked";
        const record = await readCurrent();
        if (!record || record.phase !== "armed") return "blocked";
        const current = captureDigest(storage, record.salt);
        const result = current === record.digest ? "unchanged" : "changed";
        const saved = await saveAndReadBack({
          version: VERSION,
          phase: "terminal",
          createdAt: record.createdAt,
          salt: record.salt,
          digest: record.digest,
          result,
        });
        return saved ? result : "blocked";
      } catch {
        return "blocked";
      }
    },
    async cleanup(): Promise<OwnerPreservationOracleResult> {
      try {
        await store().deleteItemAsync(RECORD_KEY);
        return (await store().getItemAsync(RECORD_KEY)) === null ? "unchanged" : "blocked";
      } catch {
        return "blocked";
      }
    },
  });
}

export const ownerPreservationOracleRuntime: OwnerPreservationOracle = createSmokeOwnerPreservationOracle();
