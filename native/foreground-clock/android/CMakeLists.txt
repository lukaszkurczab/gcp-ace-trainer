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

target_link_libraries(patternly_foreground_clock
  ReactAndroid::jsi
  ReactAndroid::reactnative
  react-native-nitro-modules::NitroModules
  react-native-mmkv::NitroMmkv
  android
  log
)
