// Apple platform adapters for the Patternly core (iOS app and macOS host tests).
// SHA-256: CommonCrypto (hardware-accelerated). NFC: CFStringNormalize, the same
// normalizer Hermes uses for String.prototype.normalize on Apple platforms.

#include "PatternlyCoreApple.hpp"
#include "../cpp/PatternlyCore.hpp"

#include <CommonCrypto/CommonDigest.h>
#include <CoreFoundation/CoreFoundation.h>

namespace patternly::core::apple {
namespace {
static_assert(sizeof(CC_SHA256_CTX) <= sizeof(Sha256State), "Sha256State too small for CC_SHA256_CTX");

void ccInit(Sha256State& state) { CC_SHA256_Init(reinterpret_cast<CC_SHA256_CTX*>(state.opaque)); }
void ccUpdate(Sha256State& state, const uint8_t* data, size_t length) {
  auto* ctx = reinterpret_cast<CC_SHA256_CTX*>(state.opaque);
  // CC_LONG is 32-bit.
  while (length > 0) {
    const CC_LONG chunk = length > 0x40000000 ? 0x40000000 : CC_LONG(length);
    CC_SHA256_Update(ctx, data, chunk);
    data += chunk;
    length -= chunk;
  }
}
void ccFinish(Sha256State& state, uint8_t out[32]) { CC_SHA256_Final(out, reinterpret_cast<CC_SHA256_CTX*>(state.opaque)); }

bool cfNfc(const char16_t* units, size_t length, std::u16string& out) {
  CFMutableStringRef string = CFStringCreateMutable(kCFAllocatorDefault, 0);
  if (!string) return false;
  CFStringAppendCharacters(string, reinterpret_cast<const UniChar*>(units), CFIndex(length));
  CFStringNormalize(string, kCFStringNormalizationFormC);
  const CFIndex count = CFStringGetLength(string);
  out.resize(size_t(count));
  CFStringGetCharacters(string, CFRangeMake(0, count), reinterpret_cast<UniChar*>(out.data()));
  CFRelease(string);
  return true;
}
}  // namespace

void install() {
  setDigestAdapter(DigestAdapter{ccInit, ccUpdate, ccFinish});
  setNfcAdapter(cfNfc);
}

}  // namespace patternly::core::apple
