# Identity parity contract (B0)

`vectors.v1.json` is the byte contract between the TypeScript identity code
and any accelerated implementation of it, starting with the native B0 core
(`native/patternly-core/`, task T1.1). **The TypeScript implementation is the
oracle and the fallback.** An accelerator is correct only if it reproduces
every applicable vector exactly, byte for byte, including the error codes.

**Changing the vectors changes the contract.** Existing fingerprints are stored
in MMKV, in the mutation journal and in the backend. A change to the generated
file other than adding new vectors needs an owner decision. Regenerate only with
the generator below, and never edit the JSON by hand.

## Files

| File | What it is |
|---|---|
| `vectors.v1.json` | Generated vectors (do not edit). |
| `real-sample.v1.json` | Frozen inputs of the real sample: seed 10/100 records with their stored fingerprints, and raw MMKV envelopes. |
| `../../../scripts/generateIdentityParityVectors.ts` | Deterministic generator. Runs the TS oracle in Node. |
| `../../../src/domain/identity/identityParity.test.ts` | Checks the TS oracle against the file, and that the file is up to date. |
| `patternly-backend/tests/identityParity.test.ts` | Reads this file only. Checks the backend copies of the record and canonical-json-v1 profiles. |

```bash
cd patternly
node --import tsx scripts/generateIdentityParityVectors.ts           # regenerate
node --import tsx scripts/generateIdentityParityVectors.ts --check   # exit 1 when stale
node --import tsx scripts/generateIdentityParityVectors.ts --extract-real-sample  # rebuild real-sample.v1.json (offline)
```

Two runs on the same Node produce the identical file. `oracleRuntime` records
the Node, V8, ICU and Unicode versions used, because NFC results depend on the
Unicode version.

## Profiles

| `profile` | Oracle | Contract summary |
|---|---|---|
| `canonicalSerialize` | `src/domain/identity/canonicalSerialization.ts` `canonicalSerialize` | Historical profile. Keys sorted by `Array.prototype.sort` (UTF-16 code units). **No NFC.** Strings and numbers exactly as `JSON.stringify`. Non-finite numbers and non-plain values throw. |
| `canonicalFingerprintPayload` | same file, `canonicalFingerprintPayload` | `canonicalSerialize({serializerVersion: "canonical-json-utf8-v1", value})`. |
| `recordFingerprintPayload` | `src/domain/identity/recordFingerprint.ts` | Picks exactly `{recordId, recordType, state, trackId}`, serializes like `canonicalSerialize`, rejects sparse arrays, symbols and cycles. NFC is only used to detect key collisions (`record_fingerprint_duplicate_key`); bytes are never rewritten. `fingerprint` = domain `sha256Utf8(payload)`. Same profile as `../record-fingerprint/`. |
| `canonicalJsonV1` | same file, `canonicalJsonV1` | NFC on string values and keys, sort by normalized key (UTF-16), `-0` → `0`, error on a duplicate key after NFC. |
| `sha256Utf8` | `src/domain/identity/sha256.ts` | SHA-256 of the UTF-8 bytes of a JS string. **Unpaired surrogates are encoded as their 3-byte sequence (`ED A0 80` for U+D800), not replaced by U+FFFD.** |
| `envelope` | `src/storage/repositories/canonicalRecordCodec.ts` `parseCanonicalRecordEnvelope` | `JSON.parse(raw)` then: plain object, `schemaIdentity === "patternly:canonical:v1"`, `revision` a safe integer ≥ 1, exactly 3 own keys, and `"payload" in value`. |

## Vector format

```jsonc
{
  "id": "canonicalJsonV1/nfc/collision-e-acute",  // unique
  "profile": "canonicalJsonV1",
  "class": "nfc",                // coverage class, see below
  "source": "synthetic",         // synthetic | test-fixture:<file> | contract:<file> | real:seed10 | real:seed100
  "nativeApplicable": true,      // false for js-only inputs
  "input": { ... },
  "expect": { "ok": true, ... } | { "ok": false, "error": { "name", "message", "code" } }
}
```

Input kinds:
- `{"json": "<JSON text>"}`: value profiles and `recordFingerprintPayload`. The oracle evaluates `fn(JSON.parse(json))`. A native core takes the same JSON text, so its parser must behave like `JSON.parse`: the last duplicate key wins, `1e400` becomes `Infinity` (then an error), `1e-400` becomes `0`, escaped unpaired surrogates (`"\ud800"`) are kept as code units, and `__proto__` is an ordinary own key.
- `{"string": "..."}` or `{"repeat": {"unit", "count"}}`: `sha256Utf8` input (the string is `unit.repeat(count)`). The file is UTF-8 JSON, so unpaired surrogates appear as `\udXXX` escapes and decode back to the same code units.
- `{"raw": "..."}`: the exact string stored in MMKV, for `envelope`.
- `{"js": "<tag>"}`: a value JSON cannot express (`undefined`, `NaN`, a cycle, a sparse array, a `Date`, …). The tag list is `JS_ONLY_TAGS` in the generator. These are oracle regression vectors only (`nativeApplicable: false`); for `recordFingerprintPayload` the value is placed at `state.nested` of a fixed record. `cycle` is listed only for the record profile: the other serializers have no cycle check and overflow the engine stack, which is not a contract.

