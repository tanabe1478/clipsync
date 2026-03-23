package com.clipsync.clipsync_mobile

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

/**
 * Transparent activity that receives shared text, saves it to Supabase
 * via REST API, shows a toast, and finishes immediately.
 * The user stays in the original app — no UI is shown.
 */
class ShareReceiverActivity : Activity() {

    companion object {
        // Read from BuildConfig (populated from .env via build.gradle.kts)
        private val SUPABASE_URL = BuildConfig.SUPABASE_URL
        private val SUPABASE_ANON_KEY = BuildConfig.SUPABASE_ANON_KEY
        // Derive auth prefs key from Supabase project ref
        private val AUTH_PREFS_KEY: String by lazy {
            val ref = SUPABASE_URL.removePrefix("https://").substringBefore(".supabase.co")
            "flutter.sb-$ref-auth-token"
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val sharedText = when (intent?.action) {
            Intent.ACTION_SEND -> intent.getStringExtra(Intent.EXTRA_TEXT)
            else -> null
        }

        if (sharedText.isNullOrBlank()) {
            Toast.makeText(this, "No text to share", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        val accessToken = getSupabaseAccessToken()
        if (accessToken == null) {
            Toast.makeText(this, "Please sign in to ClipSync first", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        val deviceName = Build.MODEL

        thread {
            val success = postClip(sharedText, deviceName, accessToken)
            runOnUiThread {
                Toast.makeText(
                    this,
                    if (success) "Saved to ClipSync" else "Failed to save",
                    Toast.LENGTH_SHORT
                ).show()
                finish()
            }
        }
    }

    private fun getSupabaseAccessToken(): String? {
        val prefs = getSharedPreferences("FlutterSharedPreferences", MODE_PRIVATE)
        val sessionStr = prefs.getString(AUTH_PREFS_KEY, null) ?: return null

        return try {
            val json = JSONObject(sessionStr)
            json.optString("access_token", null)
        } catch (_: Exception) {
            null
        }
    }

    private fun postClip(content: String, deviceName: String, accessToken: String): Boolean {
        return try {
            val url = URL("$SUPABASE_URL/rest/v1/clips")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.setRequestProperty("apikey", SUPABASE_ANON_KEY)
            conn.setRequestProperty("Authorization", "Bearer $accessToken")
            conn.setRequestProperty("Prefer", "return=minimal")
            conn.doOutput = true

            val body = JSONObject().apply {
                put("content", if (content.length > 100000) content.substring(0, 100000) else content)
                put("device_name", deviceName)
            }

            conn.outputStream.use { it.write(body.toString().toByteArray()) }

            val responseCode = conn.responseCode
            conn.disconnect()
            responseCode in 200..299
        } catch (_: Exception) {
            false
        }
    }
}
