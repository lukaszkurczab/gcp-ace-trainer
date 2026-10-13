#pragma once
#include "ForegroundTimerRecord.hpp"
#include <algorithm>
#include <optional>
#include <stdexcept>

namespace patternly {
// now is already clamped to the native lifecycle cutoff by the owner. A cold
// clock has no segment: neither civil time nor persisted running can revive it.
inline uint64_t accumulatedForegroundMs(uint64_t durableMs, std::optional<int64_t> startedNs,
                                         int64_t nowNs, std::optional<uint64_t> countdownMs) {
  uint64_t deltaMs = 0;
  if (startedNs) {
    if (nowNs < *startedNs) throw std::runtime_error("foreground_clock_monotonic_invalid");
    deltaMs = static_cast<uint64_t>((nowNs - *startedNs) / 1000000);
  }
  if (durableMs > maxSafeInteger || deltaMs > maxSafeInteger - durableMs) throw std::runtime_error("foreground_clock_duration_overflow");
  const uint64_t value = durableMs + deltaMs;
  // Preserve an older durable overrun instead of retroactively reducing work.
  return countdownMs ? std::max(durableMs, std::min(value, *countdownMs)) : value;
}
inline int64_t checkpointSegmentAnchor(int64_t startedNs, uint64_t previousMs, uint64_t committedMs) {
  if (committedMs < previousMs || committedMs - previousMs > static_cast<uint64_t>(INT64_MAX / 1000000))
    throw std::runtime_error("foreground_clock_duration_overflow");
  const int64_t consumedNs = static_cast<int64_t>(committedMs - previousMs) * 1000000;
  if (startedNs > INT64_MAX - consumedNs) throw std::runtime_error("foreground_clock_duration_overflow");
  return startedNs + consumedNs;
}
}
