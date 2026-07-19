/**
 * FirebaseConstants.kt
 *
 * Purpose: Shared Firebase / Firestore collection and field name constants.
 * Connects to: Firebase project pintpal-71452. Used by feature data layers.
 * Notes: Do not invent new collection names here without confirming against the
 *        product spec. Stage 0 only documents the known "users" collection shape.
 */
package com.jdscott.pintpal.utilities

object FirebaseConstants {
    const val PROJECT_ID = "pintpal-71452"

    object Collections {
        const val USERS = "users"
        /** Pour the Perfect Pint scores only — never mixed with ratings/contribution boards. */
        const val POUR_GAME_SCORES = "pour_game_scores"
        /** Serving Rush scores only — never mixed with pour or ratings boards. */
        const val SERVING_GAME_SCORES = "serving_game_scores"
        /** Community pint photo contest entries. */
        const val PINT_PHOTOS = "pint_photos"
        /** Weekly contest finalists + winner (doc id = weekKey). */
        const val CONTEST_WEEKS = "contest_weeks"
        /** Daily winners cache (doc id = dayKey yyyy-MM-dd). */
        const val CONTEST_DAYS = "contest_days"
        /** Community drink / beer mix entries. */
        const val DRINK_ENTRIES = "drink_entries"
    }

    object DrinkEntryFields {
        const val USER_ID = "userId"
        const val DISPLAY_NAME = "displayName"
        const val TITLE = "title"
        const val BASE_BEER = "baseBeer"
        const val MIXINS = "mixins"
        const val TAGS = "tags"
        const val NOTES = "notes"
        const val CREATED_AT = "createdAt"
        const val RATING_SUM = "ratingSum"
        const val RATING_COUNT = "ratingCount"
        const val AVERAGE_RATING = "averageRating"
    }

    object DrinkRatingFields {
        const val SCORE = "score"
        const val CREATED_AT = "createdAt"
    }

    object PintPhotoFields {
        const val USER_ID = "userId"
        const val DISPLAY_NAME = "displayName"
        const val IMAGE_URL = "imageUrl"
        const val STORAGE_PATH = "storagePath"
        const val CREATED_AT = "createdAt"
        const val DAY_KEY = "dayKey"
        const val WEEK_KEY = "weekKey"
        const val RATING_SUM = "ratingSum"
        const val RATING_COUNT = "ratingCount"
        const val AVERAGE_RATING = "averageRating"
    }

    object PintPhotoRatingFields {
        const val SCORE = "score"
        const val CREATED_AT = "createdAt"
    }

    object ContestWeekFields {
        const val STATUS = "status"
        const val FINALIST_IDS = "finalistIds"
        const val WINNER_ID = "winnerId"
        const val UPDATED_AT = "updatedAt"
    }

    object ContestVoteFields {
        const val PHOTO_ID = "photoId"
        const val CREATED_AT = "createdAt"
    }

    object ContestDayFields {
        const val WINNER_ID = "winnerId"
        const val AVERAGE_RATING = "averageRating"
        const val DISPLAY_NAME = "displayName"
        const val IMAGE_URL = "imageUrl"
        const val UPDATED_AT = "updatedAt"
    }

    object UserFields {
        const val EMAIL = "email"
        const val NAME = "name"
        const val ROLE = "role"
        const val CAN_LOGIN = "canLogin"
        const val CAN_VIEW_ADMIN = "canViewAdmin"
        /** true == paid (unlimited photos); false == free (2 photos/day). Admins always paid. */
        const val SUBSCRIPTION_PAID = "subscriptionPaid"
        /** Free-tier counter: uploads on photoUploadDate (yyyy-MM-dd). */
        const val PHOTO_UPLOADS_TODAY = "photoUploadsToday"
        const val PHOTO_UPLOAD_DATE = "photoUploadDate"
        /** Profile: best practice Perfect Pour Accuracy (0–100). */
        const val POUR_GAME_BEST_PRACTICE = "pourGameBestPracticeAccuracy"
        /** Profile: map of durationSeconds → best timed accuracy sum. */
        const val POUR_GAME_BEST_TIMED = "pourGameBestTimedAccuracySums"
        /** Opt-in for public pour scoreboard. */
        const val POUR_GAME_SCOREBOARD_OPT_IN = "pourGameScoreboardOptIn"
        const val SERVING_GAME_BEST = "servingGameBestScore"
        const val SERVING_GAME_SCOREBOARD_OPT_IN = "servingGameScoreboardOptIn"
    }

    /** Free tier daily photo upload limit. Paid / admin = unlimited. */
    const val FREE_PHOTO_DAILY_LIMIT = 2

    object PourGameScoreFields {
        const val USER_ID = "userId"
        const val DISPLAY_NAME = "displayName"
        const val MODE = "mode"
        const val SCORE = "score"
        const val DURATION_SECONDS = "durationSeconds"
        const val LEVEL = "level"
        const val COMPLETED_POURS = "completedPours"
        const val BEST_SINGLE_ACCURACY = "bestSingleAccuracy"
        const val UPDATED_AT = "updatedAt"
        const val IS_PUBLIC = "isPublic"
    }

    object ServingGameScoreFields {
        const val USER_ID = "userId"
        const val DISPLAY_NAME = "displayName"
        const val SCORE = "score"
        const val COMPLETED_ORDERS = "completedOrders"
        const val MISSES = "misses"
        const val UPDATED_AT = "updatedAt"
        const val IS_PUBLIC = "isPublic"
    }
}
