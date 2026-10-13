#pragma once
#import <Foundation/Foundation.h>
#include <cstdint>
#include <string>

namespace patternly {
// This codec enforces the native structural contract. Track admission and
// Date.parse validation remain at the JS repository boundary before arm/apply.
// Wall metadata is never interpreted as elapsed time by the native owner.
struct ForegroundTimerRecord {
  uint64_t envelopeRevision;
  uint64_t checkpointRevision;
  uint64_t accumulatedMs;
  std::string familyId;
  std::string sessionId;
  std::string trackId;
  std::string lastCheckpointAt;
  bool running;
};
constexpr uint64_t maxSafeInteger = 9007199254740991ULL;
ForegroundTimerRecord decodeForegroundTimerRecord(const std::string& raw);
std::string encodeForegroundTimerRecord(const ForegroundTimerRecord& record);
std::string foregroundCheckpointWallTime();
bool isForegroundTimerPhysicalKey(const std::string& physicalKey, const std::string& profileId);
}
