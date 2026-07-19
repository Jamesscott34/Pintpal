/**
 * DrinkRatingsActivity.kt
 *
 * Purpose: Post beer/mixes, rate 1–10, show nicest + similar suggestions.
 */
package com.jdscott.pintpal.features.drinks.ui

import android.content.Intent
import android.os.Bundle
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.NumberPicker
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.jdscott.pintpal.R
import com.jdscott.pintpal.features.auth.data.AuthRepository
import com.jdscott.pintpal.features.auth.ui.AuthLoginActivity
import com.jdscott.pintpal.features.drinks.data.DrinkEntry
import com.jdscott.pintpal.features.drinks.data.DrinkEntryRepository
import kotlinx.coroutines.launch

class DrinkRatingsActivity : AppCompatActivity() {

    private val authRepository = AuthRepository()
    private val repository = DrinkEntryRepository()
    private lateinit var status: TextView
    private lateinit var topList: LinearLayout
    private lateinit var feed: LinearLayout
    private var catalog: List<DrinkEntry> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.drinks_activity)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        title = getString(R.string.drinks_title)

        status = findViewById(R.id.drinks_status)
        topList = findViewById(R.id.drinks_top_list)
        feed = findViewById(R.id.drinks_feed)
        val titleInput = findViewById<EditText>(R.id.drinks_title_input)
        val baseInput = findViewById<EditText>(R.id.drinks_base_input)
        val mixinsInput = findViewById<EditText>(R.id.drinks_mixins_input)
        val notesInput = findViewById<EditText>(R.id.drinks_notes_input)

        lifecycleScope.launch {
            if (authRepository.loadCurrentUserDocument().getOrNull() == null) {
                startActivity(Intent(this@DrinkRatingsActivity, AuthLoginActivity::class.java))
                finish()
                return@launch
            }
            refresh()
        }

        findViewById<Button>(R.id.drinks_post).setOnClickListener {
            lifecycleScope.launch {
                try {
                    repository.create(
                        titleInput.text.toString(),
                        baseInput.text.toString(),
                        mixinsInput.text.toString(),
                        notesInput.text.toString(),
                    )
                    titleInput.text.clear()
                    baseInput.text.clear()
                    mixinsInput.text.clear()
                    notesInput.text.clear()
                    status.text = getString(R.string.drinks_posted)
                    refresh()
                } catch (e: Exception) {
                    status.text = e.message ?: getString(R.string.drinks_post_fail)
                }
            }
        }
    }

    private suspend fun refresh() {
        try {
            catalog = repository.listRecent()
            val nicest = catalog
                .filter { it.ratingCount > 0 }
                .sortedWith(
                    compareByDescending<DrinkEntry> { it.averageRating }
                        .thenByDescending { it.ratingCount },
                )
                .take(10)

            topList.removeAllViews()
            if (nicest.isEmpty()) {
                topList.addView(TextView(this).apply {
                    text = getString(R.string.drinks_empty)
                    setTextColor(getColor(R.color.games_common_muted))
                })
            } else {
                for (d in nicest) {
                    topList.addView(TextView(this).apply {
                        text = "${d.title} · ${"%.1f".format(d.averageRating)}/10 (${d.ratingCount})"
                        setTextColor(getColor(R.color.games_common_text))
                        setPadding(0, 0, 0, 10)
                    })
                }
            }

            feed.removeAllViews()
            if (catalog.isEmpty()) {
                feed.addView(TextView(this).apply {
                    text = getString(R.string.drinks_empty)
                    setTextColor(getColor(R.color.games_common_muted))
                })
            } else {
                for (d in catalog) {
                    feed.addView(buildRow(d))
                }
            }
        } catch (e: Exception) {
            status.text = e.message ?: "Could not load drinks"
        }
    }

    private fun buildRow(entry: DrinkEntry): LinearLayout {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, 0, 0, 20)
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
            )
        }
        row.addView(TextView(this).apply {
            text = entry.title
            setTextColor(getColor(R.color.games_common_text))
            textSize = 16f
        })
        row.addView(TextView(this).apply {
            text = buildString {
                append("%.1f".format(entry.averageRating))
                append("/10 · ")
                append(entry.ratingCount)
                append(" ratings")
                if (entry.mixins.isNotBlank()) {
                    append(" · ")
                    append(entry.mixins)
                }
            }
            setTextColor(getColor(R.color.games_common_accent))
        })
        val similar = repository.suggestSimilar(entry, catalog)
        if (similar.isNotEmpty()) {
            row.addView(TextView(this).apply {
                text = getString(
                    R.string.drinks_similar_fmt,
                    similar.joinToString { it.title },
                )
                setTextColor(getColor(R.color.games_common_muted))
                setPadding(0, 6, 0, 6)
            })
        }
        val picker = NumberPicker(this).apply {
            minValue = 1
            maxValue = 10
            value = 8
        }
        row.addView(picker)
        row.addView(Button(this).apply {
            text = getString(R.string.drinks_rate)
            setOnClickListener {
                lifecycleScope.launch {
                    try {
                        repository.rate(entry.id, picker.value)
                        Toast.makeText(
                            this@DrinkRatingsActivity,
                            R.string.drinks_rated,
                            Toast.LENGTH_SHORT,
                        ).show()
                        refresh()
                    } catch (e: Exception) {
                        Toast.makeText(
                            this@DrinkRatingsActivity,
                            e.message ?: "Rate failed",
                            Toast.LENGTH_SHORT,
                        ).show()
                    }
                }
            }
        })
        return row
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
