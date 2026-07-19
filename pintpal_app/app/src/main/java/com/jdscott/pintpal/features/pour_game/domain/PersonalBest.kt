/**
 * personalBest.kt
 *
 * Purpose: Pure helper — whether a new pour score beats the stored personal best.
 * Connects to: PourGameScoreRepository logic; unit tests.
 */
package com.jdscott.pintpal.features.pour_game.domain

object PersonalBest {
    fun isImproved(previous: Double?, candidate: Double): Boolean =
        previous == null || candidate > previous
}
