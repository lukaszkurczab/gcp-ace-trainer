#include "PatternlyCore.hpp"

#include <algorithm>
#include <charconv>
#include <cmath>
#include <cstdlib>
#include <cstring>
#include <locale.h>
#include <vector>
#if defined(__APPLE__)
#include <xlocale.h>
#endif

namespace patternly::core {

// ===========================================================================
// Platform adapters
// ===========================================================================

namespace {

// ---- Portable SHA-256 (FIPS 180-4) ----------------------------------------

struct PortableSha {
  uint32_t h[8];
  uint64_t length;
  uint8_t block[64];
  size_t used;
};
static_assert(sizeof(PortableSha) <= sizeof(Sha256State), "Sha256State too small");

constexpr uint32_t K[64] = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2};

inline uint32_t rotr(uint32_t x, int n) { return (x >> n) | (x << (32 - n)); }

void shaCompress(PortableSha& s, const uint8_t* p) {
  uint32_t w[64];
  for (int i = 0; i < 16; i++) w[i] = (uint32_t(p[i * 4]) << 24) | (uint32_t(p[i * 4 + 1]) << 16) | (uint32_t(p[i * 4 + 2]) << 8) | p[i * 4 + 3];
  for (int i = 16; i < 64; i++) {
    uint32_t s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >> 3);
    uint32_t s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >> 10);
    w[i] = w[i - 16] + s0 + w[i - 7] + s1;
  }
  uint32_t a = s.h[0], b = s.h[1], c = s.h[2], d = s.h[3], e = s.h[4], f = s.h[5], g = s.h[6], h = s.h[7];
  for (int i = 0; i < 64; i++) {
    uint32_t t1 = h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i];
    uint32_t t2 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c));
    h = g; g = f; f = e; e = d + t1; d = c; c = b; b = a; a = t1 + t2;
  }
  s.h[0] += a; s.h[1] += b; s.h[2] += c; s.h[3] += d; s.h[4] += e; s.h[5] += f; s.h[6] += g; s.h[7] += h;
}

void portableInit(Sha256State& state) {
  auto& s = *reinterpret_cast<PortableSha*>(state.opaque);
  const uint32_t init[8] = {0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19};
  std::memcpy(s.h, init, sizeof(init));
  s.length = 0;
  s.used = 0;
}
void portableUpdate(Sha256State& state, const uint8_t* data, size_t length) {
  auto& s = *reinterpret_cast<PortableSha*>(state.opaque);
  s.length += length;
  if (s.used) {
    size_t take = std::min(length, size_t(64) - s.used);
    std::memcpy(s.block + s.used, data, take);
    s.used += take; data += take; length -= take;
    if (s.used < 64) return;
    shaCompress(s, s.block);
    s.used = 0;
  }
  while (length >= 64) { shaCompress(s, data); data += 64; length -= 64; }
  if (length) { std::memcpy(s.block, data, length); s.used = length; }
}
void portableFinish(Sha256State& state, uint8_t out[32]) {
  auto& s = *reinterpret_cast<PortableSha*>(state.opaque);
  const uint64_t bits = s.length * 8;
  uint8_t pad[72] = {0x80};
  size_t padLength = (s.used < 56) ? 56 - s.used : 120 - s.used;
  uint8_t lengthBytes[8];
  for (int i = 0; i < 8; i++) lengthBytes[i] = uint8_t(bits >> (56 - 8 * i));
  const uint64_t keep = s.length;
  portableUpdate(state, pad, padLength);
  portableUpdate(state, lengthBytes, 8);
  (void)keep;
  for (int i = 0; i < 8; i++) {
    out[i * 4] = uint8_t(s.h[i] >> 24); out[i * 4 + 1] = uint8_t(s.h[i] >> 16);
    out[i * 4 + 2] = uint8_t(s.h[i] >> 8); out[i * 4 + 3] = uint8_t(s.h[i]);
  }
}

DigestAdapter gDigest{portableInit, portableUpdate, portableFinish};
NfcAdapter gNfc = nullptr;

}  // namespace

DigestAdapter portableDigestAdapter() { return DigestAdapter{portableInit, portableUpdate, portableFinish}; }
void setDigestAdapter(const DigestAdapter& adapter) { gDigest = adapter; }
void setNfcAdapter(NfcAdapter adapter) { gNfc = adapter; }
bool hasNfcAdapter() { return gNfc != nullptr; }

// ===========================================================================
// Text
// ===========================================================================

