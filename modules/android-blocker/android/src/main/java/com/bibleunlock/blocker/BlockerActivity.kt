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
            setBackgroundColor(Color.parseColor("#0D120F")) // Celestial Navy
            val pad = (32 * resources.displayMetrics.density).toInt()
            setPadding(pad, pad, pad, pad)
        }

        // App Icon / Logo
        val iconView = android.widget.ImageView(this).apply {
            val resId = resources.getIdentifier("splashscreen_logo", "drawable", packageName)
            if (resId != 0) {
                setImageResource(resId)
            }
            val sizePx = (88 * resources.displayMetrics.density).toInt()
            layoutParams = LinearLayout.LayoutParams(sizePx, sizePx).apply {
                gravity = Gravity.CENTER
                bottomMargin = (24 * resources.displayMetrics.density).toInt()
            }
        }
        rootLayout.addView(iconView)

        // Title
        val titleText = TextView(this).apply {
            text = "Bible Unlock"
            textSize = 30f
            setTextColor(Color.parseColor("#FAF9F5"))
            typeface = Typeface.SERIF
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, (12 * resources.displayMetrics.density).toInt())
        }
        rootLayout.addView(titleText)

        // Subtitle message
        val subtitleText = TextView(this).apply {
            text = "This app is shielded until today's Bible reading goal is met.\n\n\"Thy word is a lamp unto my feet, and a light unto my path.\""
            textSize = 15f
            setTextColor(Color.parseColor("#78A898"))
            gravity = Gravity.CENTER
            val bottomPad = (40 * resources.displayMetrics.density).toInt()
            setPadding(0, 0, 0, bottomPad)
        }
        rootLayout.addView(subtitleText)

        // CTA Button (Radiant Warm Gold)
        val openReaderButton = Button(this).apply {
            text = "Read Bible Now"
            setTextColor(Color.parseColor("#141413"))
            textSize = 16f
            typeface = Typeface.DEFAULT_BOLD
            val shape = android.graphics.drawable.GradientDrawable().apply {
                shape = android.graphics.drawable.GradientDrawable.RECTANGLE
                cornerRadius = 24f * resources.displayMetrics.density
                setColor(Color.parseColor("#F5B800"))
            }
            background = shape
            val padH = (32 * resources.displayMetrics.density).toInt()
            val padV = (16 * resources.displayMetrics.density).toInt()
            setPadding(padH, padV, padH, padV)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                val marginH = (16 * resources.displayMetrics.density).toInt()
                val marginB = (12 * resources.displayMetrics.density).toInt()
                setMargins(marginH, 0, marginH, marginB)
            }
            setOnClickListener {
                // Launch Bible Unlock reader (restores last read position)
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
            setTextColor(Color.parseColor("#78A898"))
            setBackgroundColor(Color.TRANSPARENT)
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
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
