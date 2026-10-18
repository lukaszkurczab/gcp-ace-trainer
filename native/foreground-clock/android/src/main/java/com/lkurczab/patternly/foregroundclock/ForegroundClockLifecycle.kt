package com.lkurczab.patternly.foregroundclock

import android.app.Activity
import android.app.Application
import android.os.Bundle

object ForegroundClockLifecycle {
  private var installedApplication: Application? = null
  private val resumedMainActivities = mutableSetOf<Activity>()

  @JvmStatic
  external fun setActive(active: Boolean)

  fun install(application: Application) {
    System.loadLibrary("patternly_foreground_clock")
    if (installedApplication === application) return
    installedApplication = application
    application.registerActivityLifecycleCallbacks(object : Application.ActivityLifecycleCallbacks {
      private fun isMainActivity(activity: Activity): Boolean =
        activity.javaClass.name == "${application.packageName}.MainActivity"

      override fun onActivityResumed(activity: Activity) {
        if (isMainActivity(activity) && resumedMainActivities.add(activity)) setActive(true)
      }

      override fun onActivityPaused(activity: Activity) {
        if (isMainActivity(activity) && resumedMainActivities.remove(activity) && resumedMainActivities.isEmpty()) {
          setActive(false)
        }
      }

      override fun onActivityDestroyed(activity: Activity) {
        if (isMainActivity(activity) && resumedMainActivities.remove(activity) && resumedMainActivities.isEmpty()) {
          setActive(false)
        }
      }

      override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) = Unit
      override fun onActivityStarted(activity: Activity) = Unit
      override fun onActivityStopped(activity: Activity) = Unit
      override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
    })
  }
}
