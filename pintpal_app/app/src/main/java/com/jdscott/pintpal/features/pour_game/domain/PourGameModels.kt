/**
 * PourGameModels.kt
 *
 * Purpose: Domain models for Pour the Perfect Pint (phases, difficulty, timed durations).
 * Connects to: TwoPartPourController, practice/timed UI; uses games_common PourConfig/PourScore.
 * Notes: Bartender pour skill only — never drinking speed or volume.
 */
package com.jdscott.pintpal.features.pour_game.domain

enum class PourPhase {
    FIRST_POUR,
    SETTLE,
    TOP_UP,
    COMPLETE,
}

enum class PourGameMode {
    PRACTICE,
    TIMED,
}

data class PourPhaseTargets(
    val firstPourLiquid: Float,
    val firstPourHead: Float,
    val settledHead: Float,
    val settleDurationSeconds: Float,
    val finalLiquid: Float,
    val finalHead: Float,
)

data class PracticeDifficulty(
    val level: Int,
    val label: String,
    val pourSpeed: Float,
    val liquidTolerance: Float,
    val headTolerance: Float,
    val phases: PourPhaseTargets,
)

object PracticeLevels {
    const val SUCCESS_THRESHOLD = 75f

    private val basePhases = PourPhaseTargets(
        firstPourLiquid = 0.55f,
        firstPourHead = 0.12f,
        settledHead = 0.06f,
        settleDurationSeconds = 2.5f,
        finalLiquid = 0.72f,
        finalHead = 0.18f,
    )

    val ALL: List<PracticeDifficulty> = listOf(
        PracticeDifficulty(
            level = 1,
            label = "Practice — easy",
            pourSpeed = 0.22f,
            liquidTolerance = 0.1f,
            headTolerance = 0.08f,
            phases = basePhases.copy(settleDurationSeconds = 2.5f),
        ),
        PracticeDifficulty(
            level = 2,
            label = "Practice — steady",
            pourSpeed = 0.28f,
            liquidTolerance = 0.08f,
            headTolerance = 0.065f,
            phases = basePhases.copy(settleDurationSeconds = 2.2f),
        ),
        PracticeDifficulty(
            level = 3,
            label = "Practice — firm",
            pourSpeed = 0.34f,
            liquidTolerance = 0.06f,
            headTolerance = 0.05f,
            phases = basePhases.copy(settleDurationSeconds = 2.0f),
        ),
        PracticeDifficulty(
            level = 4,
            label = "Practice — sharp",
            pourSpeed = 0.4f,
            liquidTolerance = 0.045f,
            headTolerance = 0.04f,
            phases = basePhases.copy(settleDurationSeconds = 1.7f),
        ),
        PracticeDifficulty(
            level = 5,
            label = "Practice — expert",
            pourSpeed = 0.48f,
            liquidTolerance = 0.03f,
            headTolerance = 0.028f,
            phases = basePhases.copy(settleDurationSeconds = 1.4f),
        ),
    )

    val LEVEL_1: PracticeDifficulty = ALL.first()

    fun get(level: Int): PracticeDifficulty =
        ALL.find { it.level == level } ?: ALL.last()

    fun nextAfter(level: Int): PracticeDifficulty {
        val idx = ALL.indexOfFirst { it.level == level }
        if (idx < 0) return LEVEL_1
        return ALL[(idx + 1).coerceAtMost(ALL.lastIndex)]
    }

    fun isSuccess(overallAccuracyPercent: Float): Boolean =
        overallAccuracyPercent >= SUCCESS_THRESHOLD
}

/** Timed run lengths the player may choose (seconds). */
object TimedDurations {
    val OPTIONS = intArrayOf(30, 60, 90, 120)
}
