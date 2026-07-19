/**
 * DrinkEntryRepository.kt
 *
 * Purpose: Create/list/rate drink entries; suggest similar beers/mixes.
 */
package com.jdscott.pintpal.features.drinks.data

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.jdscott.pintpal.features.auth.data.AuthRepository
import com.jdscott.pintpal.utilities.FirebaseConstants
import kotlinx.coroutines.tasks.await

data class DrinkEntry(
    val id: String,
    val userId: String,
    val displayName: String,
    val title: String,
    val baseBeer: String,
    val mixins: String,
    val tags: List<String>,
    val notes: String,
    val createdAtMs: Long,
    val ratingSum: Double,
    val ratingCount: Int,
    val averageRating: Double,
)

class DrinkEntryRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val db: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val authRepository: AuthRepository = AuthRepository(),
) {
    private fun normalizeTags(baseBeer: String, mixins: String, title: String): List<String> {
        val raw = "$baseBeer $mixins $title"
            .lowercase()
            .replace(Regex("[^a-z0-9\\s]"), " ")
            .split(Regex("\\s+"))
            .filter { it.length > 1 }
        return raw.distinct().take(16)
    }

    private fun mapEntry(id: String, data: Map<String, Any?>): DrinkEntry {
        fun str(key: String) = data[key] as? String ?: ""
        fun num(key: String) = (data[key] as? Number)?.toDouble() ?: 0.0
        fun int(key: String) = (data[key] as? Number)?.toInt() ?: 0
        @Suppress("UNCHECKED_CAST")
        val tags = (data[FirebaseConstants.DrinkEntryFields.TAGS] as? List<*>)
            ?.mapNotNull { it as? String }
            .orEmpty()
        return DrinkEntry(
            id = id,
            userId = str(FirebaseConstants.DrinkEntryFields.USER_ID),
            displayName = str(FirebaseConstants.DrinkEntryFields.DISPLAY_NAME).ifBlank { "Member" },
            title = str(FirebaseConstants.DrinkEntryFields.TITLE),
            baseBeer = str(FirebaseConstants.DrinkEntryFields.BASE_BEER),
            mixins = str(FirebaseConstants.DrinkEntryFields.MIXINS),
            tags = tags,
            notes = str(FirebaseConstants.DrinkEntryFields.NOTES),
            createdAtMs = (data[FirebaseConstants.DrinkEntryFields.CREATED_AT] as? Number)?.toLong() ?: 0L,
            ratingSum = num(FirebaseConstants.DrinkEntryFields.RATING_SUM),
            ratingCount = int(FirebaseConstants.DrinkEntryFields.RATING_COUNT),
            averageRating = num(FirebaseConstants.DrinkEntryFields.AVERAGE_RATING),
        )
    }

    suspend fun listRecent(max: Long = 50): List<DrinkEntry> {
        val snap = db.collection(FirebaseConstants.Collections.DRINK_ENTRIES)
            .orderBy(FirebaseConstants.DrinkEntryFields.CREATED_AT, Query.Direction.DESCENDING)
            .limit(max)
            .get()
            .await()
        return snap.documents.map { mapEntry(it.id, it.data ?: emptyMap()) }
    }

    suspend fun create(title: String, baseBeer: String, mixins: String, notes: String): DrinkEntry {
        val user = auth.currentUser ?: error("Not signed in")
        val profile = authRepository.loadCurrentUserDocument().getOrNull()
            ?: error("User profile missing")
        val trimmedTitle = title.trim()
        require(trimmedTitle.isNotEmpty()) { "Enter a drink name (e.g. Heineken with lemon)." }
        val base = baseBeer.trim().ifBlank { trimmedTitle.split(Regex("\\s+")).firstOrNull() ?: "Beer" }
        val tags = normalizeTags(base, mixins, trimmedTitle)
        val ref = db.collection(FirebaseConstants.Collections.DRINK_ENTRIES).document()
        val payload = hashMapOf<String, Any>(
            FirebaseConstants.DrinkEntryFields.USER_ID to user.uid,
            FirebaseConstants.DrinkEntryFields.DISPLAY_NAME to
                profile.name.ifBlank { profile.email.ifBlank { "Member" } },
            FirebaseConstants.DrinkEntryFields.TITLE to trimmedTitle,
            FirebaseConstants.DrinkEntryFields.BASE_BEER to base,
            FirebaseConstants.DrinkEntryFields.MIXINS to mixins.trim(),
            FirebaseConstants.DrinkEntryFields.TAGS to tags,
            FirebaseConstants.DrinkEntryFields.NOTES to notes.trim(),
            FirebaseConstants.DrinkEntryFields.CREATED_AT to System.currentTimeMillis(),
            FirebaseConstants.DrinkEntryFields.RATING_SUM to 0,
            FirebaseConstants.DrinkEntryFields.RATING_COUNT to 0,
            FirebaseConstants.DrinkEntryFields.AVERAGE_RATING to 0,
        )
        ref.set(payload).await()
        return mapEntry(ref.id, payload)
    }

    suspend fun rate(drinkId: String, score: Int) {
        val user = auth.currentUser ?: error("Not signed in")
        val clamped = score.coerceIn(1, 10)
        val drinkRef = db.collection(FirebaseConstants.Collections.DRINK_ENTRIES).document(drinkId)
        val ratingRef = drinkRef.collection("ratings").document(user.uid)
        db.runTransaction { tx ->
            val drinkSnap = tx.get(drinkRef)
            if (!drinkSnap.exists()) error("Drink not found")
            val ratingSnap = tx.get(ratingRef)
            val oldSum = (drinkSnap.get(FirebaseConstants.DrinkEntryFields.RATING_SUM) as? Number)?.toDouble() ?: 0.0
            val oldCount = (drinkSnap.get(FirebaseConstants.DrinkEntryFields.RATING_COUNT) as? Number)?.toInt() ?: 0
            var newSum = oldSum
            var newCount = oldCount
            if (ratingSnap.exists()) {
                val prev = (ratingSnap.get(FirebaseConstants.DrinkRatingFields.SCORE) as? Number)?.toDouble() ?: 0.0
                newSum = oldSum - prev + clamped
            } else {
                newSum = oldSum + clamped
                newCount = oldCount + 1
            }
            val average = if (newCount > 0) newSum / newCount else 0.0
            tx.set(
                ratingRef,
                mapOf(
                    FirebaseConstants.DrinkRatingFields.SCORE to clamped,
                    FirebaseConstants.DrinkRatingFields.CREATED_AT to System.currentTimeMillis(),
                ),
            )
            tx.update(
                drinkRef,
                mapOf(
                    FirebaseConstants.DrinkEntryFields.RATING_SUM to newSum,
                    FirebaseConstants.DrinkEntryFields.RATING_COUNT to newCount,
                    FirebaseConstants.DrinkEntryFields.AVERAGE_RATING to average,
                ),
            )
        }.await()
    }

    fun suggestSimilar(entry: DrinkEntry, catalog: List<DrinkEntry>, max: Int = 5): List<DrinkEntry> {
        val base = entry.baseBeer.trim().lowercase()
        val tagSet = entry.tags.map { it.lowercase() }.toSet()
        return catalog
            .filter { it.id != entry.id }
            .map { d ->
                var score = 0
                if (base.isNotEmpty() && d.baseBeer.trim().lowercase() == base) score += 5
                for (t in d.tags) if (tagSet.contains(t.lowercase())) score += 1
                if (base.isNotEmpty() && d.title.lowercase().contains(base) &&
                    d.baseBeer.trim().lowercase() != base
                ) {
                    score += 2
                }
                d to score
            }
            .filter { it.second > 0 }
            .sortedWith(
                compareByDescending<Pair<DrinkEntry, Int>> { it.second }
                    .thenByDescending { it.first.averageRating },
            )
            .take(max)
            .map { it.first }
    }
}
