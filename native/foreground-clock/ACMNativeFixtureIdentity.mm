#import <Foundation/Foundation.h>
#import <CoreFoundation/CoreFoundation.h>
#import <React/RCTBridgeModule.h>

static NSString * const PatternlyACMFixtureMarkerKey = @"PatternlyACMNativeFixture";
static NSString * const PatternlyACMFixtureRuntimeModeKey = @"PatternlyRuntimeMode";
static NSString * const PatternlyACMFixtureRunUUIDKey = @"PatternlyACMNativeFixtureRunUUID";
static NSString * const PatternlyACMFixtureOperationKey = @"PatternlyACMNativeFixtureOperation";

static BOOL PatternlyACMFixtureUUIDIsValid(NSString *value) {
  NSRegularExpression *expression = [NSRegularExpression regularExpressionWithPattern:
    @"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$" options:0 error:nil];
  return [expression numberOfMatchesInString:value options:0 range:NSMakeRange(0, value.length)] == 1;
}

static NSString *PatternlyACMFixtureStoragePath(NSString *runUUID) {
  if (!PatternlyACMFixtureUUIDIsValid(runUUID)) return @"";
  NSArray<NSURL *> *directories = [[NSFileManager defaultManager] URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask];
  NSURL *support = directories.firstObject;
  if (!support) return @"";
  return [[[[[support URLByAppendingPathComponent:@"Patternly" isDirectory:YES]
      URLByAppendingPathComponent:@"ACMNative" isDirectory:YES]
      URLByAppendingPathComponent:runUUID.lowercaseString isDirectory:YES]
      URLByAppendingPathComponent:@"mmkv" isDirectory:YES].path copy];
}

static BOOL PatternlyACMFixtureBooleanIsTrue(id value) {
  return [value isKindOfClass:NSNumber.class]
    && CFGetTypeID((__bridge CFTypeRef)value) == CFBooleanGetTypeID()
    && [value boolValue];
}

static NSDictionary<NSString *, id> *PatternlyACMFixtureStorageInventory(NSString *storagePath) {
  NSError *error = nil;
  NSArray<NSString *> *contents = storagePath.length > 0
    ? [NSFileManager.defaultManager contentsOfDirectoryAtPath:storagePath error:&error]
    : nil;
  if (contents == nil || error != nil) return @{ @"ready": @NO, @"entries": @[] };

  BOOL regularFilesOnly = YES;
  for (NSString *name in contents) {
    NSString *childPath = [storagePath stringByAppendingPathComponent:name];
    NSDictionary<NSFileAttributeKey, id> *attributes = [NSFileManager.defaultManager attributesOfItemAtPath:childPath error:&error];
    if (error != nil || ![attributes[NSFileType] isEqualToString:NSFileTypeRegular]) {
      regularFilesOnly = NO;
      break;
    }
  }
  return @{
    @"ready": @(regularFilesOnly),
    @"entries": [contents sortedArrayUsingSelector:@selector(compare:)],
  };
}

@interface ACMNativeFixtureIdentity : NSObject <RCTBridgeModule>
@end

@implementation ACMNativeFixtureIdentity

RCT_EXPORT_MODULE(PatternlyACMNativeFixtureIdentity)

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (NSDictionary *)constantsToExport {
  NSDictionary *info = NSBundle.mainBundle.infoDictionary ?: @{};
  id markerValue = info[PatternlyACMFixtureMarkerKey];
  BOOL fixtureRequested = info[PatternlyACMFixtureMarkerKey] != nil
    || info[PatternlyACMFixtureRunUUIDKey] != nil
    || info[PatternlyACMFixtureOperationKey] != nil;
  BOOL fixtureMarked = PatternlyACMFixtureBooleanIsTrue(markerValue);
  NSString *runUUID = [info[PatternlyACMFixtureRunUUIDKey] isKindOfClass:NSString.class] ? info[PatternlyACMFixtureRunUUIDKey] : @"";
  NSString *operation = [info[PatternlyACMFixtureOperationKey] isKindOfClass:NSString.class] ? info[PatternlyACMFixtureOperationKey] : @"";
  NSString *runtimeMode = [info[PatternlyACMFixtureRuntimeModeKey] isKindOfClass:NSString.class] ? info[PatternlyACMFixtureRuntimeModeKey] : @"";
  NSString *storagePath = PatternlyACMFixtureStoragePath(runUUID);
  NSURL *directory = [NSURL fileURLWithPath:storagePath isDirectory:YES];
  NSError *error = nil;
  NSNumber *excluded = nil;
  BOOL exists = storagePath.length > 0 && [NSFileManager.defaultManager fileExistsAtPath:storagePath isDirectory:nil];
  if (exists) excluded = [directory resourceValuesForKeys:@[NSURLIsExcludedFromBackupKey] error:&error][NSURLIsExcludedFromBackupKey];
  NSDictionary<NSString *, id> *inventory = PatternlyACMFixtureStorageInventory(storagePath);
#if DEBUG
  BOOL debugBuild = YES;
#else
  BOOL debugBuild = NO;
#endif
  BOOL fixtureValid = debugBuild && fixtureMarked && [runtimeMode isEqualToString:@"smoke"]
    && PatternlyACMFixtureUUIDIsValid(runUUID)
    && ([operation isEqualToString:@"create"] || [operation isEqualToString:@"resume"]);
  return @{
    @"fixtureRequested": @(fixtureRequested),
    @"fixtureMarked": @(fixtureMarked),
    @"fixtureValid": @(fixtureValid),
    @"debugBuild": @(debugBuild),
    @"runtimeMode": runtimeMode,
    @"runUUID": runUUID,
    @"operation": operation,
    @"storagePath": storagePath,
    @"storageReady": @(exists && error == nil && excluded.boolValue),
    @"storageInventoryReady": inventory[@"ready"],
    @"storageEntries": inventory[@"entries"],
  };
}

@end
