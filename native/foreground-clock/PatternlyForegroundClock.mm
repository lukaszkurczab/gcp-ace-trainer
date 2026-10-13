#import <UIKit/UIKit.h>
#import "ForegroundTimerRecord.hpp"
#include "ForegroundClockSegment.hpp"
#include <NitroModules/HybridObject.hpp>
#include <NitroModules/HybridObjectRegistry.hpp>
#include <NitroMmkv/HybridMMKVSpec.hpp>
#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <exception>
#include <functional>
#include <memory>
#include <mutex>
#include <vector>
#include <optional>
#include <stdexcept>

using margelo::nitro::HybridObject;
using margelo::nitro::HybridObjectRegistry;
using margelo::nitro::Prototype;
using margelo::nitro::mmkv::HybridMMKVSpec;

class PatternlyForegroundClock;

namespace {
std::mutex ownersMutex;
std::vector<std::weak_ptr<PatternlyForegroundClock>> owners;
using Raw = std::optional<std::string>;
std::atomic<bool> applicationActive{false};
std::atomic<int64_t> inactiveAtNs{0};
std::atomic<int64_t> activeAtNs{0};
int64_t monotonicNs() { return std::chrono::duration_cast<std::chrono::nanoseconds>(std::chrono::steady_clock::now().time_since_epoch()).count(); }
[[noreturn]] void reject(const char* stage) { throw std::runtime_error(stage); }
}

// One instance owns one currently granted profile T key on the already-open
// encrypted MMKV handle. No method opens storage, registers an MMKV listener,
// receives an encryption key, or calls JavaScript from the native queue.
class PatternlyForegroundClock final : public HybridObject {
  dispatch_queue_t queue = dispatch_queue_create("com.lkurczab.patternly.foreground-clock", DISPATCH_QUEUE_SERIAL);
  dispatch_source_t ticker = nil;
  bool observesApplication = false;
  bool admittedRun = false;
  double maxOutstandingMs = 0;
  double maxWriteMs = 0;
  uint64_t checkpointCount = 0;
  std::shared_ptr<HybridMMKVSpec> storage;
  std::string key;
  std::string lease;
  std::string fault;
  Raw durableRaw;
  std::optional<patternly::ForegroundTimerRecord> record;
  std::optional<int64_t> segmentStartedNs;
  std::optional<uint64_t> countdownMs;

