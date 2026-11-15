// T2.5 stage 4: the `PatternlyFirstScreen` Nitro HybridObject (same hand-written pattern as
// PatternlyForegroundClock). JS: `NitroModules.createHybridObject("PatternlyFirstScreen")`.
// Every method forwards to the Swift `PatternlyFirstScreenBridge`; strings only, "" means null.
#import <Foundation/Foundation.h>
#include <NitroModules/HybridObject.hpp>
#include <NitroModules/HybridObjectRegistry.hpp>
#include <memory>
#include <string>

#if __has_include(<PatternlyFirstScreen/PatternlyFirstScreen-Swift.h>)
#import <PatternlyFirstScreen/PatternlyFirstScreen-Swift.h>
#else
#import "PatternlyFirstScreen-Swift.h"
#endif

using margelo::nitro::HybridObject;
using margelo::nitro::HybridObjectRegistry;
using margelo::nitro::Prototype;

namespace {
NSString* ns(const std::string& value) { return [NSString stringWithUTF8String:value.c_str()] ?: @""; }
std::string std_string(NSString* value) { return value ? std::string(value.UTF8String ?: "") : std::string(); }
}

class PatternlyFirstScreen final : public HybridObject {
public:
  PatternlyFirstScreen() : HybridObject("PatternlyFirstScreen") {}

  /// Stores the serialized first-screen record in the keychain; false when it was not stored.
  bool write(const std::string& json) { @autoreleasepool { return [PatternlyFirstScreenBridge writeRecord:ns(json)]; } }
  void clear() { @autoreleasepool { [PatternlyFirstScreenBridge clearRecord]; } }
  std::string shownSnapshot() { @autoreleasepool { return std_string([PatternlyFirstScreenBridge shownSnapshotJSON]); } }
  void markRnReady(const std::string& surface, const std::string& profileId, const std::string& revision) {
    @autoreleasepool { [PatternlyFirstScreenBridge markRnReadyWithSurface:ns(surface) profileId:ns(profileId) revision:ns(revision)]; }
  }
  std::string takePendingAction() { @autoreleasepool { return std_string([PatternlyFirstScreenBridge takePendingActionJSON]); } }

  void loadHybridMethods() override {
    HybridObject::loadHybridMethods();
    registerHybrids(this, [](Prototype& prototype) {
      prototype.registerHybridMethod("write", &PatternlyFirstScreen::write);
      prototype.registerHybridMethod("clear", &PatternlyFirstScreen::clear);
      prototype.registerHybridMethod("shownSnapshot", &PatternlyFirstScreen::shownSnapshot);
      prototype.registerHybridMethod("markRnReady", &PatternlyFirstScreen::markRnReady);
      prototype.registerHybridMethod("takePendingAction", &PatternlyFirstScreen::takePendingAction);
    });
  }
};

@interface PatternlyFirstScreenRegistration : NSObject
@end
@implementation PatternlyFirstScreenRegistration
+ (void)load {
  HybridObjectRegistry::registerHybridObjectConstructor("PatternlyFirstScreen", []() -> std::shared_ptr<HybridObject> {
    return std::make_shared<PatternlyFirstScreen>();
  });
}
@end
