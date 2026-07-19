/**
 * PersonalBestTest.kt
 *
 * Purpose: Verifies personal-best gate — worse runs must not overwrite better scores.
 */
package com.jdscott.pintpal.features.pour_game.domain

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PersonalBestTest {
    @Test
    fun firstScore_isAlwaysPersonalBest() {
        assertTrue(PersonalBest.isImproved(null, 80.0))
    }

    @Test
    fun higherScore_updatesBest() {
        assertTrue(PersonalBest.isImproved(80.0, 90.0))
    }

    @Test
    fun equalOrWorse_doesNotUpdateBest() {
        assertFalse(PersonalBest.isImproved(90.0, 90.0))
        assertFalse(PersonalBest.isImproved(90.0, 70.0))
    }
}