  template<typename T> T serial(std::function<T()> work) {
    if (dispatch_get_specific(this) == this) return work();
    __block std::exception_ptr failure;
    __block std::optional<T> result;
    dispatch_sync(queue, ^{ try { result = work(); } catch (...) { failure = std::current_exception(); } });
    if (failure) std::rethrow_exception(failure);
    return std::move(*result);
  }
  void serialVoid(std::function<void()> work) { serial<bool>([&] { work(); return true; }); }
  void requireLease(const std::string& candidate) {
    if (!storage || lease.empty() || candidate != lease) reject("foreground_clock_lease_stale");
    if (!fault.empty()) reject(fault.c_str());
  }
  Raw readPhysical() {
    try { return storage->getString(key); }
    catch (...) { reject("foreground_clock_read_failed"); }
  }
  void stopTicker() {
    if (ticker) { dispatch_source_cancel(ticker); ticker = nil; }
  }
  void fail(const char* stage) {
    if (fault.empty()) fault = stage;
    admittedRun = false;
    segmentStartedNs.reset();
    stopTicker();
  }
  void verifyCurrent() {
    if (readPhysical() != durableRaw) reject("foreground_clock_conflict");
  }
  uint64_t elapsedAt(int64_t now) {
    if (!record) reject("foreground_clock_not_armed");
    if (!applicationActive.load(std::memory_order_acquire) && segmentStartedNs) {
      now = std::min(now, inactiveAtNs.load(std::memory_order_acquire));
    }
    return patternly::accumulatedForegroundMs(record->accumulatedMs, segmentStartedNs, now, countdownMs);
  }
  void writeVerified(const Raw& before, const Raw& after) {
    Raw current = readPhysical();
    if (current == after) return;
    if (current != before) reject("foreground_clock_conflict");
    try {
      if (after) storage->set(key, *after);
      else storage->remove(key);
    } catch (...) {
      // An exception after an attempted SDK effect is uncertain. Never expose
      // SDK exception text (it can contain physical keys or stored values).
      fail("foreground_clock_write_unknown");
      reject("foreground_clock_write_unknown");
    }
    try {
      if (readPhysical() != after) reject("foreground_clock_write_unknown");
    } catch (...) {
      fail("foreground_clock_write_unknown");
      reject("foreground_clock_write_unknown");
    }
  }
  std::string checkpointAt(int64_t now, bool keepRunning) {
    if (!record || !durableRaw) reject("foreground_clock_not_armed");
    verifyCurrent();
    const uint64_t previousAccumulatedMs = record->accumulatedMs;
    auto candidate = *record;
    candidate.accumulatedMs = elapsedAt(now);
    const bool expired = countdownMs && candidate.accumulatedMs >= *countdownMs;
    if (expired) admittedRun = false;
    candidate.running = keepRunning && applicationActive.load(std::memory_order_acquire) && !expired;
    if (candidate.envelopeRevision == patternly::maxSafeInteger || candidate.checkpointRevision == patternly::maxSafeInteger) reject("foreground_clock_revision_overflow");
    candidate.envelopeRevision++;
    candidate.checkpointRevision++;
    candidate.lastCheckpointAt = patternly::foregroundCheckpointWallTime();
    std::string after = patternly::encodeForegroundTimerRecord(candidate);
    const int64_t writeStartedNs = monotonicNs();
    writeVerified(durableRaw, after);
    const int64_t acknowledgedNs = monotonicNs();
    const uint64_t outstandingMs = elapsedAt(keepRunning ? acknowledgedNs : now) - previousAccumulatedMs;
    maxOutstandingMs = std::max(maxOutstandingMs, static_cast<double>(outstandingMs));
    maxWriteMs = std::max(maxWriteMs, static_cast<double>(acknowledgedNs - writeStartedNs) / 1000000.0);
    checkpointCount++;
    durableRaw = after;
    record = std::move(candidate);
    // Preserve sub-millisecond work and time spent in the synchronous write.
    // Moving the anchor to completion would silently lose every write's cost.
    if (record->running) {
      segmentStartedNs = patternly::checkpointSegmentAnchor(*segmentStartedNs, previousAccumulatedMs, record->accumulatedMs);
    } else { segmentStartedNs.reset(); stopTicker(); }
    if (outstandingMs > 5000) {
      fail("foreground_clock_checkpoint_late");
      reject("foreground_clock_checkpoint_late");
    }
    return after;
  }
  void startTicker() {
    if (ticker || !segmentStartedNs) return;
    std::weak_ptr<PatternlyForegroundClock> weak = std::static_pointer_cast<PatternlyForegroundClock>(shared_from_this());
    ticker = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, queue);
    dispatch_source_set_timer(ticker, dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC), NSEC_PER_SEC, 20 * NSEC_PER_MSEC);
    dispatch_source_set_event_handler(ticker, ^{
      auto owner = weak.lock();
      if (!owner || !owner->storage || !owner->segmentStartedNs || !owner->fault.empty()) return;
      try { owner->checkpointAt(monotonicNs(), true); }
      catch (...) { owner->fail("foreground_clock_periodic_failed"); }
    });
    dispatch_resume(ticker);
  }
