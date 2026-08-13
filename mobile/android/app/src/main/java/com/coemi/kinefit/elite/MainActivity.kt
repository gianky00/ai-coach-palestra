package com.coemi.kinefit.elite

import android.content.Intent
import android.os.Build
import android.os.Bundle
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

  override fun onCreate(savedInstanceState: Bundle?) {
    keepSplashOnScreen = true
    // Android 12+ splash API (Theme.App.SplashScreen). No react-native-splash-screen.
    val splashScreen = installSplashScreen()
    splashScreen.setKeepOnScreenCondition { keepSplashOnScreen }
    setTheme(R.style.AppTheme)
    super.onCreate(null)
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