namespace {
inline void putCodePoint(std::string& out, uint32_t cp) {
  if (cp < 0x80) out.push_back(char(cp));
  else if (cp < 0x800) { out.push_back(char(0xC0 | (cp >> 6))); out.push_back(char(0x80 | (cp & 63))); }
  else if (cp < 0x10000) { out.push_back(char(0xE0 | (cp >> 12))); out.push_back(char(0x80 | ((cp >> 6) & 63))); out.push_back(char(0x80 | (cp & 63))); }
  else { out.push_back(char(0xF0 | (cp >> 18))); out.push_back(char(0x80 | ((cp >> 12) & 63))); out.push_back(char(0x80 | ((cp >> 6) & 63))); out.push_back(char(0x80 | (cp & 63))); }
}

// Appends one UTF-16 code unit, merging a low surrogate with a directly preceding
// lone high surrogate (as a JavaScript string would see them).
inline void appendUnit(std::string& out, uint32_t unit) {
  if (unit >= 0xDC00 && unit <= 0xDFFF && out.size() >= 3) {
    const auto* tail = reinterpret_cast<const uint8_t*>(out.data() + out.size() - 3);
    if (tail[0] == 0xED && (tail[1] & 0xF0) == 0xA0) {
      uint32_t high = 0xD000 | ((tail[1] & 0x3F) << 6) | (tail[2] & 0x3F);
      out.resize(out.size() - 3);
      putCodePoint(out, 0x10000 + ((high - 0xD800) << 10) + (unit - 0xDC00));
      return;
    }
  }
  putCodePoint(out, unit);
}

// Decodes one WTF-8 sequence at `i` (input is trusted WTF-8). Returns the code point and advances i.
inline uint32_t decodeAt(std::string_view s, size_t& i) {
  const auto b0 = uint8_t(s[i]);
  if (b0 < 0x80) { i += 1; return b0; }
  if (b0 < 0xE0) { uint32_t cp = ((b0 & 0x1F) << 6) | (uint8_t(s[i + 1]) & 0x3F); i += 2; return cp; }
  if (b0 < 0xF0) { uint32_t cp = ((b0 & 0x0F) << 12) | ((uint8_t(s[i + 1]) & 0x3F) << 6) | (uint8_t(s[i + 2]) & 0x3F); i += 3; return cp; }
  uint32_t cp = ((b0 & 0x07) << 18) | ((uint8_t(s[i + 1]) & 0x3F) << 12) | ((uint8_t(s[i + 2]) & 0x3F) << 6) | (uint8_t(s[i + 3]) & 0x3F);
  i += 4;
  return cp;
}

// Yields UTF-16 code units from WTF-8.
struct Utf16Cursor {
  std::string_view s;
  size_t i = 0;
  uint32_t pendingTrail = 0;
  bool next(uint32_t& unit) {
    if (pendingTrail) { unit = pendingTrail; pendingTrail = 0; return true; }
    if (i >= s.size()) return false;
    uint32_t cp = decodeAt(s, i);
    if (cp >= 0x10000) { cp -= 0x10000; unit = 0xD800 + (cp >> 10); pendingTrail = 0xDC00 + (cp & 0x3FF); }
    else unit = cp;
    return true;
  }
};

// JavaScript `<` on strings: UTF-16 code unit order.
int compareUtf16(std::string_view a, std::string_view b) {
  size_t n = std::min(a.size(), b.size()), i = 0;
  while (i < n && a[i] == b[i]) i++;
  if (i == a.size() || i == b.size()) {
    if (i == a.size() && i == b.size()) return 0;
    // A byte prefix ending on a code point boundary is also a UTF-16 prefix.
    // When the shorter string ended mid-sequence that cannot happen (inputs are whole strings).
    return i == a.size() ? -1 : 1;
  }
  while (i > 0 && (uint8_t(a[i]) & 0xC0) == 0x80) i--;
  Utf16Cursor ca{a.substr(i)}, cb{b.substr(i)};
  uint32_t ua, ub;
  for (;;) {
    bool ha = ca.next(ua), hb = cb.next(ub);
    if (!ha || !hb) return ha == hb ? 0 : (ha ? 1 : -1);
    if (ua != ub) return ua < ub ? -1 : 1;
  }
}

// Every code point below U+0300 is NFC-stable and none of them composes with a neighbour
// unless a combining mark (>= U+0300) is present. In UTF-8 that is: every byte < 0xCC.
inline bool nfcTriviallyStable(std::string_view s) {
  for (unsigned char c : s) if (c >= 0xCC) return false;
  return true;
}

bool normalizeNfc(std::string_view in, std::string& out) {
  if (nfcTriviallyStable(in)) { out.assign(in); return true; }
  if (!gNfc) return false;
  std::u16string units = utf16FromWtf8(in), normalized;
  if (!gNfc(units.data(), units.size(), normalized)) return false;
  out.clear();
  appendWtf8FromUtf16(out, normalized.data(), normalized.size());
  return true;
}

constexpr char kHex[] = "0123456789abcdef";

// JSON.stringify(string) (ES2019 well-formed): escapes ", \, control characters and lone surrogates.
void appendQuoted(std::string& out, std::string_view s) {
  out.push_back('"');
  size_t runStart = 0;
  const size_t n = s.size();
  for (size_t i = 0; i < n;) {
    const auto c = uint8_t(s[i]);
    const char* esc = nullptr;
    char buf[7];
    size_t width = 1;
    if (c == '"') esc = "\\\"";
    else if (c == '\\') esc = "\\\\";
    else if (c < 0x20) {
      switch (c) {
        case '\b': esc = "\\b"; break;
        case '\f': esc = "\\f"; break;
        case '\n': esc = "\\n"; break;
        case '\r': esc = "\\r"; break;
        case '\t': esc = "\\t"; break;
        default:
          buf[0] = '\\'; buf[1] = 'u'; buf[2] = '0'; buf[3] = '0'; buf[4] = kHex[c >> 4]; buf[5] = kHex[c & 15]; buf[6] = 0;
          esc = buf;
      }
    } else if (c == 0xED && i + 2 < n + 0 && (uint8_t(s[i + 1]) & 0xE0) == 0xA0) {
      // Lone surrogate (paired surrogates are always stored as 4-byte sequences).
      uint32_t unit = 0xD000 | ((uint8_t(s[i + 1]) & 0x3F) << 6) | (uint8_t(s[i + 2]) & 0x3F);
      buf[0] = '\\'; buf[1] = 'u';
      buf[2] = kHex[(unit >> 12) & 15]; buf[3] = kHex[(unit >> 8) & 15]; buf[4] = kHex[(unit >> 4) & 15]; buf[5] = kHex[unit & 15]; buf[6] = 0;
      esc = buf;
      width = 3;
    }
    if (esc) {
      out.append(s.data() + runStart, i - runStart);
      out.append(esc);
      i += width;
      runStart = i;
    } else {
      i++;
    }
  }
  out.append(s.data() + runStart, n - runStart);
  out.push_back('"');
}

locale_t cLocale() {
  static locale_t locale = newlocale(LC_ALL_MASK, "C", static_cast<locale_t>(nullptr));
  return locale;
}
}  // namespace

