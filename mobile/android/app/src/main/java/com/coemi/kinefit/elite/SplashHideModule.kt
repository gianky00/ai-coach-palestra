package com.coemi.kinefit.elite

import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Dismisses the AndroidX splash kept on-screen by [MainActivity].
 * Replaces react-native-splash-screen (support-lib / Jetifier / R.layout crash).
 */
class SplashHideModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "KineFitSplash"

  @ReactMethod
  fun hide() {
    val clear = Runnable { MainActivity.keepSplashOnScreen = false }
    val activity = reactApplicationContext.currentActivity
    if (activity != null) {
      activity.runOnUiThread(clear)
    } else {
      Handler(Looper.getMainLooper()).post(clear)
    }
  }
}