Expected results on success:
- `canonicalSerialize`, `canonicalFingerprintPayload`: `output`, `sha256` (of `output`);
- `canonicalJsonV1`: `output`, `utf8ByteLength` (what `canonicalJsonV1ByteLength` returns);
- `recordFingerprintPayload`: `payload`, `fingerprint`;
- `sha256Utf8`: `sha256`, `utf8ByteLength`, and `utf8Hex` when the encoding has at most 256 bytes;
- `envelope`: `envelope.{schemaIdentity, revision, rawSha256, payloadJson, payloadSha256}`. `payloadJson` is `JSON.stringify(JSON.parse(raw).payload)`, the digest input the codec uses for physical write states. It keeps ECMAScript property order: integer-like keys ascending first, then other keys in first-insertion order, with the last duplicate value.

Error codes (`expect.error.code`):

| code | thrown by | TS error |
|---|---|---|
| `canonical_serialize_non_finite_number` | `canonicalSerialize`, `canonicalFingerprintPayload` | `TypeError("Canonical values cannot contain non-finite numbers.")` |
| `canonical_serialize_unsupported_value` | same | `TypeError("Canonical values cannot contain unsupported values.")` |
| `record_fingerprint_unsupported_value` | `recordFingerprintPayload` | `TypeError` with the code as message |
| `record_fingerprint_duplicate_key` | `recordFingerprintPayload` | same |
| `canonical_json_non_finite_number` | `canonicalJsonV1` | same |
| `canonical_json_unsupported_value` | `canonicalJsonV1` | same |
| `canonical_json_duplicate_key` | `canonicalJsonV1` | same |
| `envelope_corrupt` | `envelope` | `CorruptStoredRecordError` (`JSON.parse` failed) |
| `envelope_unsupported` | `envelope` | `UnsupportedStoredRecordError` (valid JSON, not an envelope) |

## Coverage classes

| class | Content |
|---|---|
| `numbers` | Integers, fractions, `0.1+0.2`, `1e21`, `1e-7`, `-0`, safe-integer limits, `MIN_VALUE`, subnormals, `MAX_VALUE`, plus 120 random IEEE-754 bit patterns (shortest round-trip). |
| `number-spelling` | JSON spellings a parser must reprint like ECMAScript: `1.0`, `1E2`, `-0.0`, over-precise decimals, underflow to 0, long integers. |
| `errors` | Overflow to `Infinity` from JSON text. |
| `strings`, `string-spelling` | Control characters, `"`, `\`, `/`, U+007F, U+2028/2029, BMP, emoji, ZWJ sequences, unpaired and reversed surrogates, NFD/NFC forms, as values and as keys; escape spellings in JSON text. |
| `key-order` | UTF-16 vs UTF-8 order (≥ U+E000 against astral keys), surrogate keys, integer-like keys, empty keys, `__proto__`, prefixes. |
| `nfc` | NFC collisions (é, Å/Å, Ω, Hangul, combining-mark order, nested and deep), sort changes caused by NFC, compatibility forms that NFC leaves alone. |
| `nesting` | Empty containers, depth 64, wide objects, whitespace in JSON text, duplicate literal keys, `__proto__`. |
| `record-shape` | Extra fields dropped, missing fields, non-object state. |
| `random` | 160 random structures from the tricky corpora (fixed PRNG). |
| `sha-length`, `sha-random-utf16` | Padding boundaries (55/56/63/64/119/120 bytes …), 1–4-byte and surrogate units, random code units. |
| `envelope` | Valid and invalid envelopes, including revision edge cases, extra or missing keys, BOM, duplicates. |
| `js-only` | Values JSON cannot express (oracle only). |
| `test-fixture` | Inputs from passing tests: `canonicalSerialization.test.ts`, `sha256.test.ts`, the accelerator probe in `src/infrastructure/identity/sha256.ts` and `../record-fingerprint/vectors.json`. |
| `real` | Seed 10/100 records (each checked against the fingerprint stored by the app) and raw envelopes from the app's MMKV namespace. |

## Known facts the vectors pin down

- `canonicalJsonV1` keeps `1e+21`. Its exponent regex (`e\+?(-?)0+(\d+)`) only fires on leading zeros in the exponent, and `JSON.stringify` never prints those, so the output equals `JSON.stringify` for every finite number except `-0`.
- Every serializer output is well-formed UTF-16: `JSON.stringify` escapes unpaired surrogates as `\udXXX`. The 3-byte surrogate encoding of `sha256Utf8` therefore only matters for raw strings hashed directly (the `sha256Utf8` vectors). For record fingerprints the backend, which hashes with Node `crypto` (`update(value, "utf8")`, U+FFFD substitution), gets the same digest as the app; `patternly-backend/tests/identityParity.test.ts` checks this on every record vector.
