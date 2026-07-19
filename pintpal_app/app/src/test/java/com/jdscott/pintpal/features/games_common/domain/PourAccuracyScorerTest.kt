/**
 * PourAccuracyScorerTest.kt
 *
 * Purpose: Unit tests proving pour accuracy scoring is deterministic and graded correctly.
 * Connects to: PourAccuracyScorer domain object.
 * Notes: Stage 1 verification — same input → same output; early/late-style fixtures differ.
 */
package com.jdscott.pintpal.features.games_common.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class PourAccuracyScorerTest {

    private val config = PourConfig(
        targetLiquidLevel = 0.72f,
        targetHeadSize = 0.18f,
        liquidTolerance = 0.06f,
        headTolerance = 0.05f,
        failDistance = 0.35f,
    )

    @Test
    fun score_isDeterministic_forSameInput() {
        val state = PourState(liquidLevel = 0.72f, headSize = 0.18f)
        val a = PourAccuracyScorer.score(state, config)
        val b = PourAccuracyScorer.score(state, config)
        val c = PourAccuracyScorer.score(state, config)
        assertEquals(a, b)
        assertEquals(b, c)
        assertEquals(PourFeedback.PERFECT_POUR, a.feedback)
        assertEquals(100f, a.overallAccuracyPercent, 0.01f)
    }

    @Test
    fun score_tooLittleHead_whenHeadBelowTarget() {
        val state = PourState(liquidLevel = 0.72f, headSize = 0.02f)
        val score = PourAccuracyScorer.score(state, config)
        assertEquals(PourFeedback.TOO_LITTLE_HEAD, score.feedback)
        assertTrue(score.overallAccuracyPercent < 100f)
    }

    @Test
    fun score_overflowed_whenPastRim() {
        val state = PourState(
            liquidLevel = 0.85f,
            headSize = 0.25f,
            isOverflowed = true,
        )
        val score = PourAccuracyScorer.score(state, config)
        assertEquals(PourFeedback.OVERFLOWED, score.feedback)
    }

    @Test
    fun score_earlyVsLate_produceDifferentGrades() {
        val early = PourAccuracyScorer.score(
            PourState(liquidLevel = 0.40f, headSize = 0.06f),
            config,
        )
        val late = PourAccuracyScorer.score(
            PourState(liquidLevel = 0.88f, headSize = 0.30f, isOverflowed = true),
            config,
        )
        assertNotEquals(early.feedback, late.feedback)
        assertEquals(PourFeedback.TOO_LITTLE_LIQUID, early.feedback)
        assertEquals(PourFeedback.OVERFLOWED, late.feedback)
    }

    @Test
    fun advance_raisesLiquidAndHead_whilePouring() {
        val start = PourState(isPouring = true)
        val next = PourSimulator.advance(start, config, 0.5f)
        assertTrue(next.liquidLevel > 0f)
        assertTrue(next.headSize > 0f)
        val again = PourSimulator.advance(start, config, 0.5f)
        assertEquals(next.liquidLevel, again.liquidLevel, 0.0001f)
        assertEquals(next.headSize, again.headSize, 0.0001f)
    }
}
