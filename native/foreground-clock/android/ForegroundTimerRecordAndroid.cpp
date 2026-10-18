#include "../ForegroundTimerRecord.hpp"

#include <folly/json.h>

#include <cmath>
#include <cctype>
#include <chrono>
#include <cstdio>
#include <ctime>
#include <stdexcept>
#include <string>
#include <vector>

namespace patternly {
namespace {
[[noreturn]] void invalidRecord() { throw std::runtime_error("foreground_clock_record_invalid"); }

void requireKeys(const folly::dynamic& value, const std::vector<std::string>& expected) {
  if (!value.isObject() || value.size() != expected.size()) invalidRecord();
  for (const auto& key : expected) {
    if (!value.count(key)) invalidRecord();
  }
}

std::string text(const folly::dynamic& value) {
  if (!value.isString()) invalidRecord();
  const auto& result = value.asString();
  if (result.empty()) invalidRecord();
  for (unsigned char character : result) {
    if (!std::isspace(character)) return result;
  }
  invalidRecord();
}

uint64_t integer(const folly::dynamic& value, uint64_t minimum) {
  if (!value.isInt() && !value.isDouble()) invalidRecord();
  const double number = value.asDouble();
  if (!std::isfinite(number) || std::floor(number) != number || number < static_cast<double>(minimum) ||
      number > static_cast<double>(maxSafeInteger)) invalidRecord();
  return static_cast<uint64_t>(number);
}

int hexDigit(char character) {
  if (character >= '0' && character <= '9') return character - '0';
  if (character >= 'A' && character <= 'F') return character - 'A' + 10;
  if (character >= 'a' && character <= 'f') return character - 'a' + 10;
  return -1;
}

std::string percentDecode(const std::string& value) {
  std::string decoded;
  decoded.reserve(value.size());
  for (size_t index = 0; index < value.size(); ++index) {
    if (value[index] != '%') {
      decoded.push_back(value[index]);
      continue;
    }
    if (index + 2 >= value.size()) return {};
    const int high = hexDigit(value[index + 1]);
    const int low = hexDigit(value[index + 2]);
    if (high < 0 || low < 0) return {};
    decoded.push_back(static_cast<char>((high << 4) | low));
    index += 2;
  }
  return decoded;
}
} // namespace

ForegroundTimerRecord decodeForegroundTimerRecord(const std::string& raw) {
  try {
    const folly::dynamic envelope = folly::parseJson(raw);
    requireKeys(envelope, {"schemaIdentity", "revision", "payload"});
    if (!envelope["schemaIdentity"].isString() || envelope["schemaIdentity"].asString() != "patternly:canonical:v1") invalidRecord();
    const auto& payload = envelope["payload"];
    requireKeys(payload, {"schemaVersion", "timerVersion", "familyId", "sessionId", "trackId",
                          "accumulatedForegroundMs", "checkpointRevision", "lastCheckpointAt", "running"});
    if (integer(payload["schemaVersion"], 1) != 1 || integer(payload["timerVersion"], 1) != 1 ||
        !payload["running"].isBool()) invalidRecord();
    return {integer(envelope["revision"], 1), integer(payload["checkpointRevision"], 1),
            integer(payload["accumulatedForegroundMs"], 0), text(payload["familyId"]),
            text(payload["sessionId"]), text(payload["trackId"]), text(payload["lastCheckpointAt"]),
            payload["running"].asBool()};
  } catch (...) {
    invalidRecord();
  }
}

std::string encodeForegroundTimerRecord(const ForegroundTimerRecord& record) {
  if (record.envelopeRevision < 1 || record.envelopeRevision > maxSafeInteger ||
      record.checkpointRevision < 1 || record.checkpointRevision > maxSafeInteger ||
      record.accumulatedMs > maxSafeInteger) invalidRecord();
  folly::dynamic payload = folly::dynamic::object
      ("schemaVersion", 1)
      ("timerVersion", 1)
      ("familyId", record.familyId)
      ("sessionId", record.sessionId)
      ("trackId", record.trackId)
      ("accumulatedForegroundMs", static_cast<int64_t>(record.accumulatedMs))
      ("checkpointRevision", static_cast<int64_t>(record.checkpointRevision))
      ("lastCheckpointAt", record.lastCheckpointAt)
      ("running", record.running);
  folly::dynamic envelope = folly::dynamic::object
      ("schemaIdentity", "patternly:canonical:v1")
      ("revision", static_cast<int64_t>(record.envelopeRevision))
      ("payload", std::move(payload));
  folly::json::serialization_opts options;
  options.sort_keys = true;
  std::string raw = folly::json::serialize(envelope, options);
  (void)decodeForegroundTimerRecord(raw);
  return raw;
}

bool isForegroundTimerPhysicalKey(const std::string& physicalKey, const std::string& profileId) {
  if (profileId.empty()) return false;
  const std::string prefix = "patternly:profile:v1:" + profileId + ":";
  if (physicalKey.compare(0, prefix.size(), prefix) != 0) return false;
  return percentDecode(physicalKey.substr(prefix.size())) == "patternly:canonical:v1:active-foreground-timer";
}

std::string foregroundCheckpointWallTime() {
  const auto now = std::chrono::system_clock::now();
  const auto milliseconds = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch());
  const std::time_t seconds = std::chrono::system_clock::to_time_t(now);
  std::tm utc{};
  if (gmtime_r(&seconds, &utc) == nullptr) throw std::runtime_error("foreground_clock_wall_time_unavailable");
  char prefix[24]{};
  if (std::strftime(prefix, sizeof(prefix), "%Y-%m-%dT%H:%M:%S", &utc) == 0) {
    throw std::runtime_error("foreground_clock_wall_time_unavailable");
  }
  const auto fraction = milliseconds.count() % 1000;
  char suffix[8]{};
  std::snprintf(suffix, sizeof(suffix), ".%03lldZ", static_cast<long long>(fraction));
  return std::string(prefix) + suffix;
}
} // namespace patternly