void Wtf8Encoder::append(std::string& out, const char16_t* units, size_t length) {
  // Worst case 3 bytes per unit (a pair is 4 bytes for 2 units), plus a flushed pending surrogate.
  const size_t base = out.size();
  out.resize(base + length * 3 + 3);
  auto* p = reinterpret_cast<uint8_t*>(out.data() + base);
  const auto put3 = [&p](uint32_t cp) { p[0] = uint8_t(0xE0 | (cp >> 12)); p[1] = uint8_t(0x80 | ((cp >> 6) & 63)); p[2] = uint8_t(0x80 | (cp & 63)); p += 3; };
  size_t i = 0;
  if (pendingHigh_ && length > 0) {
    const uint32_t u = units[0];
    if (u >= 0xDC00 && u <= 0xDFFF) {
      const uint32_t cp = 0x10000 + ((pendingHigh_ - 0xD800) << 10) + (u - 0xDC00);
      p[0] = uint8_t(0xF0 | (cp >> 18)); p[1] = uint8_t(0x80 | ((cp >> 12) & 63)); p[2] = uint8_t(0x80 | ((cp >> 6) & 63)); p[3] = uint8_t(0x80 | (cp & 63)); p += 4;
      i = 1;
    } else {
      put3(pendingHigh_);
    }
    pendingHigh_ = 0;
  }
  while (i < length) {
    uint32_t u = units[i];
    if (u < 0x80) {
      // ASCII run.
      do { *p++ = uint8_t(u); if (++i == length) break; u = units[i]; } while (u < 0x80);
      continue;
    }
    if (u < 0x800) { p[0] = uint8_t(0xC0 | (u >> 6)); p[1] = uint8_t(0x80 | (u & 63)); p += 2; i++; continue; }
    if (u >= 0xD800 && u <= 0xDBFF) {
      if (i + 1 == length) { pendingHigh_ = u; i++; continue; }
      const uint32_t next = units[i + 1];
      if (next >= 0xDC00 && next <= 0xDFFF) {
        const uint32_t cp = 0x10000 + ((u - 0xD800) << 10) + (next - 0xDC00);
        p[0] = uint8_t(0xF0 | (cp >> 18)); p[1] = uint8_t(0x80 | ((cp >> 12) & 63)); p[2] = uint8_t(0x80 | ((cp >> 6) & 63)); p[3] = uint8_t(0x80 | (cp & 63)); p += 4;
        i += 2;
        continue;
      }
    }
    put3(u);  // BMP, or an unpaired surrogate as its own 3-byte sequence
    i++;
  }
  out.resize(size_t(reinterpret_cast<char*>(p) - out.data()));
}
void Wtf8Encoder::finish(std::string& out) {
  if (pendingHigh_) { putCodePoint(out, pendingHigh_); pendingHigh_ = 0; }
}
void appendWtf8FromUtf16(std::string& out, const char16_t* units, size_t length) {
  Wtf8Encoder encoder;
  encoder.append(out, units, length);
  encoder.finish(out);
}
std::u16string utf16FromWtf8(std::string_view wtf8) {
  std::u16string out;
  out.reserve(wtf8.size());
  Utf16Cursor cursor{wtf8};
  uint32_t unit;
  while (cursor.next(unit)) out.push_back(char16_t(unit));
  return out;
}

