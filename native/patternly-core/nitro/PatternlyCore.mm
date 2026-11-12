// Thin Nitro adapter over the JSI-independent Patternly core (Plan T1.1, B0).
//
// Methods are raw JSI methods so string arguments are read with
// `jsi::String::getStringData` (ASCII or UTF-16 chunks, no lossy UTF-8
// conversion): unpaired surrogates reach the core intact as WTF-8.
// JS-facing contract (see src/infrastructure/identity/installNativeCore.ts):
//   sha256(value: string): string                      hex digest of the WTF-8 bytes
//   serialize(profile: number, json: string): string | undefined
//   fingerprint(profile: number, json: string): string | undefined
//   validateEnvelope(raw: string): string              "ok" | error code
//   lastError(): string                                code of the last undefined result
//   setNfcEnabled(enabled: boolean): void              native NFC on/off (off => NFC inputs fall back)

#import <Foundation/Foundation.h>
#include "../cpp/PatternlyCore.hpp"
#include "../apple/PatternlyCoreApple.hpp"
#include <NitroModules/HybridObject.hpp>
#include <NitroModules/HybridObjectRegistry.hpp>
#include <jsi/jsi.h>
#include <string>

using namespace facebook;
using margelo::nitro::HybridObject;
using margelo::nitro::HybridObjectRegistry;
using margelo::nitro::Prototype;
namespace core = patternly::core;

namespace {
void readWtf8(jsi::Runtime& runtime, const jsi::Value& value, std::string& out) {
  if (!value.isString()) throw jsi::JSError(runtime, "patternly_core_expected_string");
  const jsi::String string = value.getString(runtime);
  out.clear();
  core::Wtf8Encoder encoder;
  auto callback = [&](bool ascii, const void* data, size_t length) {
    if (ascii) {
      encoder.finish(out);
      out.append(static_cast<const char*>(data), length);
    } else {
      encoder.append(out, static_cast<const char16_t*>(data), length);
    }
  };
  string.getStringData(runtime, callback);
  encoder.finish(out);
}

jsi::Value toJs(jsi::Runtime& runtime, const std::string& value) {
  return jsi::String::createFromUtf8(runtime, reinterpret_cast<const uint8_t*>(value.data()), value.size());
}

int readProfile(jsi::Runtime& runtime, const jsi::Value& value) {
  if (!value.isNumber()) throw jsi::JSError(runtime, "patternly_core_expected_profile");
  return int(value.getNumber());
}
}  // namespace

class PatternlyCoreHybrid final : public HybridObject {
 public:
  PatternlyCoreHybrid() : HybridObject("PatternlyCore") {}

  jsi::Value sha256(jsi::Runtime& runtime, const jsi::Value&, const jsi::Value* args, size_t count) {
    if (count < 1 || !args[0].isString()) throw jsi::JSError(runtime, "patternly_core_expected_string");
    const jsi::String string = args[0].getString(runtime);
    core::Sha256 sha;
    auto callback = [&](bool ascii, const void* data, size_t length) {
      if (ascii) sha.updateAscii(static_cast<const char*>(data), length);  // ASCII bytes are their own UTF-8
      else sha.updateUtf16(static_cast<const char16_t*>(data), length);
    };
    string.getStringData(runtime, callback);
    return toJs(runtime, sha.finishHex());
  }

  jsi::Value serialize(jsi::Runtime& runtime, const jsi::Value&, const jsi::Value* args, size_t count) {
    return runProfile(runtime, args, count, false);
  }

  jsi::Value fingerprint(jsi::Runtime& runtime, const jsi::Value&, const jsi::Value* args, size_t count) {
    return runProfile(runtime, args, count, true);
  }

  jsi::Value validateEnvelope(jsi::Runtime& runtime, const jsi::Value&, const jsi::Value* args, size_t count) {
    if (count < 1) throw jsi::JSError(runtime, "patternly_core_expected_string");
    readWtf8(runtime, args[0], scratch_);
    const char* code = core::validateEnvelope(scratch_);
    return toJs(runtime, code ? std::string(code) : std::string("ok"));
  }

  jsi::Value lastError(jsi::Runtime& runtime, const jsi::Value&, const jsi::Value*, size_t) {
    return toJs(runtime, lastError_);
  }

  jsi::Value setNfcEnabled(jsi::Runtime& runtime, const jsi::Value&, const jsi::Value* args, size_t count) {
    const bool enabled = count > 0 && args[0].isBool() && args[0].getBool();
    patternly::core::apple::install();
    if (!enabled) core::setNfcAdapter(nullptr);
    (void)runtime;
    return jsi::Value::undefined();
  }

  void loadHybridMethods() override {
    HybridObject::loadHybridMethods();
    registerHybrids(this, [](Prototype& prototype) {
      prototype.registerRawHybridMethod("sha256", 1, &PatternlyCoreHybrid::sha256);
      prototype.registerRawHybridMethod("serialize", 2, &PatternlyCoreHybrid::serialize);
      prototype.registerRawHybridMethod("fingerprint", 2, &PatternlyCoreHybrid::fingerprint);
      prototype.registerRawHybridMethod("validateEnvelope", 1, &PatternlyCoreHybrid::validateEnvelope);
      prototype.registerRawHybridMethod("lastError", 0, &PatternlyCoreHybrid::lastError);
      prototype.registerRawHybridMethod("setNfcEnabled", 1, &PatternlyCoreHybrid::setNfcEnabled);
    });
  }

 private:
  std::string scratch_;
  std::string lastError_;

  jsi::Value runProfile(jsi::Runtime& runtime, const jsi::Value* args, size_t count, bool digest) {
    if (count < 2) throw jsi::JSError(runtime, "patternly_core_expected_arguments");
    const int profile = readProfile(runtime, args[0]);
    readWtf8(runtime, args[1], scratch_);
    core::Result result = digest ? core::fingerprint(core::Profile(profile), scratch_) : core::serialize(core::Profile(profile), scratch_);
    if (!result.ok()) {
      lastError_ = result.error;
      return jsi::Value::undefined();
    }
    return toJs(runtime, result.value);
  }
};

@interface PatternlyCoreRegistration : NSObject
@end
@implementation PatternlyCoreRegistration
+ (void)load {
  patternly::core::apple::install();
  HybridObjectRegistry::registerHybridObjectConstructor("PatternlyCore", []() -> std::shared_ptr<HybridObject> {
    return std::make_shared<PatternlyCoreHybrid>();
  });
}
@end
