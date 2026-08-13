package com.coemi.kinefit.elite

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  companion object {
    @JvmField
    @Volatile
    var keepSplashOnScreen: Boolean = true
  }

  private val splashHandler = Handler(Looper.getMainLooper())
  private val clearSplashRunnable = Runnable { keepSplashOnScreen = false }

  override fun onCreate(savedInstanceState: Bundle?) {
    keepSplashOnScreen = true
    // Android 12+ splash API (Theme.App.SplashScreen). No react-native-splash-screen.
    val splashScreen = installSplashScreen()
    splashScreen.setKeepOnScreenCondition { keepSplashOnScreen }
    setTheme(R.style.AppTheme)
    super.onCreate(null)
    // Failsafe: never leave Pixel UI verify / cold start stuck on splash
    // if JS hide (KineFitSplash) is delayed or missed under bridgeless/smoke.
    splashHandler.postDelayed(clearSplashRunnable, 2500L)
  }

  override fun onResume() {
    super.onResume()
    // Second failsafe once activity is interactive.
    splashHandler.postDelayed(clearSplashRunnable, 4000L)
  }

  override fun onDestroy() {
    splashHandler.removeCallbacks(clearSplashRunnable)
    super.onDestroy()
  }

  /**
   * singleTask + deep links: replace the activity intent so Linking.getInitialURL
   * and warm VIEW intents (smoke/auth|tabs|seed|clear, garmin-callback) stay current.
   */
  override fun onNewIntent(intent: Intent) {
    setIntent(intent)
    super.onNewIntent(intent)
  }

  override fun getMainComponentName(): String = "KineFit"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun invokeDefaultOnBackPressed() {
    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
      if (!moveTaskToBack(false)) {
        super.invokeDefaultOnBackPressed()
      }
      return
    }
    super.invokeDefaultOnBackPressed()
  }
}