// ===========================================================================
// SHA-256
// ===========================================================================

Sha256::Sha256() : adapter_(gDigest) { adapter_.init(state_); }
void Sha256::update(const void* bytes, size_t length) { adapter_.update(state_, static_cast<const uint8_t*>(bytes), length); }
void Sha256::updateUtf16(const char16_t* units, size_t length) {
  constexpr size_t kChunk = 16384;
  for (size_t offset = 0; offset < length; offset += kChunk) {
    scratch_.clear();
    encoder_.append(scratch_, units + offset, std::min(kChunk, length - offset));
    update(scratch_.data(), scratch_.size());
  }
}
void Sha256::updateAscii(const char* chars, size_t length) {
  scratch_.clear();
  encoder_.finish(scratch_);
  if (!scratch_.empty()) update(scratch_.data(), scratch_.size());
  update(chars, length);
}
std::string Sha256::finishHex() {
  scratch_.clear();
  encoder_.finish(scratch_);
  if (!scratch_.empty()) update(scratch_.data(), scratch_.size());
  uint8_t digest[32];
  adapter_.finish(state_, digest);
  std::string hex(64, '0');
  for (int i = 0; i < 32; i++) { hex[i * 2] = kHex[digest[i] >> 4]; hex[i * 2 + 1] = kHex[digest[i] & 15]; }
  return hex;
}
std::string sha256Hex(std::string_view wtf8) {
  Sha256 sha;
  sha.update(wtf8.data(), wtf8.size());
  return sha.finishHex();
}

// ===========================================================================
// Numbers: ECMAScript Number::toString(10)
// ===========================================================================

void appendEcmaNumber(std::string& out, double value) {
  if (value == 0) { out.push_back('0'); return; }  // also -0
  if (value < 0) { out.push_back('-'); value = -value; }
  if (value < 9007199254740992.0 && value == std::floor(value)) {
    char buf[24];
    auto r = std::to_chars(buf, buf + sizeof buf, static_cast<uint64_t>(value));
    out.append(buf, r.ptr);
    return;
  }
  char buf[40];
  auto r = std::to_chars(buf, buf + sizeof buf, value, std::chars_format::scientific);  // shortest round-trip
  // Layout: d[.ddd]e[+-]XX
  char digits[24];
  int k = 0;
  const char* p = buf;
  while (p < r.ptr && *p != 'e') { if (*p != '.') digits[k++] = *p; p++; }
  int exponent = 0;
  bool negativeExponent = false;
  if (p < r.ptr) {
    p++;
    if (*p == '-') { negativeExponent = true; p++; } else if (*p == '+') p++;
    while (p < r.ptr) exponent = exponent * 10 + (*p++ - '0');
  }
  if (negativeExponent) exponent = -exponent;
  const int n = exponent + 1;
  if (k <= n && n <= 21) {
    out.append(digits, k);
    out.append(size_t(n - k), '0');
  } else if (0 < n && n <= 21) {
    out.append(digits, n);
    out.push_back('.');
    out.append(digits + n, k - n);
  } else if (-6 < n && n <= 0) {
    out.append("0.");
    out.append(size_t(-n), '0');
    out.append(digits, k);
  } else {
    out.push_back(digits[0]);
    if (k > 1) { out.push_back('.'); out.append(digits + 1, k - 1); }
    out.push_back('e');
    const int e = n - 1;
    out.push_back(e < 0 ? '-' : '+');
    char eb[8];
    auto er = std::to_chars(eb, eb + sizeof eb, e < 0 ? -e : e);
    out.append(eb, er.ptr);
  }
}

