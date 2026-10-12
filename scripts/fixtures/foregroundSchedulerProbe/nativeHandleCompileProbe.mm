#include <NitroMmkv/HybridMMKVSpec.hpp>
#include <NitroModules/JSIConverter.hpp>
#include <memory>
using margelo::nitro::HybridObject;
using margelo::nitro::mmkv::HybridMMKVSpec;
std::shared_ptr<HybridMMKVSpec> acceptExisting(facebook::jsi::Runtime& runtime, const facebook::jsi::Value& value) {
  return margelo::nitro::JSIConverter<std::shared_ptr<HybridMMKVSpec>>::fromJSI(runtime, value);
}
bool sameExisting(const std::shared_ptr<HybridMMKVSpec>& handle, const std::shared_ptr<HybridObject>& original) {
  return handle && handle->equals(original);
}
