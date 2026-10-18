#include "../ForegroundTimerRecord.hpp"
#include "../ForegroundClockSegment.hpp"

#include <HybridMMKVSpec.hpp>
#include <NitroModules/HybridObject.hpp>
#include <NitroModules/HybridObjectRegistry.hpp>
#include <NitroModules/Prototype.hpp>
#include <folly/json.h>

#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <condition_variable>
#include <exception>
#include <functional>
#include <memory>
#include <mutex>
#include <optional>
#include <stdexcept>
#include <string>
#include <thread>
#include <utility>
#include <vector>

using margelo::nitro::HybridObject;
using margelo::nitro::HybridObjectRegistry;
using margelo::nitro::Prototype;
using margelo::nitro::mmkv::HybridMMKVSpec;

class PatternlyForegroundClock;

namespace {
using Raw = std::optional<std::string>;
std::mutex ownersMutex;
std::vector<std::weak_ptr<PatternlyForegroundClock>> owners;
std::atomic<bool> applicationActive{false};
std::atomic<int64_t> inactiveAtNs{0};
std::atomic<uint64_t> lifecycleRevision{0};

int64_t monotonicNs() {
  return std::chrono::duration_cast<std::chrono::nanoseconds>(
      std::chrono::steady_clock::now().time_since_epoch()).count();
}

[[noreturn]] void reject(const char* stage) { throw std::runtime_error(stage); }

bool readApplicationActive(int64_t* cutoff = nullptr) {
  for (;;) {
    const uint64_t before = lifecycleRevision.load(std::memory_order_acquire);
    if ((before & 1U) != 0) {
      std::this_thread::yield();
      continue;
    }
    const bool active = applicationActive.load(std::memory_order_acquire);
    const int64_t inactiveCutoff = inactiveAtNs.load(std::memory_order_acquire);
    const uint64_t after = lifecycleRevision.load(std::memory_order_acquire);
    if (before == after) {
      if (cutoff != nullptr) *cutoff = inactiveCutoff;
      return active;
    }
  }
}
}

// Owns one granted T key on the already-open encrypted MMKV object. All SDK
// calls and timer state transitions share this mutex; the ticker never calls JS.
class PatternlyForegroundClock final : public HybridObject {
  mutable std::mutex mutex;
  std::condition_variable tickerCondition;
  std::thread tickerThread;
  bool stopTickerThread = false;
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
#ifdef PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID
  std::string probeScenario;
  bool consumeProbe(const char* scenario) {
    if (probeScenario != scenario) return false;
    probeScenario.clear();
    return true;
  }
#endif

  void requireLease(const std::string& candidate) const {
    if (!storage || lease.empty() || candidate != lease) reject("foreground_clock_lease_stale");
    if (!fault.empty()) reject(fault.c_str());
  }

  Raw readPhysicalLocked() {
    try {
#ifdef PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID
      if (consumeProbe("read")) reject("foreground_clock_probe_injected");
#endif
      return storage->getString(key);
    } catch (...) {
      reject("foreground_clock_read_failed");
    }
  }

  void verifyCurrentLocked() {
    if (readPhysicalLocked() != durableRaw) reject("foreground_clock_conflict");
  }

  void notifyTickerLocked() { tickerCondition.notify_all(); }

  void stopSegmentLocked() {
    segmentStartedNs.reset();
    notifyTickerLocked();
  }

  void failLocked(const char* stage) {
    if (fault.empty()) fault = stage;
    admittedRun = false;
    stopSegmentLocked();
  }

  uint64_t elapsedAtLocked(int64_t now) const {
    if (!record) reject("foreground_clock_not_armed");
    int64_t inactiveCutoff = 0;
    if (!readApplicationActive(&inactiveCutoff) && segmentStartedNs) {
      now = std::min(now, inactiveCutoff);
    }
    return patternly::accumulatedForegroundMs(record->accumulatedMs, segmentStartedNs, now, countdownMs);
  }

