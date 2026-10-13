// Compile the delivered owner once in this isolated executable. No alternate
// clock algorithm, app entry point, MMKV database, filesystem or Keychain.
#include "../../native/foreground-clock/PatternlyForegroundClock.mm"
#include <iostream>

using namespace margelo::nitro;
using namespace margelo::nitro::mmkv;
enum class Failure { none, readBefore, writeBefore, writeAfter, readbackThrow, readbackMismatch };
class FaultingMemorySlot final : public HybridMMKVSpec {
public:
  Raw raw;
  Failure failure = Failure::none;
  int reads = 0, writes = 0;
  bool attemptedWrite = false;
  explicit FaultingMemorySlot(std::string initial) : HybridObject("P11MemoryOnly"), raw(std::move(initial)) {}
  std::optional<std::string> getString(const std::string&) override {
    reads++;
    if (failure == Failure::readBefore || (attemptedWrite && failure == Failure::readbackThrow)) throw std::runtime_error("synthetic_read");
    if (attemptedWrite && failure == Failure::readbackMismatch) return "synthetic_conflict";
    return raw;
  }
  void set(const std::string&, const std::variant<bool, std::shared_ptr<ArrayBuffer>, std::string, double>& value) override {
    writes++; attemptedWrite = true;
    if (failure == Failure::writeBefore) throw std::runtime_error("synthetic_before");
    raw = std::get<std::string>(value);
    if (failure == Failure::writeAfter) throw std::runtime_error("synthetic_after");
  }
  // Unexpected SDK calls are failures, never empty/success substitutes.
  std::string getId() override { reject("unexpected_sdk_call"); }
  double getLength() override { reject("unexpected_sdk_call"); }
  double getSize() override { reject("unexpected_sdk_call"); }
  double getByteSize() override { reject("unexpected_sdk_call"); }
  bool getIsReadOnly() override { reject("unexpected_sdk_call"); }
  bool getIsEncrypted() override { reject("unexpected_sdk_call"); }
  std::optional<bool> getBoolean(const std::string&) override { reject("unexpected_sdk_call"); }
  std::optional<double> getNumber(const std::string&) override { reject("unexpected_sdk_call"); }
  std::optional<std::shared_ptr<ArrayBuffer>> getBuffer(const std::string&) override { reject("unexpected_sdk_call"); }
  bool contains(const std::string&) override { reject("unexpected_sdk_call"); }
  bool remove(const std::string&) override { reject("unexpected_sdk_call"); }
  std::vector<std::string> getAllKeys() override { reject("unexpected_sdk_call"); }
  void clearAll() override { reject("unexpected_sdk_call"); }
  void recrypt(const std::optional<std::string>&) override { reject("unexpected_sdk_call"); }
  void encrypt(const std::string&, std::optional<EncryptionType>) override { reject("unexpected_sdk_call"); }
  void decrypt() override { reject("unexpected_sdk_call"); }
  void trim() override { reject("unexpected_sdk_call"); }
  void checkContentChanged() override { reject("unexpected_sdk_call"); }
  Listener addOnValueChangedListener(const std::function<void(const std::string&)>&) override { reject("unexpected_sdk_call"); }
  double importAllFrom(const std::shared_ptr<HybridMMKVSpec>&) override { reject("unexpected_sdk_call"); }
};
void check(bool value, const char* category) { if (!value) throw std::runtime_error(category); }
template<typename F> void expectFailure(F action, const std::string& category) {
  try { action(); } catch (const std::exception& error) { check(error.what() == category, "wrong_failure_category"); return; }
  throw std::runtime_error("failure_not_reported");
}
int main() {
  @autoreleasepool {
    try {
      applicationActive.store(true);
      const std::string profile = "native-memory-only-profile";
      const std::string key = "patternly:profile:v1:" + profile + ":patternly%3Acanonical%3Av1%3Aactive-foreground-timer";
      const std::string token = "native-memory-only-lease";
      const auto initial = patternly::encodeForegroundTimerRecord({1,1,100,"coding_interview","synthetic-session","coding-interview-dsa-problem-solving","2026-10-13T00:00:00.000Z",false});
      int cases = 0;
      for (auto failure : {Failure::readBefore,Failure::writeBefore,Failure::writeAfter,Failure::readbackThrow,Failure::readbackMismatch}) {
        auto slot = std::make_shared<FaultingMemorySlot>(initial);
        auto owner = std::make_shared<PatternlyForegroundClock>();
        owner->bind(slot,key,profile,token);
        owner->arm(token,initial,"coding_interview","synthetic-session","coding-interview-dsa-problem-solving",std::nullopt);
        slot->failure = failure;
        const std::string expected = failure == Failure::readBefore ? "foreground_clock_read_failed" : "foreground_clock_write_unknown";
        expectFailure([&]{ owner->checkpoint(token); },expected);
        check(slot->writes == (failure == Failure::readBefore ? 0 : 1),"unexpected_write_count");
        check((slot->raw == initial) == (failure == Failure::readBefore || failure == Failure::writeBefore),"wrong_effect_boundary");
        const auto reads = slot->reads, writes = slot->writes;
        const std::string latched = failure == Failure::readBefore ? "foreground_clock_checkpoint_failed" : "foreground_clock_write_unknown";
        for (int replay = 0; replay < 2; replay++) {
          expectFailure([&]{ owner->checkpoint(token); },latched);
          expectFailure([&]{ owner->enter(token); },latched);
          expectFailure([&]{ owner->read(token); },latched);
        }
        check(slot->reads == reads && slot->writes == writes,"fault_retried_storage");
        expectFailure([&]{ owner->revoke(token); },latched);
        expectFailure([&]{ owner->checkpoint(token); },"foreground_clock_lease_stale");
        check(slot->reads == reads && slot->writes == writes,"revoke_retried_storage");
        cases++;
      }
      std::cout << "{\"stage\":\"native_owner_io_contract_passed\",\"cases\":" << cases << "}" << std::endl;
      return 0;
    } catch (const std::exception&) {
      // Never print SDK exception text or stored data.
      std::cerr << "{\"stage\":\"failed\",\"category\":\"native_io_contract_failed\"}" << std::endl;
      return 1;
    }
  }
}
