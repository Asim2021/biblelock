package com.bibleunlock.blocker

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.provider.Settings
import android.util.Base64
import android.view.accessibility.AccessibilityManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

class AndroidBlockerModule : Module() {
    private val context: Context
        get() = appContext.reactContext ?: throw IllegalStateException("React context not available")

    private fun drawableToBase64(drawable: Drawable): String? {
        return try {
            val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth.coerceAtMost(96) else 72
            val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight.coerceAtMost(96) else 72
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)
            val stream = ByteArrayOutputStream()
            val scaled = Bitmap.createScaledBitmap(bitmap, 64, 64, true)
            scaled.compress(Bitmap.CompressFormat.PNG, 80, stream)
            "data:image/png;base64," + Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
        } catch (e: Exception) {
            null
        }
    }

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

        AsyncFunction("getInstalledApps") {
            val pm = context.packageManager
            val appList = mutableListOf<Map<String, Any>>()
            val selfPackage = context.packageName
            val seenPackages = mutableSetOf<String>()

            // 1. Query launcher activities
            val intent = Intent(Intent.ACTION_MAIN, null).apply {
                addCategory(Intent.CATEGORY_LAUNCHER)
            }
            val resolveInfos = pm.queryIntentActivities(intent, 0)
            for (resolveInfo in resolveInfos) {
                val pkgName = resolveInfo.activityInfo.packageName
                if (pkgName == selfPackage || pkgName == "android" || pkgName.startsWith("com.android.systemui")) {
                    continue
                }
                if (seenPackages.add(pkgName)) {
                    val label = resolveInfo.loadLabel(pm).toString()
                    val isSystem = (resolveInfo.activityInfo.applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
                    val iconDrawable = resolveInfo.loadIcon(pm)
                    val iconBase64 = drawableToBase64(iconDrawable) ?: ""

                    appList.add(mapOf(
                        "packageName" to pkgName,
                        "label" to label,
                        "isSystemApp" to isSystem,
                        "icon" to iconBase64
                    ))
                }
            }

            // 2. Query installed applications as fallback/union to ensure all user apps (Instagram, TikTok, X, etc.) are captured
            try {
                val installedApplications = pm.getInstalledApplications(0)
                for (appInfo in installedApplications) {
                    val pkgName = appInfo.packageName
                    if (pkgName == selfPackage || pkgName == "android" || pkgName.startsWith("com.android.systemui")) {
                        continue
                    }
                    val isSystem = (appInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
                    val launchIntent = pm.getLaunchIntentForPackage(pkgName)
                    if ((launchIntent != null || !isSystem) && seenPackages.add(pkgName)) {
                        val label = pm.getApplicationLabel(appInfo).toString()
                        val iconDrawable = pm.getApplicationIcon(appInfo)
                        val iconBase64 = drawableToBase64(iconDrawable) ?: ""

                        appList.add(mapOf(
                            "packageName" to pkgName,
                            "label" to label,
                            "isSystemApp" to isSystem,
                            "icon" to iconBase64
                        ))
                    }
                }
            } catch (e: Exception) {
                // Ignore if getInstalledApplications fails
            }

            appList.sortWith(compareBy({ (it["isSystemApp"] as? Boolean) ?: false }, { (it["label"] as? String)?.lowercase() ?: "" }))
            return@AsyncFunction appList
        }
    }
}
