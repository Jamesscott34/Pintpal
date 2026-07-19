/**
 * PourModels.kt
 *
 * Purpose: Shared domain models for the bartender pour mechanic (both mini-games).
 * Connects to: PourAccuracyScorer, PourSimulator, PourGlassView; used by pour_game / serving_game.
 * Notes: Levels are normalized 0–1. No Firestore in Stage 1. Copy must describe pour skill only.
 */
package com.jdscott.pintpal.features.games_common.domain

/** How the player starts and stops the pour. */
enum class PourInputMode {
    PRESS_AND_HOLD,
    TAP_TO_TOGGLE,
}

/**
 * Tunables passed into the shared pour view by each game / difficulty level.
 * All level values are fractions of glass height (0 = empty, 1 = rim).
 */
data class PourConfig(
    /** Glass fill rate in fraction-of-glass per second while pouring. */
    val pourSpeed: Float = 0.35f,
    /** Portion of each poured unit that becomes head/foam (0–1). */
    val headRatio: Float = 0.22f,
    val targetLiquidLevel: Float = 0.72f,
    val targetHeadSize: Float = 0.18f,
    val liquidTolerance: Float = 0.06f,
    val headTolerance: Float = 0.05f,
    /** Distance past the perfect window at which accuracy hits 0%. */
    val failDistance: Float = 0.35f,
    val inputMode: PourInputMode = PourInputMode.PRESS_AND_HOLD,
    /** ARGB liquid colour. */
    val liquidColor: Int = 0xFF1A1208.toInt(),
    /** ARGB head/foam colour. */
    val headColor: Int = 0xFFF2EBE0.toInt(),
)

data class PourState(
    val liquidLevel: Float = 0f,
    val headSize: Float = 0f,
    val isPouring: Boolean = false,
    val isOverflowed: Boolean = false,
)

/** Skill feedback — pour accuracy only, never drinking volume/speed. */
enum class PourFeedback {
    PERFECT_POUR,
    GOOD_POUR,
    TOO_LITTLE_LIQUID,
    TOO_MUCH_LIQUID,
    TOO_LITTLE_HEAD,
    TOO_MUCH_HEAD,
    OVERFLOWED,
    UNDERFILLED,
}

data class PourScore(
    val liquidLevel: Float,
    val headSize: Float,
    val liquidAccuracyPercent: Float,
    val headAccuracyPercent: Float,
    val overallAccuracyPercent: Float,
    val feedback: PourFeedback,
    /** UI-safe sentence, e.g. "Perfect Pour Accuracy: 94%". */
    val feedbackLabel: String,
)
