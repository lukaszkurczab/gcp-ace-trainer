# Patternly core (B0 data primitives)

C++20 implementation of the identity byte contracts from `src/domain/identity/`
(Plan T1.1). The TypeScript code stays the oracle and the fallback; the
contract is `integration/contracts/identity-parity/vectors.v1.json` (T1.0).

| Path | Content |
|---|---|
| `cpp/PatternlyCore.{hpp,cpp}` | The core. No JSI, Nitro, Foundation or JNI dependency, so it can be called from the Nitro adapter, Swift (C++ interop) and Kotlin (JNI). Byte JSON parser with `JSON.parse` semantics, serializers for `canonicalSerialize`, `canonicalFingerprintPayload`, `recordFingerprintPayload`, `canonicalJsonV1`, `fingerprint` (payload + SHA-256), `sha256Hex`, `validateEnvelope`, ECMAScript `Number::toString`. Strings are WTF-8 (unpaired surrogates as 3-byte sequences, like the reference SHA). |
| `apple/PatternlyCoreApple.{hpp,cpp}` | Platform adapters: SHA-256 via CommonCrypto, NFC via `CFStringNormalize`. Used by iOS and by the macOS host test. |
| `nitro/PatternlyCore.mm` | iOS: thin Nitro `HybridObject` ("PatternlyCore") with raw JSI methods: strings are read with `jsi::String::getStringData` (ASCII or UTF-16, lossless), never through a UTF-8 conversion. |
| `test/hostCli.cpp` | Host driver used by `scripts/qa/nativeCoreParity.test.ts`. |
| `PatternlyCore.podspec.json` | Local pod, declared in `app.config.js` `extraPods` (like `native/foreground-clock`). |

Android (D15 = (b)): only the platform-neutral core and the adapter interface
(`setDigestAdapter`, `setNfcAdapter`) exist. There is no JNI adapter or CMake
target yet; the portable SHA-256 is the default digest and NFC-requiring inputs
report `nfc_unavailable` (TS fallback) until an adapter is installed.

## JS side

`src/infrastructure/identity/installNativeCore.ts` (called from `App.tsx`)
installs the core as accelerator of the domain functions. Each hook is
installed only when its probes equal the reference, is removed on an unexpected
failure, and returns `undefined` (reference path) for inputs `JSON.stringify`
cannot carry exactly (guarded stringify) or that the core rejects. Native NFC
is enabled only when it matches Hermes `String.prototype.normalize` on known
divergence probes: CoreFoundation and ICU order some combining sequences
differently (e.g. U+0F71 U+0F72 next to U+0323 U+0307).

The core is always on (no kill-switch, D23). The TS path is the oracle and the
fallback only where the core is unavailable (Android) or a hook fails its probes.

## Checks

```sh
node --import tsx --test scripts/qa/nativeCoreParity.test.ts          # macOS: vectors + 10k fuzz vs TS
node --import tsx --test src/infrastructure/identity/installNativeCore.test.ts
```

In-app verification (Release perf build with
`EXPO_PUBLIC_PATTERNLY_PERF_NATIVE_CORE_DIAG=1`): vectors, 10k fuzz against the
TS reference running in Hermes, and the `Analiza-technologii.md` §1.3
microbenchmark, written to `Documents/perf-trace/native-core-<epoch>.json`
(`src/infrastructure/diagnostics/nativeCoreDiagnostics.ts`).
