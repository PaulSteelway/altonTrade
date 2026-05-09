package com.altonmobile.telegram

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Bridge for Telegram Login SDK. Wire org.telegram:login-sdk when GitHub Packages
 * credentials are available — see mobile/README.md.
 */
class TelegramLoginModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "TelegramLoginModule"

  @ReactMethod
  fun login(promise: Promise) {
    promise.reject(
      "E_TELEGRAM_SDK",
      "Add org.telegram:login-sdk (GitHub Packages) and TelegramLogin.init — see mobile/README.md"
    )
  }
}