  void writeVerifiedLocked(const Raw& before, const Raw& after) {
    const Raw current = readPhysicalLocked();
    if (current == after) return;
    if (current != before) reject("foreground_clock_conflict");
    try {
#ifdef PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID
      if (consumeProbe("write-before")) reject("foreground_clock_probe_injected");
#endif
      if (after) {
        storage->set(key, *after);
      } else {
        (void)storage->remove(key);
      }
#ifdef PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID
      if (consumeProbe("write-after")) reject("foreground_clock_probe_injected");
#endif
    } catch (...) {
      failLocked("foreground_clock_write_unknown");
      reject("foreground_clock_write_unknown");
    }
    try {
#ifdef PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID
      if (consumeProbe("readback")) reject("foreground_clock_probe_injected");
#endif
      if (readPhysicalLocked() != after) reject("foreground_clock_write_unknown");
    } catch (...) {
      failLocked("foreground_clock_write_unknown");
      reject("foreground_clock_write_unknown");
    }
  }

  std::string checkpointLocked(int64_t now, bool keepRunning) {
    if (!record || !durableRaw) reject("foreground_clock_not_armed");
    verifyCurrentLocked();
    const uint64_t previousAccumulatedMs = record->accumulatedMs;
    const auto previousSegmentStartedNs = segmentStartedNs;
    auto candidate = *record;
    candidate.accumulatedMs = elapsedAtLocked(now);
    const bool expired = countdownMs && candidate.accumulatedMs >= *countdownMs;
    if (expired) admittedRun = false;
    candidate.running = keepRunning && readApplicationActive() && !expired;
    if (candidate.envelopeRevision == patternly::maxSafeInteger ||
        candidate.checkpointRevision == patternly::maxSafeInteger) {
      reject("foreground_clock_revision_overflow");
    }
    candidate.envelopeRevision++;
    candidate.checkpointRevision++;
    candidate.lastCheckpointAt = patternly::foregroundCheckpointWallTime();
    const std::string after = patternly::encodeForegroundTimerRecord(candidate);
    const int64_t writeStartedNs = monotonicNs();
    writeVerifiedLocked(durableRaw, after);
    const int64_t acknowledgedNs = monotonicNs();
    const uint64_t projectedAtAck = elapsedAtLocked(keepRunning ? acknowledgedNs : now);
    if (projectedAtAck < previousAccumulatedMs) reject("foreground_clock_duration_overflow");
    const uint64_t outstandingMs = projectedAtAck - previousAccumulatedMs;
    maxOutstandingMs = std::max(maxOutstandingMs, static_cast<double>(outstandingMs));
    maxWriteMs = std::max(maxWriteMs, static_cast<double>(acknowledgedNs - writeStartedNs) / 1000000.0);
    if (checkpointCount < patternly::maxSafeInteger) checkpointCount++;
    durableRaw = after;
    record = std::move(candidate);

    // Re-anchor by committed whole milliseconds, retaining fractional time and
    // all synchronous MMKV write cost for the next checkpoint.
    if (record->running) {
      if (!previousSegmentStartedNs) reject("foreground_clock_segment_missing");
      segmentStartedNs = patternly::checkpointSegmentAnchor(
          *previousSegmentStartedNs, previousAccumulatedMs, record->accumulatedMs);
    } else {
      stopSegmentLocked();
    }
    if (outstandingMs > 5000) {
      failLocked("foreground_clock_checkpoint_late");
      reject("foreground_clock_checkpoint_late");
    }
    return after;
  }

  std::string checkpointForLeaseLocked(const std::string& token, int64_t now) {
    requireLease(token);
    try {
      return checkpointLocked(now, segmentStartedNs.has_value());
    } catch (...) {
      failLocked("foreground_clock_checkpoint_failed");
      throw;
    }
  }

  void tickerLoop() {
    std::unique_lock<std::mutex> lock(mutex);
    while (!stopTickerThread) {
      if (!storage || !segmentStartedNs || !fault.empty()) {
        tickerCondition.wait(lock, [this] {
          return stopTickerThread || (storage && segmentStartedNs.has_value() && fault.empty());
        });
        continue;
      }
      const int64_t segmentStart = *segmentStartedNs;
      if (segmentStart > INT64_MAX - 1000000000LL) {
        failLocked("foreground_clock_duration_overflow");
        continue;
      }
      const auto deadline = std::chrono::steady_clock::time_point(
          std::chrono::nanoseconds(segmentStart + 1000000000LL));
      const bool changed = tickerCondition.wait_until(lock, deadline, [this, segmentStart] {
        return stopTickerThread || !storage || !segmentStartedNs || *segmentStartedNs != segmentStart || !fault.empty();
      });
      if (stopTickerThread) break;
      if (changed) continue;
      if (!storage || !segmentStartedNs || !fault.empty()) continue;
      try {
        (void)checkpointLocked(monotonicNs(), true);
      } catch (...) {
        failLocked("foreground_clock_periodic_failed");
      }
    }
  }

