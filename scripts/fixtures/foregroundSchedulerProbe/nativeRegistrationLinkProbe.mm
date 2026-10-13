// Diagnostic only: compile/link retention, never installed or invoked by the app.
#import <Foundation/Foundation.h>
#include <NitroModules/HybridObject.hpp>
#include <NitroModules/HybridObjectRegistry.hpp>
#include <NitroMmkv/HybridMMKVSpec.hpp>
#include <memory>

using margelo::nitro::HybridObject;
using margelo::nitro::HybridObjectRegistry;
using margelo::nitro::Prototype;
using margelo::nitro::mmkv::HybridMMKVSpec;

class PatternlyForegroundHandleLinkProbe final : public HybridObject {
public:
  PatternlyForegroundHandleLinkProbe() : HybridObject("PatternlyForegroundHandleLinkProbe") {}

  bool sameHandle(std::shared_ptr<HybridMMKVSpec> left, std::shared_ptr<HybridMMKVSpec> right) {
    return left && right && left->equals(right);
  }

  void loadHybridMethods() override {
    HybridObject::loadHybridMethods();
    registerHybrids(this, [](Prototype& prototype) {
      prototype.registerHybridMethod("sameHandle", &PatternlyForegroundHandleLinkProbe::sameHandle);
    });
  }
};

@interface PatternlyForegroundHandleLinkRegistration : NSObject
@end

@implementation PatternlyForegroundHandleLinkRegistration
+ (void)load {
  HybridObjectRegistry::registerHybridObjectConstructor("PatternlyForegroundHandleLinkProbe", []() -> std::shared_ptr<HybridObject> {
    return std::make_shared<PatternlyForegroundHandleLinkProbe>();
  });
}
@end
