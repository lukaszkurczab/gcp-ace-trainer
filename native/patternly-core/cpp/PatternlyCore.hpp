#pragma once

// Patternly B0 data-primitive core (Plan T1.1).
//
// Pure C++20 with no JSI, Nitro, Foundation or JNI dependency, so the same
// core can be called from the Nitro adapter, from Swift (C++ interop) and from
// Kotlin (JNI). The TypeScript implementations in `src/domain/identity/` are
// the byte-contract oracle; `integration/contracts/identity-parity/` holds the
// parity vectors.
//
// Text model: every string crossing this API is WTF-8, i.e. UTF-8 in which an
// unpaired UTF-16 surrogate is encoded as its own 3-byte sequence (ED A0..BF xx).
// That is exactly the byte stream the TS reference `sha256Utf8` hashes, and it
// round-trips any JavaScript string losslessly. Use `appendWtf8FromUtf16` to
// convert UTF-16 code units.

#include <cstddef>
#include <cstdint>
#include <string>
#include <string_view>

namespace patternly::core {

enum class Profile : int {
  // canonicalSerialize: raw UTF-16 key order, no NFC, JSON.stringify strings/numbers.
  CanonicalSerialize = 0,
  // canonicalFingerprintPayload: {"serializerVersion":"canonical-json-utf8-v1","value":<CanonicalSerialize>}.
  CanonicalFingerprintPayload = 1,
  // recordFingerprintPayload: input is a record object; exactly {recordId, recordType, state, trackId}
  // are taken from its root, then CanonicalSerialize plus an NFC key-collision check per object.
  RecordFingerprintPayload = 2,
  // canonicalJsonV1: NFC strings and keys, order by normalized key, duplicate after NFC is an error.
  CanonicalJsonV1 = 3,
};

// Error codes follow `integration/contracts/identity-parity/README.md`. Callers fall back to the TS reference on any error, so a code
// only has to identify the class; the reference reproduces the exact exception.
namespace error {
inline constexpr const char* kJsonSyntax = "json_syntax";
inline constexpr const char* kCanonicalSerializeNonFinite = "canonical_serialize_non_finite_number";
inline constexpr const char* kCanonicalJsonNonFinite = "canonical_json_non_finite_number";
inline constexpr const char* kRecordUnsupportedValue = "record_fingerprint_unsupported_value";
inline constexpr const char* kTooDeep = "nesting_too_deep";
inline constexpr const char* kRecordDuplicateKey = "record_fingerprint_duplicate_key";
inline constexpr const char* kCanonicalJsonDuplicateKey = "canonical_json_duplicate_key";
inline constexpr const char* kNfcUnavailable = "nfc_unavailable";
inline constexpr const char* kBadProfile = "unknown_profile";
// validateEnvelope results (canonicalRecordCodec.ts: CorruptStoredRecordError / UnsupportedStoredRecordError).
inline constexpr const char* kEnvelopeCorrupt = "envelope_corrupt";
inline constexpr const char* kEnvelopeUnsupported = "envelope_unsupported";
}  // namespace error

struct Result {
  const char* error = nullptr;  // nullptr on success
  std::string value;
  bool ok() const { return error == nullptr; }
};

// ---- Platform adapters (set once at load; defaults are portable) ----------

struct alignas(16) Sha256State {
  unsigned char opaque[256];
};
struct DigestAdapter {
  void (*init)(Sha256State&);
  void (*update)(Sha256State&, const uint8_t*, size_t);
  void (*finish)(Sha256State&, uint8_t out[32]);
};
// NFC over UTF-16 code units. Returns false when normalization is unavailable.
using NfcAdapter = bool (*)(const char16_t* units, size_t length, std::u16string& out);

void setDigestAdapter(const DigestAdapter& adapter);  // default: portable C++ SHA-256
void setNfcAdapter(NfcAdapter adapter);                // default: none (NFC-needing inputs fail with kNfcUnavailable)
bool hasNfcAdapter();
DigestAdapter portableDigestAdapter();

// ---- Text helpers ----------------------------------------------------------

// Streaming UTF-16 -> WTF-8 encoder; keeps a pending high surrogate across chunks.
class Wtf8Encoder {
 public:
  void append(std::string& out, const char16_t* units, size_t length);
  void finish(std::string& out);  // flushes a trailing lone high surrogate

 private:
  uint32_t pendingHigh_ = 0;
};
void appendWtf8FromUtf16(std::string& out, const char16_t* units, size_t length);
std::u16string utf16FromWtf8(std::string_view wtf8);

// ---- Primitives ------------------------------------------------------------

class Sha256 {
 public:
  Sha256();
  void update(const void* bytes, size_t length);
  // Feeds UTF-16 code units as WTF-8 (the reference byte contract), chunked.
  void updateUtf16(const char16_t* units, size_t length);
  // ASCII chunk after UTF-16 chunks: flushes a pending lone high surrogate first.
  void updateAscii(const char* chars, size_t length);
  std::string finishHex();

 private:
  Sha256State state_;
  DigestAdapter adapter_;
  Wtf8Encoder encoder_;
  std::string scratch_;
};

std::string sha256Hex(std::string_view wtf8);

// Parses `json` (JSON.parse semantics: last duplicate key wins) and serializes it per profile.
Result serialize(Profile profile, std::string_view json);
// SHA-256 hex of serialize(profile, json).
Result fingerprint(Profile profile, std::string_view json);
// canonicalRecordCodec.ts parseEnvelope: nullptr when valid, else kEnvelopeCorrupt / kEnvelopeUnsupported.
const char* validateEnvelope(std::string_view json);

// ECMAScript Number::toString(10) for finite doubles (shortest round-trip). Exposed for tests.
void appendEcmaNumber(std::string& out, double value);

}  // namespace patternly::core
