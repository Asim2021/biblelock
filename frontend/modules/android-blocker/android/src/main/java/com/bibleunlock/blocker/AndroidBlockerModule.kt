package com.bibleunlock.blocker

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AndroidBlockerModule : Module() {
    private val context: Context
        get() = appContext.reactContext ?: throw IllegalStateException("React context not available")

    override fun definition() = ModuleDefinition {
        Name("android-blocker")

        AsyncFunction("isAccessibilityEnabled") {
            val am = context.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
                ?: return@AsyncFunction false

            val enabledServices = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_GENERIC)
            val expectedServiceName = "${context.packageName}/${BlockerAccessibilityService::class.java.name}"

            for (service in enabledServices) {
                if (service.id.contains(expectedServiceName) || service.id.contains("BlockerAccessibilityService")) {
                    return@AsyncFunction true
                }
            }
            return@AsyncFunction false
        }

        AsyncFunction("requestAccessibilityPermission") {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        }

        AsyncFunction("setBlockedApps") { packageNames: List<String> ->
            val prefs = context.getSharedPreferences("BibleUnlockBlockerPrefs", Context.MODE_PRIVATE)
            prefs.edit().putStringSet("blocked_packages", packageNames.toSet()).apply()
        }

        AsyncFunction("setGoalMet") { met: Boolean ->
            val prefs = context.getSharedPreferences("BibleUnlockBlockerPrefs", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("is_goal_met", met).apply()
        }

        AsyncFunction("isShieldActive") {
            val prefs = context.getSharedPreferences("BibleUnlockBlockerPrefs", Context.MODE_PRIVATE)
            return@AsyncFunction prefs.getBoolean("is_shield_active", false)
        }

        AsyncFunction("setShieldActive") { active: Boolean ->
            val prefs = context.getSharedPreferences("BibleUnlockBlockerPrefs", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("is_shield_active", active).apply()
        }
    }
}
