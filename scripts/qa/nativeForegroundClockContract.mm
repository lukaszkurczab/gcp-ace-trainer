// Synthetic contract inputs only. No MMKV, app launch, UIKit or native timer.
#import "../../native/foreground-clock/ForegroundTimerRecord.hpp"
#include "../../native/foreground-clock/ForegroundClockSegment.hpp"
#include <iostream>
#include <iterator>

int main() {
  @autoreleasepool {
    std::string input{std::istreambuf_iterator<char>(std::cin), std::istreambuf_iterator<char>()};
    NSData* data = [NSData dataWithBytes:input.data() length:input.size()];
    id cases = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
    if (![cases isKindOfClass:NSArray.class]) return 2;
    NSMutableArray* results = [NSMutableArray new];
    for (NSDictionary* item in cases) {
      try {
        if ([item[@"kind"] isEqual:@"record"]) {
          NSData* bytes = [item[@"raw"] dataUsingEncoding:NSUTF8StringEncoding];
          auto record = patternly::decodeForegroundTimerRecord(std::string(static_cast<const char*>(bytes.bytes), bytes.length));
          std::string encoded = patternly::encodeForegroundTimerRecord(record);
          [results addObject:@{@"ok": @YES, @"raw": [[NSString alloc] initWithBytes:encoded.data() length:encoded.size() encoding:NSUTF8StringEncoding]}];
        } else if ([item[@"kind"] isEqual:@"key"]) {
          std::string key([item[@"physicalKey"] UTF8String]);
          std::string profile([item[@"profileId"] UTF8String]);
          [results addObject:@{@"ok": @(patternly::isForegroundTimerPhysicalKey(key, profile))}];
        } else if ([item[@"kind"] isEqual:@"segment"]) {
          uint64_t durable = [item[@"durableMs"] unsignedLongLongValue];
          std::optional<int64_t> start = item[@"startedNs"] == NSNull.null ? std::nullopt : std::optional<int64_t>([item[@"startedNs"] longLongValue]);
          std::optional<uint64_t> cap = item[@"countdownMs"] == NSNull.null ? std::nullopt : std::optional<uint64_t>([item[@"countdownMs"] unsignedLongLongValue]);
          int64_t now = [item[@"nowNs"] longLongValue];
          auto accumulated = patternly::accumulatedForegroundMs(durable, start, now, cap);
          id anchor = start ? @(patternly::checkpointSegmentAnchor(*start, durable, accumulated)) : NSNull.null;
          [results addObject:@{@"ok": @YES, @"accumulatedMs": @(accumulated), @"anchorNs": anchor}];
        } else if ([item[@"kind"] isEqual:@"fractional-sequence"]) {
          uint64_t durable = 0;
          int64_t anchor = 0;
          // Repeated sub-ms residuals and 3ms synchronous write cost. The
          // segment anchor must consume only work actually in durable T.
          for (int64_t index = 1; index <= 10000; index++) {
            int64_t sampled = index * 1003000999LL;
            auto accumulated = patternly::accumulatedForegroundMs(durable, anchor, sampled, std::nullopt);
            anchor = patternly::checkpointSegmentAnchor(anchor, durable, accumulated);
            durable = accumulated;
          }
          [results addObject:@{@"ok": @YES, @"accumulatedMs": @(durable), @"anchorNs": @(anchor)}];
        } else { return 3; }
      } catch (...) { [results addObject:@{@"ok": @NO, @"stage": @"contract_rejected"}]; }
    }
    NSData* output = [NSJSONSerialization dataWithJSONObject:results options:NSJSONWritingSortedKeys error:nil];
    std::cout.write(static_cast<const char*>(output.bytes), output.length);
    std::cout << '\n';
    return 0;
  }
}