// ===========================================================================
// JSON parser + profile serializers
// ===========================================================================

namespace {

constexpr int kMaxDepth = 512;

struct Member {
  std::string key;      // exact decoded key (WTF-8)
  std::string sortKey;  // NFC key (profile CanonicalJsonV1 / RecordFingerprintPayload), else empty
  size_t valueStart;
  size_t valueEnd;
};

enum class ScalarKind { None, String, Number, Other };

class Engine {
 public:
  Engine(std::string_view input, Profile profile, bool emit) : in_(input), profile_(profile), emit_(emit) {}

  const char* run() {
    skipWs();
    if (!parseValue(0)) return error_ ? error_ : error::kJsonSyntax;
    skipWs();
    if (pos_ != in_.size()) return error::kJsonSyntax;
    if (emit_ && profile_ == Profile::RecordFingerprintPayload && !recordRootOk_) return error::kRecordUnsupportedValue;
    return nullptr;
  }
  std::string& output() { return out_; }

  // Envelope probe (emit == false): root object members.
  bool rootIsObject = false;
  size_t rootKeyCount = 0;
  bool hasPayload = false;
  bool schemaOk = false;
  bool revisionOk = false;

 private:
  std::string_view in_;
  size_t pos_ = 0;
  Profile profile_;
  bool emit_;
  const char* error_ = nullptr;
  bool recordRootOk_ = false;
  std::string out_;
  std::string keyScratch_;
  std::vector<Member> members_;
  // Last scalar parsed (for the envelope probe).
  ScalarKind lastKind_ = ScalarKind::None;
  double lastNumber_ = 0;
  std::string lastString_;

  bool fail(const char* code) { if (!error_) error_ = code; return false; }

  void skipWs() {
    while (pos_ < in_.size()) {
      char c = in_[pos_];
      if (c == ' ' || c == '\n' || c == '\r' || c == '\t') pos_++;
      else break;
    }
  }

  bool parseValue(int depth) {
    if (depth > kMaxDepth) return fail(error::kTooDeep);
    if (pos_ >= in_.size()) return fail(error::kJsonSyntax);
    lastKind_ = ScalarKind::Other;
    switch (in_[pos_]) {
      case '{': return parseObject(depth);
      case '[': return parseArray(depth);
      case '"': return parseStringValue();
      case 't': return literal("true");
      case 'f': return literal("false");
      case 'n': return literal("null");
      default: return parseNumber();
    }
  }

  bool literal(std::string_view word) {
    if (in_.substr(pos_, word.size()) != word) return fail(error::kJsonSyntax);
    pos_ += word.size();
    if (emit_) out_.append(word);
    return true;
  }

