/**
 * PourGameModels.kt
 *
 * Purpose: Domain models for Pour the Perfect Pint (phases, difficulty, modes).
 * Connects to: TwoPartPourController, practice UI; uses games_common PourConfig/PourScore.
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

/** Stage 2 practice — generous windows so players can learn the mechanic. */
object PracticeLevels {
    val LEVEL_1 = PracticeDifficulty(
        level = 1,
        label = "Practice — easy",
        pourSpeed = 0.22f,
        liquidTolerance = 0.1f,
        headTolerance = 0.08f,
        phases = PourPhaseTargets(
            firstPourLiquid = 0.55f,
            firstPourHead = 0.12f,
            settledHead = 0.06f,
            settleDurationSeconds = 2.5f,
            finalLiquid = 0.72f,
            finalHead = 0.18f,
        ),
    )
}
