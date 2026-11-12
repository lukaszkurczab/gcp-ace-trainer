// Host test driver for the Patternly core (macOS). Compiled and driven by
// scripts/qa/nativeCoreParity.test.ts; not part of the app.
//
// stdin frames:  "<op> <profile> <length>\n<length bytes of WTF-8>"
//   op: s = serialize, f = fingerprint, h = sha256, e = validateEnvelope,
//       u = sha256 of UTF-16LE code units (the in-app path), fed in chunks of <profile> units (0 = one chunk)
// stdout frames: "O <length>\n<bytes>" or "E <code>\n"
// argv[1] == "--portable": keep the portable SHA-256 and no NFC adapter.
// argv[1] == "--no-nfc": Apple SHA-256, no NFC adapter (NFC-needing inputs report nfc_unavailable).

#include "../cpp/PatternlyCore.hpp"
#if defined(__APPLE__)
#include "../apple/PatternlyCoreApple.hpp"
#endif

#include <cstdio>
#include <algorithm>
#include <cstring>
#include <iostream>
#include <string>

using namespace patternly::core;

int main(int argc, char** argv) {
  std::ios::sync_with_stdio(false);
#if defined(__APPLE__)
  if (!(argc > 1 && std::strcmp(argv[1], "--portable") == 0)) apple::install();
#endif
  if (argc > 1 && std::strcmp(argv[1], "--no-nfc") == 0) setNfcAdapter(nullptr);
  std::string header, payload;
  while (std::getline(std::cin, header)) {
    char op = 0;
    int profile = 0;
    size_t length = 0;
    if (std::sscanf(header.c_str(), "%c %d %zu", &op, &profile, &length) != 3) return 2;
    payload.resize(length);
    if (length && !std::cin.read(payload.data(), std::streamsize(length))) return 3;
    Result result;
    switch (op) {
      case 's': result = serialize(Profile(profile), payload); break;
      case 'f': result = fingerprint(Profile(profile), payload); break;
      case 'h': result.value = sha256Hex(payload); break;
      case 'u': {
        Sha256 sha;
        const auto* units = reinterpret_cast<const char16_t*>(payload.data());
        const size_t count = payload.size() / 2, chunk = profile > 0 ? size_t(profile) : (count ? count : 1);
        for (size_t offset = 0; offset < count; offset += chunk) sha.updateUtf16(units + offset, std::min(chunk, count - offset));
        result.value = sha.finishHex();
        break;
      }
      case 'e': result.error = validateEnvelope(payload); if (!result.error) result.value = "ok"; break;
      default: return 4;
    }
    if (result.ok()) std::cout << "O " << result.value.size() << "\n" << result.value;
    else std::cout << "E " << result.error << "\n";
  }
  std::cout.flush();
  return 0;
}