  bool parseNumber() {
    const size_t start = pos_;
    bool integer = true;
    if (pos_ < in_.size() && in_[pos_] == '-') pos_++;
    if (pos_ >= in_.size()) return fail(error::kJsonSyntax);
    if (in_[pos_] == '0') pos_++;
    else if (in_[pos_] >= '1' && in_[pos_] <= '9') { while (pos_ < in_.size() && in_[pos_] >= '0' && in_[pos_] <= '9') pos_++; }
    else return fail(error::kJsonSyntax);
    if (pos_ < in_.size() && in_[pos_] == '.') {
      integer = false;
      pos_++;
      size_t d = pos_;
      while (pos_ < in_.size() && in_[pos_] >= '0' && in_[pos_] <= '9') pos_++;
      if (pos_ == d) return fail(error::kJsonSyntax);
    }
    if (pos_ < in_.size() && (in_[pos_] == 'e' || in_[pos_] == 'E')) {
      integer = false;
      pos_++;
      if (pos_ < in_.size() && (in_[pos_] == '+' || in_[pos_] == '-')) pos_++;
      size_t d = pos_;
      while (pos_ < in_.size() && in_[pos_] >= '0' && in_[pos_] <= '9') pos_++;
      if (pos_ == d) return fail(error::kJsonSyntax);
    }
    std::string_view token = in_.substr(start, pos_ - start);
    const size_t digitCount = token.size() - (token[0] == '-' ? 1 : 0);
    double value;
    if (integer && digitCount <= 15) {
      // Exact: |value| < 1e15 < 2^53. JSON forbids leading zeros, so the digits print as-is.
      int64_t v = 0;
      for (size_t i = token[0] == '-' ? 1 : 0; i < token.size(); i++) v = v * 10 + (token[i] - '0');
      value = token[0] == '-' ? -double(v) : double(v);
      if (emit_) {
        if (v == 0) out_.push_back('0');
        else out_.append(token);
      }
    } else {
      char stackBuf[64];
      std::string heapBuf;
      const char* cstr;
      if (token.size() < sizeof stackBuf) { std::memcpy(stackBuf, token.data(), token.size()); stackBuf[token.size()] = 0; cstr = stackBuf; }
      else { heapBuf.assign(token); cstr = heapBuf.c_str(); }
      value = strtod_l(cstr, nullptr, cLocale());
      if (!std::isfinite(value)) {
        // JSON.parse yields ±Infinity; every profile rejects non-finite numbers, but JSON.parse itself succeeds.
        if (emit_) return fail(profile_ == Profile::CanonicalJsonV1 ? error::kCanonicalJsonNonFinite
                               : profile_ == Profile::RecordFingerprintPayload ? error::kRecordUnsupportedValue
                                                                               : error::kCanonicalSerializeNonFinite);
      } else if (emit_) {
        appendEcmaNumber(out_, value);
      }
    }
    lastKind_ = ScalarKind::Number;
    lastNumber_ = value;
    return true;
  }

  // Decodes a JSON string token at pos_ ('"'). On return `view` is either a slice of the input
  // (no escapes, no surrogate bytes) or `owned`.
  bool readString(std::string_view& view, std::string& owned) {
    pos_++;  // opening quote
    const size_t start = pos_;
    bool simple = true;
    while (true) {
      if (pos_ >= in_.size()) return fail(error::kJsonSyntax);
      const auto c = uint8_t(in_[pos_]);
      if (c == '"') break;
      if (c < 0x20) return fail(error::kJsonSyntax);
      if (c == '\\' || c == 0xED) { simple = false; break; }
      pos_++;
    }
    if (simple) {
      view = in_.substr(start, pos_ - start);
      pos_++;
      return true;
    }
    owned.assign(in_.data() + start, pos_ - start);
    while (true) {
      if (pos_ >= in_.size()) return fail(error::kJsonSyntax);
      const auto c = uint8_t(in_[pos_]);
      if (c == '"') { pos_++; break; }
      if (c < 0x20) return fail(error::kJsonSyntax);
      if (c == '\\') {
        if (pos_ + 1 >= in_.size()) return fail(error::kJsonSyntax);
        const char e = in_[pos_ + 1];
        pos_ += 2;
        switch (e) {
          case '"': owned.push_back('"'); break;
          case '\\': owned.push_back('\\'); break;
          case '/': owned.push_back('/'); break;
          case 'b': owned.push_back('\b'); break;
          case 'f': owned.push_back('\f'); break;
          case 'n': owned.push_back('\n'); break;
          case 'r': owned.push_back('\r'); break;
          case 't': owned.push_back('\t'); break;
          case 'u': {
            if (pos_ + 4 > in_.size()) return fail(error::kJsonSyntax);
            uint32_t unit = 0;
            for (int i = 0; i < 4; i++) {
              char h = in_[pos_ + i];
              unit <<= 4;
              if (h >= '0' && h <= '9') unit |= uint32_t(h - '0');
              else if (h >= 'a' && h <= 'f') unit |= uint32_t(h - 'a' + 10);
              else if (h >= 'A' && h <= 'F') unit |= uint32_t(h - 'A' + 10);
              else return fail(error::kJsonSyntax);
            }
            pos_ += 4;
            appendUnit(owned, unit);
            break;
          }
          default: return fail(error::kJsonSyntax);
        }
        continue;
      }
      if (c == 0xED && pos_ + 2 < in_.size() && (uint8_t(in_[pos_ + 1]) & 0xE0) == 0xA0) {
        // Raw lone surrogate in the input: merge with neighbours exactly like a JS string.
        uint32_t unit = 0xD000 | ((uint8_t(in_[pos_ + 1]) & 0x3F) << 6) | (uint8_t(in_[pos_ + 2]) & 0x3F);
        pos_ += 3;
        appendUnit(owned, unit);
        continue;
      }
      owned.push_back(char(c));
      pos_++;
    }
    view = owned;
    return true;
  }