  void ensureTickerThreadLocked() {
    if (tickerThread.joinable()) return;
    stopTickerThread = false;
    tickerThread = std::thread([this] { tickerLoop(); });
  }

  void registerOwnerLocked() {
    std::lock_guard<std::mutex> registryLock(ownersMutex);
    owners.push_back(std::static_pointer_cast<PatternlyForegroundClock>(shared_from_this()));
  }

public:
  PatternlyForegroundClock() : HybridObject("PatternlyForegroundClock") {}

  ~PatternlyForegroundClock() override {
    {
      std::lock_guard<std::mutex> lock(mutex);
      stopTickerThread = true;
      admittedRun = false;
      segmentStartedNs.reset();
      tickerCondition.notify_all();
    }
    if (tickerThread.joinable()) tickerThread.join();
    std::lock_guard<std::mutex> lock(mutex);
    storage.reset();
  }

  void bind(const std::shared_ptr<HybridMMKVSpec>& handle, const std::string& physicalKey,
            const std::string& profileId, const std::string& token) {
    std::lock_guard<std::mutex> lock(mutex);
    if (storage || !handle || token.empty() ||
        !patternly::isForegroundTimerPhysicalKey(physicalKey, profileId)) {
      reject("foreground_clock_grant_invalid");
    }
    storage = handle;
    key = physicalKey;
    lease = token;
    admittedRun = false;
    fault.clear();
    record.reset();
    durableRaw.reset();
    countdownMs.reset();
    ensureTickerThreadLocked();
    registerOwnerLocked();
  }

  void applicationWillResignActiveAt(int64_t cutoff) {
    std::lock_guard<std::mutex> lock(mutex);
    if (!storage || !segmentStartedNs || !fault.empty()) return;
    try {
      (void)checkpointLocked(cutoff, false);
    } catch (...) {
      failLocked("foreground_clock_background_failed");
    }
  }

  void applicationDidBecomeActiveAt(int64_t resumedAt) {
    std::lock_guard<std::mutex> lock(mutex);
    if (!storage || !admittedRun || segmentStartedNs || !fault.empty()) return;
    segmentStartedNs = resumedAt;
    try {
      (void)checkpointLocked(monotonicNs(), true);
      tickerCondition.notify_all();
    } catch (...) {
      failLocked("foreground_clock_resume_failed");
    }
  }

  Raw read(const std::string& token) {
    std::lock_guard<std::mutex> lock(mutex);
    requireLease(token);
    if (record) verifyCurrentLocked();
    return readPhysicalLocked();
  }

  Raw apply(const std::string& token, const Raw& before, const Raw& after) {
    std::lock_guard<std::mutex> lock(mutex);
    requireLease(token);
    if (segmentStartedNs) reject("foreground_clock_mutation_requires_pause");
    if (after) (void)patternly::decodeForegroundTimerRecord(*after);
    writeVerifiedLocked(before, after);
    admittedRun = false;
    record.reset();
    durableRaw.reset();
    countdownMs.reset();
    tickerCondition.notify_all();
    return after;
  }

  void arm(const std::string& token, const std::string& expectedRaw, const std::string& familyId,
           const std::string& sessionId, const std::string& trackId, const std::optional<double>& duration) {
    std::lock_guard<std::mutex> lock(mutex);
    requireLease(token);
    if (segmentStartedNs) reject("foreground_clock_arm_requires_pause");
    auto candidate = patternly::decodeForegroundTimerRecord(expectedRaw);
    if (candidate.familyId != familyId || candidate.sessionId != sessionId || candidate.trackId != trackId) {
      reject("foreground_clock_scope_invalid");
    }
    if (readPhysicalLocked() != Raw(expectedRaw)) reject("foreground_clock_conflict");
    if (duration && (!std::isfinite(*duration) || std::floor(*duration) != *duration || *duration <= 0 ||
                     *duration > static_cast<double>(patternly::maxSafeInteger))) {
      reject("foreground_clock_countdown_invalid");
    }
    admittedRun = false;
    record = std::move(candidate);
    durableRaw = expectedRaw;
    countdownMs = duration ? std::optional<uint64_t>(static_cast<uint64_t>(*duration)) : std::nullopt;
    // A cold arm never reconstructs a monotonic segment from persisted running.
    stopSegmentLocked();
  }

