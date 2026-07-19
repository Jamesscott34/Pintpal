/**
 * BestPintsActivity.kt
 *
 * Purpose: Android Best Pints — upload photos, rate 1–10, daily/weekly winners.
 */
package com.jdscott.pintpal.features.ratings.ui

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.NumberPicker
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.jdscott.pintpal.R
import com.jdscott.pintpal.features.auth.data.AuthRepository
import com.jdscott.pintpal.features.auth.ui.AuthLoginActivity
import com.jdscott.pintpal.features.ratings.data.PintPhoto
import com.jdscott.pintpal.features.ratings.data.PintPhotoRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class BestPintsActivity : AppCompatActivity() {

    private val authRepository = AuthRepository()
    private val repository = PintPhotoRepository()
    private lateinit var statusView: TextView
    private lateinit var dailyBody: TextView
    private lateinit var weeklyList: LinearLayout
    private lateinit var feed: LinearLayout
    private var previousWeekKey: String = ""

    private val pickImage = registerForActivityResult(
        ActivityResultContracts.GetContent(),
    ) { uri: Uri? ->
        if (uri == null) return@registerForActivityResult
        lifecycleScope.launch { uploadUri(uri) }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.best_pints_activity)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        title = getString(R.string.best_pints_title)

        statusView = findViewById(R.id.best_pints_status)
        dailyBody = findViewById(R.id.best_pints_daily_body)
        weeklyList = findViewById(R.id.best_pints_weekly_list)
        feed = findViewById(R.id.best_pints_feed)

        lifecycleScope.launch {
            if (authRepository.loadCurrentUserDocument().getOrNull() == null) {
                startActivity(Intent(this@BestPintsActivity, AuthLoginActivity::class.java))
                finish()
                return@launch
            }
            refresh()
        }

        findViewById<Button>(R.id.best_pints_upload).setOnClickListener {
            pickImage.launch("image/*")
        }
    }

    private suspend fun uploadUri(uri: Uri) {
        statusView.text = "Uploading…"
        try {
            val bytes = withContext(Dispatchers.IO) {
                contentResolver.openInputStream(uri)?.use { it.readBytes() }
                    ?: error("Could not read image")
            }
            val type = contentResolver.getType(uri) ?: "image/jpeg"
            val name = uri.lastPathSegment ?: "pint.jpg"
            repository.uploadPintPhoto(bytes, type, name)
            statusView.text = getString(R.string.best_pints_upload_ok)
            refresh()
        } catch (e: Exception) {
            statusView.text = e.message ?: getString(R.string.best_pints_upload_fail)
            Toast.makeText(this, R.string.best_pints_upload_fail, Toast.LENGTH_SHORT).show()
        }
    }

    private suspend fun refresh() {
        try {
            val snap = repository.loadContestSnapshot()
            previousWeekKey = snap.previousWeekKey
            val today = snap.todayLeader
            val yesterday = snap.yesterdayWinner
            dailyBody.text = buildString {
                append("Today's leader: ")
                appendLine(
                    if (today != null && today.imageUrl.isNotBlank()) {
                        "${today.displayName} · ${"%.1f".format(today.averageRating)} / 10"
                    } else {
                        "none yet"
                    },
                )
                append("Yesterday's winner: ")
                append(
                    if (yesterday != null && yesterday.imageUrl.isNotBlank()) {
                        "${yesterday.displayName} · ${"%.1f".format(yesterday.averageRating)} / 10"
                    } else {
                        "none yet"
                    },
                )
            }

            weeklyList.removeAllViews()
            val header = TextView(this).apply {
                text = "Last week (${snap.previousWeekKey}) — pick the winner"
                setTextColor(getColor(R.color.games_common_muted))
                setPadding(0, 0, 0, 12)
            }
            weeklyList.addView(header)
            if (snap.lastWeekFinalists.isEmpty()) {
                weeklyList.addView(TextView(this).apply {
                    text = "Top 3 appear here after last week's ratings."
                    setTextColor(getColor(R.color.games_common_muted))
                })
            } else {
                for (photo in snap.lastWeekFinalists) {
                    weeklyList.addView(buildPhotoRow(photo, showVote = true))
                }
            }

            val weekHeader = TextView(this).apply {
                text = "This week top 3 (${snap.currentWeekKey})"
                setTextColor(getColor(R.color.games_common_muted))
                setPadding(0, 24, 0, 12)
            }
            weeklyList.addView(weekHeader)
            for (photo in snap.thisWeekTop3) {
                weeklyList.addView(buildPhotoRow(photo, showVote = false))
            }

            feed.removeAllViews()
            if (snap.recent.isEmpty()) {
                feed.addView(TextView(this).apply {
                    text = getString(R.string.best_pints_no_photos)
                    setTextColor(getColor(R.color.games_common_muted))
                })
            } else {
                for (photo in snap.recent) {
                    feed.addView(buildPhotoRow(photo, showVote = false))
                }
            }
        } catch (e: Exception) {
            statusView.text = e.message ?: "Could not load Best Pints"
        }
    }

    private fun buildPhotoRow(photo: PintPhoto, showVote: Boolean): LinearLayout {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, 0, 0, 20)
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
            )
        }
        row.addView(TextView(this).apply {
            text = photo.displayName
            setTextColor(getColor(R.color.games_common_text))
            textSize = 16f
        })
        row.addView(TextView(this).apply {
            text = getString(
                R.string.best_pints_avg_fmt,
                photo.averageRating,
                photo.ratingCount,
            )
            setTextColor(getColor(R.color.games_common_accent))
        })
        row.addView(TextView(this).apply {
            text = photo.imageUrl.take(64) + if (photo.imageUrl.length > 64) "…" else ""
            setTextColor(getColor(R.color.games_common_muted))
            textSize = 11f
            setPadding(0, 4, 0, 8)
        })

        val picker = NumberPicker(this).apply {
            minValue = 1
            maxValue = 10
            value = 8
        }
        row.addView(picker)

        row.addView(Button(this).apply {
            text = getString(R.string.best_pints_submit_rating)
            setOnClickListener {
                lifecycleScope.launch {
                    try {
                        repository.ratePhoto(photo.id, picker.value)
                        Toast.makeText(
                            this@BestPintsActivity,
                            R.string.best_pints_rated,
                            Toast.LENGTH_SHORT,
                        ).show()
                        refresh()
                    } catch (e: Exception) {
                        Toast.makeText(
                            this@BestPintsActivity,
                            e.message ?: "Rate failed",
                            Toast.LENGTH_SHORT,
                        ).show()
                    }
                }
            }
        })

        if (showVote) {
            row.addView(Button(this).apply {
                text = getString(R.string.best_pints_vote)
                setOnClickListener {
                    lifecycleScope.launch {
                        try {
                            repository.voteWeeklyWinner(previousWeekKey, photo.id)
                            Toast.makeText(
                                this@BestPintsActivity,
                                R.string.best_pints_voted,
                                Toast.LENGTH_SHORT,
                            ).show()
                            refresh()
                        } catch (e: Exception) {
                            Toast.makeText(
                                this@BestPintsActivity,
                                e.message ?: "Vote failed",
                                Toast.LENGTH_SHORT,
                            ).show()
                        }
                    }
                }
            })
        }
        return row
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
