package com.bibleunlock.blocker

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.view.accessibility.AccessibilityEvent

class BlockerAccessibilityService : AccessibilityService() {

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            return
        }

        val packageName = event.packageName?.toString() ?: return

        // Skip our own app package
        if (packageName == applicationContext.packageName) {
            return
        }

        // Skip Android system UI and launchers
        if (packageName.startsWith("com.android.systemui") || 
            packageName == "android" ||
            packageName.contains("launcher")) {
            return
        }

        val prefs = applicationContext.getSharedPreferences("BibleUnlockBlockerPrefs", Context.MODE_PRIVATE)
        val isShieldActive = prefs.getBoolean("is_shield_active", false)
        val isGoalMet = prefs.getBoolean("is_goal_met", false)

        if (!isShieldActive || isGoalMet) {
            return
        }

        val blockedAppsSet = prefs.getStringSet("blocked_packages", emptySet()) ?: emptySet()

        if (blockedAppsSet.contains(packageName)) {
            val intent = Intent(this, BlockerActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                putExtra("BLOCKED_PACKAGE", packageName)
            }
            startActivity(intent)
        }
    }

    override fun onInterrupt() {}
}