  std::string enter(const std::string& token) {
    std::lock_guard<std::mutex> lock(mutex);
    const int64_t now = monotonicNs();
    requireLease(token);
    if (!record) reject("foreground_clock_not_armed");
    if (!readApplicationActive()) reject("foreground_clock_application_inactive");
    if (segmentStartedNs) {
      verifyCurrentLocked();
      return *durableRaw;
    }
    admittedRun = true;
    segmentStartedNs = now;
    try {
      const auto result = checkpointLocked(now, true);
      tickerCondition.notify_all();
      return result;
    } catch (...) {
      failLocked("foreground_clock_enter_failed");
      throw;
    }
  }

  std::string checkpoint(const std::string& token) {
    std::lock_guard<std::mutex> lock(mutex);
    const int64_t now = monotonicNs();
    return checkpointForLeaseLocked(token, now);
  }

#ifdef PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID
  // Synchronous under the owner mutex: no ticker or second command can consume
  // the one-shot fault. The original SDK handle remains the storage authority.
  std::string probeFault(const std::string& token, const std::string& scenario) {
    std::lock_guard<std::mutex> lock(mutex);
    requireLease(token);
    const std::string uuid = PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID;
    const auto keys = storage->getAllKeys();
    if (storage->getId() != "patternly-android-clock-fixture-" + uuid || !storage->getIsEncrypted()
        || !patternly::isForegroundTimerPhysicalKey(key, uuid) || token.rfind("0:", 0) != 0
        || keys.size() != 1 || keys[0] != key || !record || !segmentStartedNs
        || record->familyId != "coding_interview" || record->trackId != "coding-interview-dsa-problem-solving"
        || (record->sessionId != "android-clock-fixture-elapsed-" + uuid
            && record->sessionId != "android-clock-fixture-countdown-" + uuid)
        || !probeScenario.empty() || !readApplicationActive()) reject("foreground_clock_probe_scope_invalid");
    if (scenario != "read" && scenario != "write-before" && scenario != "write-after"
        && scenario != "readback" && scenario != "backward") reject("foreground_clock_probe_scenario_invalid");
    const Raw before = storage->getString(key);
    if (!before || before != durableRaw) reject("foreground_clock_conflict");
    const auto beforeRecord = patternly::decodeForegroundTimerRecord(*before);
    struct ResetPlan { std::string& value; ~ResetPlan() { value.clear(); } } reset{probeScenario};
    probeScenario = scenario;
    const bool backward = consumeProbe("backward");
    const int64_t sample = backward ? *segmentStartedNs - 1 : monotonicNs();
    std::string firstCategory = "probe_unexpected_success";
    try { (void)checkpointForLeaseLocked(token, sample); }
    catch (const std::exception& error) {
      const std::string category = error.what();
      if (category == "foreground_clock_read_failed" || category == "foreground_clock_write_unknown"
          || category == "foreground_clock_monotonic_invalid") firstCategory = category;
      else firstCategory = "probe_unexpected_failure";
    }
    probeScenario.clear();
    const Raw after = storage->getString(key);
    if (!after) reject("foreground_clock_probe_readback_invalid");
    const auto afterRecord = patternly::decodeForegroundTimerRecord(*after);
    int deniedRetries = 0;
    for (int attempt = 0; attempt < 2; ++attempt) {
      try { (void)checkpointForLeaseLocked(token, monotonicNs()); }
      catch (...) { if (!fault.empty()) ++deniedRetries; }
    }
    return folly::toJson(folly::dynamic::object
        ("scenario", scenario)("firstCategory", firstCategory)("latchedCategory", fault)
        ("deniedRetries", deniedRetries)("beforeEqualsAfter", before == after)
        ("afterRetriesUnchanged", storage->getString(key) == after)
        ("beforeRevision", static_cast<double>(beforeRecord.checkpointRevision))
        ("afterRevision", static_cast<double>(afterRecord.checkpointRevision))
        ("beforeElapsedMs", static_cast<double>(beforeRecord.accumulatedMs))
        ("afterElapsedMs", static_cast<double>(afterRecord.accumulatedMs))
        ("segmentStopped", !segmentStartedNs.has_value())("backwardSample", backward));
  }
#endif