  bool parseStringValue() {
    std::string_view view;
    std::string owned;
    if (!readString(view, owned)) return false;
    lastKind_ = ScalarKind::String;
    if (!emit_) { lastString_.assign(view); return true; }
    if (profile_ == Profile::CanonicalJsonV1 && !nfcTriviallyStable(view)) {
      std::string normalized;
      if (!normalizeNfc(view, normalized)) return fail(error::kNfcUnavailable);
      appendQuoted(out_, normalized);
    } else {
      appendQuoted(out_, view);
    }
    return true;
  }

  bool parseArray(int depth) {
    pos_++;
    if (emit_) out_.push_back('[');
    skipWs();
    if (pos_ < in_.size() && in_[pos_] == ']') { pos_++; if (emit_) out_.push_back(']'); return true; }
    while (true) {
      skipWs();
      if (!parseValue(depth + 1)) return false;
      skipWs();
      if (pos_ >= in_.size()) return fail(error::kJsonSyntax);
      if (in_[pos_] == ',') { pos_++; if (emit_) out_.push_back(','); continue; }
      if (in_[pos_] == ']') { pos_++; if (emit_) out_.push_back(']'); lastKind_ = ScalarKind::Other; return true; }
      return fail(error::kJsonSyntax);
    }
  }

  bool parseObject(int depth) {
    pos_++;
    const size_t regionStart = out_.size();
    const size_t base = members_.size();
    const bool probeRoot = !emit_ && depth == 0;
    if (probeRoot) rootIsObject = true;
    std::vector<std::string> rootKeys;
    skipWs();
    bool empty = pos_ < in_.size() && in_[pos_] == '}';
    if (empty) pos_++;
    while (!empty) {
      skipWs();
      if (pos_ >= in_.size() || in_[pos_] != '"') return fail(error::kJsonSyntax);
      std::string_view keyView;
      if (!readString(keyView, keyScratch_)) return false;
      std::string key(keyView);
      skipWs();
      if (pos_ >= in_.size() || in_[pos_] != ':') return fail(error::kJsonSyntax);
      pos_++;
      skipWs();
      const size_t valueStart = out_.size();
      if (!parseValue(depth + 1)) return false;
      if (probeRoot) {
        if (key == "schemaIdentity") schemaOk = lastKind_ == ScalarKind::String && lastString_ == "patternly:canonical:v1";
        else if (key == "revision") revisionOk = lastKind_ == ScalarKind::Number && lastNumber_ >= 1 && lastNumber_ <= 9007199254740991.0 && std::floor(lastNumber_) == lastNumber_;
        else if (key == "payload") hasPayload = true;
        rootKeys.push_back(std::move(key));
      } else if (emit_) {
        members_.push_back(Member{std::move(key), std::string(), valueStart, out_.size()});
      }
      skipWs();
      if (pos_ >= in_.size()) return fail(error::kJsonSyntax);
      if (in_[pos_] == ',') { pos_++; continue; }
      if (in_[pos_] == '}') { pos_++; break; }
      return fail(error::kJsonSyntax);
    }
    lastKind_ = ScalarKind::Other;
    if (probeRoot) {
      std::sort(rootKeys.begin(), rootKeys.end());
      rootKeyCount = size_t(std::unique(rootKeys.begin(), rootKeys.end()) - rootKeys.begin());
      return true;
    }
    if (!emit_) return true;
    if (members_.size() == base) { out_.push_back('{'); out_.push_back('}'); return true; }
    return emitObject(regionStart, base, depth);
  }

