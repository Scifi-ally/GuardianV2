package com.guardian.safety

import android.app.Activity
import android.os.Bundle
import android.widget.TextView
import android.widget.LinearLayout
import android.view.Gravity

class MinimalMainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Create simple layout programmatically to test basic build
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(50, 50, 50, 50)
        }
        
        val textView = TextView(this).apply {
            text = "Guardian Safety - Basic Build Test"
            textSize = 18f
            gravity = Gravity.CENTER
        }
        
        layout.addView(textView)
        setContentView(layout)
    }
}
