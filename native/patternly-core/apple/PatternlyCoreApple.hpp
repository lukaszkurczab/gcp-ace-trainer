#pragma once

namespace patternly::core::apple {
// Installs CommonCrypto SHA-256 and CoreFoundation NFC into the core. Idempotent.
void install();
}  // namespace patternly::core::apple