  bool emitObject(size_t regionStart, size_t base, int depth) {
    auto first = members_.begin() + std::ptrdiff_t(base);
    auto last = members_.end();
    // JSON.parse: exact duplicate keys keep the last value.
    std::stable_sort(first, last, [](const Member& a, const Member& b) { return compareUtf16(a.key, b.key) < 0; });
    auto write = first;
    for (auto it = first; it != last;) {
      auto next = it + 1;
      while (next != last && next->key == it->key) ++next;
      if (write != next - 1) *write = std::move(*(next - 1));
      ++write;
      it = next;
    }
    last = write;
    if (profile_ == Profile::RecordFingerprintPayload && depth == 0) {
      // recordFingerprintPayload reads exactly these four properties of the record.
      static constexpr std::string_view kFields[] = {"recordId", "recordType", "state", "trackId"};
      auto keep = first;
      size_t found = 0;
      for (auto it = first; it != last; ++it) {
        if (std::find(std::begin(kFields), std::end(kFields), std::string_view(it->key)) == std::end(kFields)) continue;
        if (keep != it) *keep = std::move(*it);
        ++keep;
        ++found;
      }
      if (found != 4) return fail(error::kRecordUnsupportedValue);
      last = keep;
      recordRootOk_ = true;
    }
    const bool needsNfcKeys = profile_ == Profile::RecordFingerprintPayload || profile_ == Profile::CanonicalJsonV1;
    bool anyNormalizedDiffers = false;
    if (needsNfcKeys) {
      for (auto it = first; it != last; ++it) {
        if (nfcTriviallyStable(it->key)) continue;
        if (!normalizeNfc(it->key, it->sortKey)) return fail(error::kNfcUnavailable);
        if (it->sortKey != it->key) anyNormalizedDiffers = true;
        else it->sortKey.clear();
      }
      if (anyNormalizedDiffers) {
        auto keyOf = [](const Member& m) -> const std::string& { return m.sortKey.empty() ? m.key : m.sortKey; };
        std::vector<const Member*> order;
        for (auto it = first; it != last; ++it) order.push_back(&*it);
        std::sort(order.begin(), order.end(), [&](const Member* a, const Member* b) { return compareUtf16(keyOf(*a), keyOf(*b)) < 0; });
        for (size_t i = 1; i < order.size(); i++) {
          if (keyOf(*order[i]) == keyOf(*order[i - 1])) {
            return fail(profile_ == Profile::CanonicalJsonV1 ? error::kCanonicalJsonDuplicateKey : error::kRecordDuplicateKey);
          }
        }
        if (profile_ == Profile::CanonicalJsonV1) {
          std::stable_sort(first, last, [&](const Member& a, const Member& b) { return compareUtf16(keyOf(a), keyOf(b)) < 0; });
        }
      }
    }
    std::string values(out_, regionStart);
    out_.resize(regionStart);
    out_.push_back('{');
    bool comma = false;
    for (auto it = first; it != last; ++it) {
      if (comma) out_.push_back(',');
      comma = true;
      const bool rewriteKey = profile_ == Profile::CanonicalJsonV1 && !it->sortKey.empty();
      appendQuoted(out_, rewriteKey ? it->sortKey : it->key);
      out_.push_back(':');
      out_.append(values, it->valueStart - regionStart, it->valueEnd - it->valueStart);
    }
    out_.push_back('}');
    members_.resize(base);
    return true;
  }
};

}  // namespace

Result serialize(Profile profile, std::string_view json) {
  Result result;
  if (int(profile) < 0 || int(profile) > 3) { result.error = error::kBadProfile; return result; }
  Engine engine(json, profile == Profile::CanonicalFingerprintPayload ? Profile::CanonicalSerialize : profile, true);
  if (const char* code = engine.run()) { result.error = code; return result; }
  if (profile == Profile::CanonicalFingerprintPayload) {
    static constexpr std::string_view prefix = "{\"serializerVersion\":\"canonical-json-utf8-v1\",\"value\":";
    result.value.reserve(prefix.size() + engine.output().size() + 1);
    result.value.append(prefix);
    result.value.append(engine.output());
    result.value.push_back('}');
  } else {
    result.value = std::move(engine.output());
  }
  return result;
}

Result fingerprint(Profile profile, std::string_view json) {
  Result result = serialize(profile, json);
  if (result.ok()) result.value = sha256Hex(result.value);
  return result;
}

const char* validateEnvelope(std::string_view json) {
  Engine engine(json, Profile::CanonicalSerialize, false);
  if (engine.run()) return error::kEnvelopeCorrupt;
  if (!engine.rootIsObject || engine.rootKeyCount != 3 || !engine.hasPayload || !engine.schemaOk || !engine.revisionOk) return error::kEnvelopeUnsupported;
  return nullptr;
}

}  // namespace patternly::core