public:
  PatternlyForegroundClock() : HybridObject("PatternlyForegroundClock") {
    dispatch_queue_set_specific(queue, this, this, nullptr);
  }
  ~PatternlyForegroundClock() override {
    serialVoid([&] { stopTicker(); segmentStartedNs.reset(); storage.reset(); });
  }
  void bind(const std::shared_ptr<HybridMMKVSpec>& handle, const std::string& physicalKey, const std::string& profileId, const std::string& token) {
    serialVoid([&] {
      if (storage || !handle || token.empty() || !patternly::isForegroundTimerPhysicalKey(physicalKey, profileId)) reject("foreground_clock_grant_invalid");
      storage = handle;
      key = physicalKey;
      lease = token;
      admittedRun = false;
      fault.clear(); record.reset(); durableRaw.reset(); countdownMs.reset();
      if (!observesApplication) {
        // Global observers update the native cutoff before calling owners.
        // NSNotificationCenter does not promise observer delivery order.
        std::lock_guard<std::mutex> lock(ownersMutex);
        owners.push_back(std::static_pointer_cast<PatternlyForegroundClock>(shared_from_this()));
        observesApplication = true;
      }
    });
  }
  void applicationWillResignActiveAt(int64_t cutoff) {
    serialVoid([&] {
      if (!storage || !segmentStartedNs || !fault.empty()) return;
      try { checkpointAt(cutoff, false); }
      catch (...) { fail("foreground_clock_background_failed"); }
    });
  }
  void applicationDidBecomeActiveAt(int64_t resumedAt) {
    serialVoid([&] {
      if (!storage || !admittedRun || segmentStartedNs || !fault.empty()) return;
      try {
        segmentStartedNs = resumedAt;
        (void)checkpointAt(monotonicNs(), true);
        startTicker();
      } catch (...) { fail("foreground_clock_resume_failed"); }
    });
  }
  Raw read(const std::string& token) {
    return serial<Raw>([&] { requireLease(token); if (record) verifyCurrent(); return readPhysical(); });
  }
  Raw apply(const std::string& token, const Raw& before, const Raw& after) {
    return serial<Raw>([&] {
      requireLease(token);
      if (segmentStartedNs) reject("foreground_clock_mutation_requires_pause");
      if (after) (void)patternly::decodeForegroundTimerRecord(*after);
      writeVerified(before, after);
      // Exact materialization invalidates the runtime clock. A fresh admitted
      // arm is required even when an exact-after replay is a physical no-op.
      admittedRun = false;
      record.reset(); durableRaw.reset(); countdownMs.reset();
      return after;
    });
  }
  void arm(const std::string& token, const std::string& expectedRaw, const std::string& familyId,
           const std::string& sessionId, const std::string& trackId, const std::optional<double>& duration) {
    serialVoid([&] {
      requireLease(token);
      if (segmentStartedNs) reject("foreground_clock_arm_requires_pause");
      auto candidate = patternly::decodeForegroundTimerRecord(expectedRaw);
      if (candidate.familyId != familyId || candidate.sessionId != sessionId || candidate.trackId != trackId) reject("foreground_clock_scope_invalid");
      if (readPhysical() != Raw(expectedRaw)) reject("foreground_clock_conflict");
      if (duration && (!std::isfinite(*duration) || std::floor(*duration) != *duration || *duration <= 0 || *duration > patternly::maxSafeInteger)) reject("foreground_clock_countdown_invalid");
      admittedRun = false;
      record = candidate; durableRaw = expectedRaw;
      countdownMs = duration ? std::optional<uint64_t>(static_cast<uint64_t>(*duration)) : std::nullopt;
      // Persisted running is diagnostic across death. No monotonic segment is
      // restored, and native foreground permission alone never starts one.
      segmentStartedNs.reset();
    });
  }
  std::string enter(const std::string& token) {
    return serial<std::string>([&] {
      requireLease(token);
      if (!record) reject("foreground_clock_not_armed");
      if (!applicationActive.load(std::memory_order_acquire)) reject("foreground_clock_application_inactive");
      if (segmentStartedNs) { verifyCurrent(); return *durableRaw; }
      admittedRun = true;
      int64_t now = monotonicNs(); segmentStartedNs = now;
      try { auto result = checkpointAt(now, true); startTicker(); return result; }
      catch (...) { fail("foreground_clock_enter_failed"); throw; }
    });
  }
  std::string checkpoint(const std::string& token) {
    return serial<std::string>([&] {
      requireLease(token);
      try { return checkpointAt(monotonicNs(), segmentStartedNs.has_value()); }
      catch (...) { fail("foreground_clock_checkpoint_failed"); throw; }
    });
  }
  std::string pause(const std::string& token) {
    return serial<std::string>([&] {
      requireLease(token);
      admittedRun = false;
      try { return checkpointAt(monotonicNs(), false); }
      catch (...) { fail("foreground_clock_pause_failed"); throw; }
    });
  }
  Raw quiesce(const std::string& token) {
    return serial<Raw>([&] {
      requireLease(token);
      admittedRun = false;
      if (!record) return readPhysical();
      verifyCurrent();
      if (!segmentStartedNs && !record->running) return durableRaw;
      try { return Raw(checkpointAt(monotonicNs(), false)); }
      catch (...) { fail("foreground_clock_pause_failed"); throw; }
    });
  }
  double elapsed(const std::string& token) {
    return serial<double>([&] { requireLease(token); verifyCurrent(); return static_cast<double>(elapsedAt(monotonicNs())); });
  }
  std::string metrics(const std::string& token) {
    return serial<std::string>([&] {
      if (!storage || lease.empty() || token != lease) reject("foreground_clock_lease_stale");
      @autoreleasepool {
        NSData* data = [NSJSONSerialization dataWithJSONObject:@{@"maxOutstandingMs": @(maxOutstandingMs), @"maxWriteMs": @(maxWriteMs), @"checkpointCount": @(checkpointCount)} options:NSJSONWritingSortedKeys error:nil];
        if (!data) reject("foreground_clock_metrics_unavailable");
        return std::string(static_cast<const char*>(data.bytes), data.length);
      }
    });
  }
  void revoke(const std::string& token) {
    serialVoid([&] {
      if (!storage || token != lease) reject("foreground_clock_lease_stale");
      std::exception_ptr failure;
      try {
        if (!fault.empty()) reject(fault.c_str());
        if (segmentStartedNs) (void)checkpointAt(monotonicNs(), false);
      } catch (...) { failure = std::current_exception(); }
      // Revoke even after uncertain IO. Stale work can never regain authority.
      admittedRun = false;
      stopTicker(); segmentStartedNs.reset(); record.reset(); durableRaw.reset();
      storage.reset(); key.clear(); lease.clear(); countdownMs.reset();
      if (failure) std::rethrow_exception(failure);
    });
  }
  void loadHybridMethods() override {
    HybridObject::loadHybridMethods();
    registerHybrids(this, [](Prototype& prototype) {
      prototype.registerHybridMethod("bind", &PatternlyForegroundClock::bind);
      prototype.registerHybridMethod("read", &PatternlyForegroundClock::read);
      prototype.registerHybridMethod("apply", &PatternlyForegroundClock::apply);
      prototype.registerHybridMethod("arm", &PatternlyForegroundClock::arm);
      prototype.registerHybridMethod("enter", &PatternlyForegroundClock::enter);
      prototype.registerHybridMethod("checkpoint", &PatternlyForegroundClock::checkpoint);
      prototype.registerHybridMethod("pause", &PatternlyForegroundClock::pause);
      prototype.registerHybridMethod("quiesce", &PatternlyForegroundClock::quiesce);
      prototype.registerHybridMethod("elapsed", &PatternlyForegroundClock::elapsed);
      prototype.registerHybridMethod("metrics", &PatternlyForegroundClock::metrics);
      prototype.registerHybridMethod("revoke", &PatternlyForegroundClock::revoke);
    });
  }
};

