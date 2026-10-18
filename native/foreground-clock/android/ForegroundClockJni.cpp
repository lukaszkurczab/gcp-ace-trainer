#include <jni.h>

void registerPatternlyForegroundClock();
void patternlyForegroundClockApplicationStateChanged(bool active);

namespace {
void setApplicationActive(JNIEnv*, jclass, jboolean active) {
  patternlyForegroundClockApplicationStateChanged(active == JNI_TRUE);
}
}

extern "C" JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  JNIEnv* environment = nullptr;
  if (vm->GetEnv(reinterpret_cast<void**>(&environment), JNI_VERSION_1_6) != JNI_OK || environment == nullptr) {
    return JNI_ERR;
  }
  jclass lifecycle = environment->FindClass("com/lkurczab/patternly/foregroundclock/ForegroundClockLifecycle");
  if (lifecycle == nullptr) return JNI_ERR;
  JNINativeMethod methods[] = {{const_cast<char*>("setActive"), const_cast<char*>("(Z)V"),
                                reinterpret_cast<void*>(setApplicationActive)}};
  if (environment->RegisterNatives(lifecycle, methods, 1) != JNI_OK) return JNI_ERR;
  registerPatternlyForegroundClock();
  return JNI_VERSION_1_6;
}
