package com.bibleunlock.blocker

import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class BlockerActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#181715")) // Dark Navy/Canvas
            setPadding(48, 48, 48, 48)
        }

        // Lock Icon/Emoji
        val iconText = TextView(this).apply {
            text = "🔒"
            textSize = 54f
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 32)
        }
        rootLayout.addView(iconText)

        // Title
        val titleText = TextView(this).apply {
            text = "Scripture Unlock"
            textSize = 28f
            setTextColor(Color.parseColor("#FAF9F5"))
            typeface = Typeface.SERIF
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 16)
        }
        rootLayout.addView(titleText)

        // Subtitle message
        val subtitleText = TextView(this).apply {
            text = "This app is locked until you complete today's Bible reading goal.\n\n\"Thy word is a lamp unto my feet, and a light unto my path.\""
            textSize = 16f
            setTextColor(Color.parseColor("#A09D96"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 48)
        }
        rootLayout.addView(subtitleText)

        // CTA Button
        val openReaderButton = Button(this).apply {
            text = "Read Bible Now"
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#CC785C")) // Coral Brand CTA
            textSize = 16f
            setPadding(32, 24, 32, 24)
            setOnClickListener {
                // Launch Bible Unlock reader
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("bibleunlock://reader")).apply {
                    setPackage(applicationContext.packageName)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                startActivity(intent)
                finish()
            }
        }
        rootLayout.addView(openReaderButton)

        // Dismiss / Go Home button
        val goHomeButton = Button(this).apply {
            text = "Go to Home Screen"
            setTextColor(Color.parseColor("#A09D96"))
            setBackgroundColor(Color.TRANSPARENT)
            textSize = 14f
            setPadding(32, 16, 32, 16)
            setOnClickListener {
                val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                    addCategory(Intent.CATEGORY_HOME)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                startActivity(homeIntent)
                finish()
            }
        }
        rootLayout.addView(goHomeButton)

        setContentView(rootLayout)
    }

    override fun onBackPressed() {
        // Prevent going back into the blocked app: navigate to Android home screen instead
        val homeIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(homeIntent)
        finish()
    }
}
