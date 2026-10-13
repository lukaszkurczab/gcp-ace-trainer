#import "ForegroundTimerRecord.hpp"
#include <cmath>
#include <stdexcept>

namespace patternly {
namespace {
[[noreturn]] void invalid() { throw std::runtime_error("foreground_clock_record_invalid"); }
NSString* string(const std::string& value) {
  NSString* result = [[NSString alloc] initWithBytes:value.data() length:value.size() encoding:NSUTF8StringEncoding];
  if (!result) invalid();
  return result;
}
std::string text(id value) {
  if (![value isKindOfClass:NSString.class] || ![value length] ||
      ![[value stringByTrimmingCharactersInSet:NSCharacterSet.whitespaceAndNewlineCharacterSet] length]) invalid();
  NSData* data = [value dataUsingEncoding:NSUTF8StringEncoding];
  if (!data) invalid();
  return std::string(static_cast<const char*>(data.bytes), data.length);
}
uint64_t integer(id value, uint64_t minimum) {
  if (![value isKindOfClass:NSNumber.class] || CFGetTypeID((__bridge CFTypeRef)value) == CFBooleanGetTypeID()) invalid();
  double number = [value doubleValue];
  if (!std::isfinite(number) || std::floor(number) != number || number < minimum || number > maxSafeInteger) invalid();
  return static_cast<uint64_t>(number);
}
void keys(id value, NSArray<NSString*>* expected) {
  if (![value isKindOfClass:NSDictionary.class] || [value count] != expected.count ||
      ![[NSSet setWithArray:[value allKeys]] isEqualToSet:[NSSet setWithArray:expected]]) invalid();
}
}
ForegroundTimerRecord decodeForegroundTimerRecord(const std::string& raw) {
  @autoreleasepool {
    NSData* data = [NSData dataWithBytes:raw.data() length:raw.size()];
    id envelope = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
    keys(envelope, @[@"schemaIdentity", @"revision", @"payload"]);
    if (![envelope[@"schemaIdentity"] isEqual:@"patternly:canonical:v1"]) invalid();
    id payload = envelope[@"payload"];
    keys(payload, @[@"schemaVersion", @"timerVersion", @"familyId", @"sessionId", @"trackId", @"accumulatedForegroundMs", @"checkpointRevision", @"lastCheckpointAt", @"running"]);
    if (integer(payload[@"schemaVersion"], 1) != 1 || integer(payload[@"timerVersion"], 1) != 1 ||
        ![payload[@"running"] isKindOfClass:NSNumber.class] ||
        CFGetTypeID((__bridge CFTypeRef)payload[@"running"]) != CFBooleanGetTypeID()) invalid();
    return {integer(envelope[@"revision"], 1), integer(payload[@"checkpointRevision"], 1),
      integer(payload[@"accumulatedForegroundMs"], 0), text(payload[@"familyId"]), text(payload[@"sessionId"]),
      text(payload[@"trackId"]), text(payload[@"lastCheckpointAt"]), [payload[@"running"] boolValue]};
  }
}
std::string encodeForegroundTimerRecord(const ForegroundTimerRecord& record) {
  @autoreleasepool {
    if (record.envelopeRevision < 1 || record.envelopeRevision > maxSafeInteger ||
        record.checkpointRevision < 1 || record.checkpointRevision > maxSafeInteger || record.accumulatedMs > maxSafeInteger) invalid();
    // Native-generated checkpoints are stable JSON. Exact journal apply does
    // not re-encode its input: it writes the journal's original bytes.
    NSDictionary* envelope = @{@"schemaIdentity": @"patternly:canonical:v1", @"revision": @(record.envelopeRevision),
      @"payload": @{@"schemaVersion": @1, @"timerVersion": @1, @"familyId": string(record.familyId),
        @"sessionId": string(record.sessionId), @"trackId": string(record.trackId),
        @"accumulatedForegroundMs": @(record.accumulatedMs), @"checkpointRevision": @(record.checkpointRevision),
        @"lastCheckpointAt": string(record.lastCheckpointAt), @"running": @(record.running)}};
    NSData* data = [NSJSONSerialization dataWithJSONObject:envelope options:NSJSONWritingSortedKeys | NSJSONWritingWithoutEscapingSlashes error:nil];
    if (!data) invalid();
    std::string raw(static_cast<const char*>(data.bytes), data.length);
    (void)decodeForegroundTimerRecord(raw);
    return raw;
  }
}
bool isForegroundTimerPhysicalKey(const std::string& physicalKey, const std::string& profileId) {
  @autoreleasepool {
    if (profileId.empty()) return false;
    NSString* key = string(physicalKey);
    NSString* prefix = [@"patternly:profile:v1:" stringByAppendingFormat:@"%@:", string(profileId)];
    if (![key hasPrefix:prefix]) return false;
    NSString* suffix = [key substringFromIndex:prefix.length];
    // Validate the router's supplied key; never construct or percent-encode a
    // second physical key. Other keys cannot acquire this writer capability.
    return [[suffix stringByRemovingPercentEncoding] isEqualToString:@"patternly:canonical:v1:active-foreground-timer"];
  }
}
std::string foregroundCheckpointWallTime() {
  @autoreleasepool {
    NSISO8601DateFormatter* formatter = [NSISO8601DateFormatter new];
    formatter.formatOptions = NSISO8601DateFormatWithInternetDateTime | NSISO8601DateFormatWithFractionalSeconds;
    return text([formatter stringFromDate:NSDate.date]);
  }
}
}