  std::string pause(const std::string& token) {
    std::lock_guard<std::mutex> lock(mutex);
    const int64_t now = monotonicNs();
    requireLease(token);
    admittedRun = false;
    try {
      return checkpointLocked(now, false);
    } catch (...) {
      failLocked("foreground_clock_pause_failed");
      throw;
    }
  }

  Raw quiesce(const std::string& token) {
    std::lock_guard<std::mutex> lock(mutex);
    const int64_t now = monotonicNs();
    requireLease(token);
    admittedRun = false;
    if (!record) return readPhysicalLocked();
    verifyCurrentLocked();
    if (!segmentStartedNs && !record->running) return durableRaw;
    try {
      return Raw(checkpointLocked(now, false));
    } catch (...) {
      failLocked("foreground_clock_pause_failed");
      throw;
    }
  }

  double elapsed(const std::string& token) {
    std::lock_guard<std::mutex> lock(mutex);
    const int64_t now = monotonicNs();
    requireLease(token);
    verifyCurrentLocked();
    return static_cast<double>(elapsedAtLocked(now));
  }

  std::string metrics(const std::string& token) {
    std::lock_guard<std::mutex> lock(mutex);
    if (!storage || lease.empty() || token != lease) reject("foreground_clock_lease_stale");
    return folly::toJson(folly::dynamic::object
        ("maxOutstandingMs", maxOutstandingMs)
        ("maxWriteMs", maxWriteMs)
        ("checkpointCount", static_cast<double>(checkpointCount)));
  }

  void revoke(const std::string& token) {
    std::lock_guard<std::mutex> lock(mutex);
    if (!storage || token != lease) reject("foreground_clock_lease_stale");
#ifdef PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID
    probeScenario.clear();
#endif
    std::exception_ptr failure;
    try {
      if (!fault.empty()) reject(fault.c_str());
      if (segmentStartedNs) (void)checkpointLocked(monotonicNs(), false);
    } catch (...) {
      failure = std::current_exception();
    }
    // Revocation is unconditional even after uncertain persistence or a fault.
    admittedRun = false;
    stopSegmentLocked();
    record.reset();
    durableRaw.reset();
    storage.reset();
    key.clear();
    lease.clear();
    countdownMs.reset();
    if (failure) std::rethrow_exception(failure);
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
#ifdef PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID
      prototype.registerHybridMethod("probeFault", &PatternlyForegroundClock::probeFault);
#endif
    });
  }
};

namespace {
std::vector<std::shared_ptr<PatternlyForegroundClock>> currentOwners() {
  std::vector<std::shared_ptr<PatternlyForegroundClock>> result;
  std::lock_guard<std::mutex> lock(ownersMutex);
  for (auto iterator = owners.begin(); iterator != owners.end();) {
    if (auto owner = iterator->lock()) {
      result.push_back(std::move(owner));
      ++iterator;
    } else {
      iterator = owners.erase(iterator);
    }
  }
  return result;
}
} // namespace

void patternlyForegroundClockApplicationStateChanged(bool active) {
  // Bracket the clock sample and both atomic stores. Checkpoint readers retry
  // across this tiny publication window, so they cannot use post-cutoff time.
  lifecycleRevision.fetch_add(1, std::memory_order_acq_rel);
  const int64_t eventTimeNs = monotonicNs();
  if (active) {
    applicationActive.store(true, std::memory_order_release);
  } else {
    inactiveAtNs.store(eventTimeNs, std::memory_order_release);
    applicationActive.store(false, std::memory_order_release);
  }
  lifecycleRevision.fetch_add(1, std::memory_order_release);
  for (const auto& owner : currentOwners()) {
    if (active) owner->applicationDidBecomeActiveAt(eventTimeNs);
    else owner->applicationWillResignActiveAt(eventTimeNs);
  }
}

void registerPatternlyForegroundClock() {
  HybridObjectRegistry::registerHybridObjectConstructor(
      "PatternlyForegroundClock", []() -> std::shared_ptr<HybridObject> {
        return std::make_shared<PatternlyForegroundClock>();
      });
}
