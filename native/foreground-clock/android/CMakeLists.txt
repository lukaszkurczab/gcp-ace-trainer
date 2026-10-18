cmake_minimum_required(VERSION 3.22.1)
project(PatternlyForegroundClock LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(ReactAndroid REQUIRED CONFIG)
find_package(react-native-nitro-modules REQUIRED CONFIG)
find_package(react-native-mmkv REQUIRED CONFIG)

add_library(patternly_foreground_clock SHARED
  ForegroundTimerRecordAndroid.cpp
  PatternlyForegroundClockAndroid.cpp
  ForegroundClockJni.cpp
)

target_include_directories(patternly_foreground_clock PRIVATE
  "${CMAKE_CURRENT_LIST_DIR}/.."
)

target_compile_definitions(patternly_foreground_clock PRIVATE
  FOLLY_NO_CONFIG=1
  FOLLY_HAVE_CLOCK_GETTIME=1
  FOLLY_USE_LIBCPP=1
  FOLLY_CFG_NO_COROUTINES=1
  FOLLY_MOBILE=1
  FOLLY_HAVE_RECVMMSG=1
  FOLLY_HAVE_PTHREAD=1
  FOLLY_HAVE_XSI_STRERROR_R=1
)

# Empty in ordinary builds. An explicit UUID enables only the synthetic-store
# failure probe; it never changes the production clock's public capability.
set(PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID "" CACHE STRING "Private Android clock fixture UUID")
if(NOT PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID STREQUAL "")
  string(LENGTH "${PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID}" probe_uuid_length)
  if(NOT probe_uuid_length EQUAL 36 OR NOT PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID MATCHES "^[0-9a-f]+-[0-9a-f]+-4[0-9a-f]+-[89ab][0-9a-f]+-[0-9a-f]+$")
    message(FATAL_ERROR "Invalid Android clock fixture UUID")
  endif()
  target_compile_definitions(patternly_foreground_clock PRIVATE
    PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID="${PATTERNLY_ANDROID_CLOCK_PROBE_RUN_ID}")
endif()

target_link_libraries(patternly_foreground_clock
  ReactAndroid::jsi
  ReactAndroid::reactnative
  react-native-nitro-modules::NitroModules
  react-native-mmkv::NitroMmkv
  android
  log
)