namespace {
std::vector<std::shared_ptr<PatternlyForegroundClock>> currentOwners() {
  std::vector<std::shared_ptr<PatternlyForegroundClock>> result;
  std::lock_guard<std::mutex> lock(ownersMutex);
  for (auto iterator = owners.begin(); iterator != owners.end();) {
    if (auto owner = iterator->lock()) { result.push_back(std::move(owner)); ++iterator; }
    else iterator = owners.erase(iterator);
  }
  // Never retain the registry mutex while synchronously draining an owner.
  return result;
}
}

@interface PatternlyForegroundClockRegistration : NSObject
@end
@implementation PatternlyForegroundClockRegistration
+ (void)load {
  // +load runs before UIApplication launch; subsequent notifications are native
  // main-thread signals independent of the JavaScript event loop.
  [NSNotificationCenter.defaultCenter addObserverForName:UIApplicationDidBecomeActiveNotification object:nil queue:nil usingBlock:^(NSNotification*) {
    const int64_t resumedAt = monotonicNs();
    activeAtNs.store(resumedAt, std::memory_order_release);
    applicationActive.store(true, std::memory_order_release);
    for (const auto& owner : currentOwners()) owner->applicationDidBecomeActiveAt(resumedAt);
  }];
  [NSNotificationCenter.defaultCenter addObserverForName:UIApplicationWillResignActiveNotification object:nil queue:nil usingBlock:^(NSNotification*) {
    const int64_t cutoff = monotonicNs();
    inactiveAtNs.store(cutoff, std::memory_order_release);
    applicationActive.store(false, std::memory_order_release);
    for (const auto& owner : currentOwners()) owner->applicationWillResignActiveAt(cutoff);
  }];
  HybridObjectRegistry::registerHybridObjectConstructor("PatternlyForegroundClock", []() -> std::shared_ptr<HybridObject> {
    return std::make_shared<PatternlyForegroundClock>();
  });
}
@end
