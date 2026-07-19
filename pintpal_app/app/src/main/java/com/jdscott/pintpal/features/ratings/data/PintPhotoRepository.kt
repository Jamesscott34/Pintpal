/**
 * PintPhotoRepository.kt
 *
 * Purpose: Upload, list, rate Best Pints photos; daily/weekly winners + votes.
 */
package com.jdscott.pintpal.features.ratings.data

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.SetOptions
import com.google.firebase.storage.FirebaseStorage
import com.jdscott.pintpal.features.auth.data.AuthRepository
import com.jdscott.pintpal.utilities.FirebaseConstants
import com.jdscott.pintpal.utilities.UserPermissions
import kotlinx.coroutines.tasks.await

data class PintPhoto(
    val id: String,
    val userId: String,
    val displayName: String,
    val imageUrl: String,
    val storagePath: String,
    val createdAtMs: Long,
    val dayKey: String,
    val weekKey: String,
    val ratingSum: Double,
    val ratingCount: Int,
    val averageRating: Double,
)

data class ContestDay(
    val dayKey: String,
    val winnerId: String,
    val averageRating: Double,
    val displayName: String,
    val imageUrl: String,
)

data class ContestWeek(
    val weekKey: String,
    val status: String,
    val finalistIds: List<String>,
    val winnerId: String?,
)

data class ContestSnapshot(
    val recent: List<PintPhoto>,
    val todayLeader: ContestDay?,
    val yesterdayWinner: ContestDay?,
    val thisWeekTop3: List<PintPhoto>,
    val lastWeek: ContestWeek,
    val lastWeekFinalists: List<PintPhoto>,
    val currentWeekKey: String,
    val previousWeekKey: String,
)

class PintPhotoRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance(),
    private val db: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val storage: FirebaseStorage = FirebaseStorage.getInstance(),
    private val authRepository: AuthRepository = AuthRepository(),
) {
    private fun mapPhoto(id: String, data: Map<String, Any?>): PintPhoto {
        fun num(key: String): Double =
            (data[key] as? Number)?.toDouble() ?: 0.0
        fun int(key: String): Int =
            (data[key] as? Number)?.toInt() ?: 0
        fun str(key: String): String =
            data[key] as? String ?: ""

        return PintPhoto(
            id = id,
            userId = str(FirebaseConstants.PintPhotoFields.USER_ID),
            displayName = str(FirebaseConstants.PintPhotoFields.DISPLAY_NAME).ifBlank { "Member" },
            imageUrl = str(FirebaseConstants.PintPhotoFields.IMAGE_URL),
            storagePath = str(FirebaseConstants.PintPhotoFields.STORAGE_PATH),
            createdAtMs = (data[FirebaseConstants.PintPhotoFields.CREATED_AT] as? Number)?.toLong() ?: 0L,
            dayKey = str(FirebaseConstants.PintPhotoFields.DAY_KEY),
            weekKey = str(FirebaseConstants.PintPhotoFields.WEEK_KEY),
            ratingSum = num(FirebaseConstants.PintPhotoFields.RATING_SUM),
            ratingCount = int(FirebaseConstants.PintPhotoFields.RATING_COUNT),
            averageRating = num(FirebaseConstants.PintPhotoFields.AVERAGE_RATING),
        )
    }

    private fun sortByAverage(photos: List<PintPhoto>): List<PintPhoto> =
        photos.sortedWith(
            compareByDescending<PintPhoto> { it.averageRating }
                .thenByDescending { it.ratingCount },
        )

    suspend fun listRecentPhotos(max: Long = 40): List<PintPhoto> {
        val snap = db.collection(FirebaseConstants.Collections.PINT_PHOTOS)
            .orderBy(FirebaseConstants.PintPhotoFields.CREATED_AT, Query.Direction.DESCENDING)
            .limit(max)
            .get()
            .await()
        return snap.documents.map { mapPhoto(it.id, it.data ?: emptyMap()) }
    }

    suspend fun listPhotosForDay(dayKey: String): List<PintPhoto> {
        val snap = db.collection(FirebaseConstants.Collections.PINT_PHOTOS)
            .whereEqualTo(FirebaseConstants.PintPhotoFields.DAY_KEY, dayKey)
            .limit(100)
            .get()
            .await()
        return sortByAverage(snap.documents.map { mapPhoto(it.id, it.data ?: emptyMap()) })
    }

    suspend fun listPhotosForWeek(weekKey: String): List<PintPhoto> {
        val snap = db.collection(FirebaseConstants.Collections.PINT_PHOTOS)
            .whereEqualTo(FirebaseConstants.PintPhotoFields.WEEK_KEY, weekKey)
            .limit(100)
            .get()
            .await()
        return sortByAverage(snap.documents.map { mapPhoto(it.id, it.data ?: emptyMap()) })
    }

    suspend fun uploadPintPhoto(bytes: ByteArray, contentType: String, fileName: String): PintPhoto {
        val user = auth.currentUser ?: error("Not signed in")
        val profile = authRepository.loadCurrentUserDocument().getOrNull()
            ?: error("User profile missing")
        val flags = profile.toPermissionFlags()
        if (!UserPermissions.canUploadPhoto(flags)) {
            error("Photo upload limit reached for today (free plan).")
        }

        val dayKey = ContestKeys.dayKey()
        val weekKey = ContestKeys.weekKey()
        val safeName = fileName.replace(Regex("[^a-zA-Z0-9._-]"), "_")
        val storagePath = "users/${user.uid}/uploads/pint_${System.currentTimeMillis()}_$safeName"
        val storageRef = storage.reference.child(storagePath)
        storageRef.putBytes(bytes, com.google.firebase.storage.StorageMetadata.Builder()
            .setContentType(contentType.ifBlank { "image/jpeg" })
            .build()).await()
        val imageUrl = storageRef.downloadUrl.await().toString()

        val photoRef = db.collection(FirebaseConstants.Collections.PINT_PHOTOS).document()
        val createdAt = System.currentTimeMillis()
        val payload = hashMapOf<String, Any>(
            FirebaseConstants.PintPhotoFields.USER_ID to user.uid,
            FirebaseConstants.PintPhotoFields.DISPLAY_NAME to
                profile.name.ifBlank { profile.email.ifBlank { "Member" } },
            FirebaseConstants.PintPhotoFields.IMAGE_URL to imageUrl,
            FirebaseConstants.PintPhotoFields.STORAGE_PATH to storagePath,
            FirebaseConstants.PintPhotoFields.CREATED_AT to createdAt,
            FirebaseConstants.PintPhotoFields.DAY_KEY to dayKey,
            FirebaseConstants.PintPhotoFields.WEEK_KEY to weekKey,
            FirebaseConstants.PintPhotoFields.RATING_SUM to 0,
            FirebaseConstants.PintPhotoFields.RATING_COUNT to 0,
            FirebaseConstants.PintPhotoFields.AVERAGE_RATING to 0,
        )
        photoRef.set(payload).await()

        if (!UserPermissions.isSubscriptionPaid(flags)) {
            val used = UserPermissions.photoUploadsUsedToday(flags)
            db.collection(FirebaseConstants.Collections.USERS).document(user.uid)
                .set(
                    mapOf(
                        FirebaseConstants.UserFields.PHOTO_UPLOADS_TODAY to used + 1,
                        FirebaseConstants.UserFields.PHOTO_UPLOAD_DATE to dayKey,
                    ),
                    SetOptions.merge(),
                )
                .await()
        }

        return mapPhoto(photoRef.id, payload)
    }

    suspend fun ratePhoto(photoId: String, score: Int) {
        val user = auth.currentUser ?: error("Not signed in")
        val clamped = score.coerceIn(1, 10)
        val photoRef = db.collection(FirebaseConstants.Collections.PINT_PHOTOS).document(photoId)
        val ratingRef = photoRef.collection("ratings").document(user.uid)

        db.runTransaction { tx ->
            val photoSnap = tx.get(photoRef)
            if (!photoSnap.exists()) error("Photo not found")
            val ratingSnap = tx.get(ratingRef)
            val oldSum = (photoSnap.get(FirebaseConstants.PintPhotoFields.RATING_SUM) as? Number)?.toDouble() ?: 0.0
            val oldCount = (photoSnap.get(FirebaseConstants.PintPhotoFields.RATING_COUNT) as? Number)?.toInt() ?: 0
            var newSum = oldSum
            var newCount = oldCount
            if (ratingSnap.exists()) {
                val prev = (ratingSnap.get(FirebaseConstants.PintPhotoRatingFields.SCORE) as? Number)?.toDouble() ?: 0.0
                newSum = oldSum - prev + clamped
            } else {
                newSum = oldSum + clamped
                newCount = oldCount + 1
            }
            val average = if (newCount > 0) newSum / newCount else 0.0
            tx.set(
                ratingRef,
                mapOf(
                    FirebaseConstants.PintPhotoRatingFields.SCORE to clamped,
                    FirebaseConstants.PintPhotoRatingFields.CREATED_AT to System.currentTimeMillis(),
                ),
            )
            tx.update(
                photoRef,
                mapOf(
                    FirebaseConstants.PintPhotoFields.RATING_SUM to newSum,
                    FirebaseConstants.PintPhotoFields.RATING_COUNT to newCount,
                    FirebaseConstants.PintPhotoFields.AVERAGE_RATING to average,
                ),
            )
        }.await()
    }

    suspend fun ensureDailyWinner(dayKey: String): ContestDay? {
        val ranked = listPhotosForDay(dayKey)
        val top = ranked.firstOrNull { it.ratingCount > 0 } ?: ranked.firstOrNull() ?: return null
        val payload = mapOf(
            FirebaseConstants.ContestDayFields.WINNER_ID to top.id,
            FirebaseConstants.ContestDayFields.AVERAGE_RATING to top.averageRating,
            FirebaseConstants.ContestDayFields.DISPLAY_NAME to top.displayName,
            FirebaseConstants.ContestDayFields.IMAGE_URL to top.imageUrl,
            FirebaseConstants.ContestDayFields.UPDATED_AT to System.currentTimeMillis(),
        )
        db.collection(FirebaseConstants.Collections.CONTEST_DAYS).document(dayKey)
            .set(payload, SetOptions.merge())
            .await()
        return ContestDay(
            dayKey = dayKey,
            winnerId = top.id,
            averageRating = top.averageRating,
            displayName = top.displayName,
            imageUrl = top.imageUrl,
        )
    }

    suspend fun loadDailyWinner(dayKey: String): ContestDay? {
        val snap = db.collection(FirebaseConstants.Collections.CONTEST_DAYS).document(dayKey).get().await()
        if (!snap.exists()) return ensureDailyWinner(dayKey)
        return ContestDay(
            dayKey = dayKey,
            winnerId = snap.getString(FirebaseConstants.ContestDayFields.WINNER_ID).orEmpty(),
            averageRating = (snap.get(FirebaseConstants.ContestDayFields.AVERAGE_RATING) as? Number)?.toDouble() ?: 0.0,
            displayName = snap.getString(FirebaseConstants.ContestDayFields.DISPLAY_NAME).orEmpty(),
            imageUrl = snap.getString(FirebaseConstants.ContestDayFields.IMAGE_URL).orEmpty(),
        )
    }

    suspend fun ensureWeeklyFinalists(weekKey: String): ContestWeek {
        val weekRef = db.collection(FirebaseConstants.Collections.CONTEST_WEEKS).document(weekKey)
        val existing = weekRef.get().await()
        if (existing.exists()) {
            @Suppress("UNCHECKED_CAST")
            val ids = (existing.get(FirebaseConstants.ContestWeekFields.FINALIST_IDS) as? List<*>)
                ?.mapNotNull { it as? String }
                ?.take(3)
                .orEmpty()
            return ContestWeek(
                weekKey = weekKey,
                status = existing.getString(FirebaseConstants.ContestWeekFields.STATUS) ?: "voting",
                finalistIds = ids,
                winnerId = existing.getString(FirebaseConstants.ContestWeekFields.WINNER_ID),
            )
        }
        val ranked = listPhotosForWeek(weekKey)
        val rated = ranked.filter { it.ratingCount > 0 }.take(3).map { it.id }
        val ids = if (rated.isNotEmpty()) rated else ranked.take(3).map { it.id }
        weekRef.set(
            mapOf(
                FirebaseConstants.ContestWeekFields.STATUS to "voting",
                FirebaseConstants.ContestWeekFields.FINALIST_IDS to ids,
                FirebaseConstants.ContestWeekFields.WINNER_ID to null,
                FirebaseConstants.ContestWeekFields.UPDATED_AT to System.currentTimeMillis(),
            ),
        ).await()
        return ContestWeek(weekKey, "voting", ids, null)
    }

    suspend fun loadPhotosByIds(ids: List<String>): List<PintPhoto> {
        if (ids.isEmpty()) return emptyList()
        return ids.mapNotNull { id ->
            val snap = db.collection(FirebaseConstants.Collections.PINT_PHOTOS).document(id).get().await()
            if (!snap.exists()) null else mapPhoto(snap.id, snap.data ?: emptyMap())
        }
    }

    suspend fun voteWeeklyWinner(weekKey: String, photoId: String) {
        val user = auth.currentUser ?: error("Not signed in")
        val week = ensureWeeklyFinalists(weekKey)
        if (photoId !in week.finalistIds) error("That photo is not in this week's top 3.")

        val voteRef = db.collection(FirebaseConstants.Collections.CONTEST_WEEKS)
            .document(weekKey)
            .collection("votes")
            .document(user.uid)
        voteRef.set(
            mapOf(
                FirebaseConstants.ContestVoteFields.PHOTO_ID to photoId,
                FirebaseConstants.ContestVoteFields.CREATED_AT to System.currentTimeMillis(),
            ),
        ).await()

        val votes = db.collection(FirebaseConstants.Collections.CONTEST_WEEKS)
            .document(weekKey)
            .collection("votes")
            .get()
            .await()
        val tallies = mutableMapOf<String, Int>()
        for (doc in votes.documents) {
            val pid = doc.getString(FirebaseConstants.ContestVoteFields.PHOTO_ID) ?: continue
            tallies[pid] = (tallies[pid] ?: 0) + 1
        }
        var winnerId: String? = null
        var best = -1
        for (id in week.finalistIds) {
            val n = tallies[id] ?: 0
            if (n > best) {
                best = n
                winnerId = id
            }
        }
        if (winnerId != null) {
            db.collection(FirebaseConstants.Collections.CONTEST_WEEKS).document(weekKey)
                .set(
                    mapOf(
                        FirebaseConstants.ContestWeekFields.WINNER_ID to winnerId,
                        FirebaseConstants.ContestWeekFields.STATUS to "voting",
                        FirebaseConstants.ContestWeekFields.UPDATED_AT to System.currentTimeMillis(),
                    ),
                    SetOptions.merge(),
                )
                .await()
        }
    }

    suspend fun loadContestSnapshot(): ContestSnapshot {
        val currentWeek = ContestKeys.weekKey()
        val prevWeek = ContestKeys.previousWeekKey()
        val today = ContestKeys.dayKey()
        val yesterday = ContestKeys.yesterdayDayKey()

        val recent = listRecentPhotos()
        val thisWeek = listPhotosForWeek(currentWeek)
        val todayLeader = ensureDailyWinner(today)
        val yesterdayWinner = loadDailyWinner(yesterday)
        val lastWeek = ensureWeeklyFinalists(prevWeek)
        val lastWeekFinalists = loadPhotosByIds(lastWeek.finalistIds)

        return ContestSnapshot(
            recent = recent,
            todayLeader = todayLeader,
            yesterdayWinner = yesterdayWinner,
            thisWeekTop3 = thisWeek.filter { it.ratingCount > 0 }.take(3),
            lastWeek = lastWeek,
            lastWeekFinalists = lastWeekFinalists,
            currentWeekKey = currentWeek,
            previousWeekKey = prevWeek,
        )
    }
}
