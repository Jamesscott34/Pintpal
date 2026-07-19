/**
 * PourPracticeGradeTest.kt
 *
 * Purpose: Verifies early vs late top-up stops produce distinct practice grades.
 * Connects to: PourAccuracyScorer with PracticeLevels.LEVEL_1 final targets.
 */
package com.jdscott.pintpal.features.pour_game.domain

import com.jdscott.pintpal.features.games_common.domain.PourAccuracyScorer
import com.jdscott.pintpal.features.games_common.domain.PourConfig
import com.jdscott.pintpal.features.games_common.domain.PourFeedback
import com.jdscott.pintpal.features.games_common.domain.PourState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class PourPracticeGradeTest {

    private val level = PracticeLevels.LEVEL_1

    private val finalConfig = PourConfig(
        targetLiquidLevel = level.phases.finalLiquid,
        targetHeadSize = level.phases.finalHead,
        liquidTolerance = level.liquidTolerance,
        headTolerance = level.headTolerance,
        failDistance = 0.4f,
    )

    @Test
    fun earlyTopUp_gradesTooLittleHead() {
        val early = PourState(liquidLevel = 0.70f, headSize = 0.02f)
        val score = PourAccuracyScorer.score(early, finalConfig)
        assertEquals(PourFeedback.TOO_LITTLE_HEAD, score.feedback)
    }

    @Test
    fun lateTopUp_gradesOverflowed() {
        val late = PourState(
            liquidLevel = 0.85f,
            headSize = 0.28f,
            isOverflowed = true,
        )
        val score = PourAccuracyScorer.score(late, finalConfig)
        assertEquals(PourFeedback.OVERFLOWED, score.feedback)
    }

    @Test
    fun earlyAndLate_differVisibly() {
        val early = PourAccuracyScorer.score(
            PourState(liquidLevel = 0.70f, headSize = 0.02f),
            finalConfig,
        )
        val late = PourAccuracyScorer.score(
            PourState(liquidLevel = 0.85f, headSize = 0.28f, isOverflowed = true),
            finalConfig,
        )
        assertNotEquals(early.feedback, late.feedback)
        assertNotEquals(early.feedbackLabel, late.feedbackLabel)
    }
}
