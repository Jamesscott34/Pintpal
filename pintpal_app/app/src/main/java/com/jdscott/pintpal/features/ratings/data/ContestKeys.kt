/**
 * ContestKeys.kt
 *
 * Purpose: UTC day / ISO week keys for Best Pints contests (mirrors web).
 */
package com.jdscott.pintpal.features.ratings.data

import java.time.DayOfWeek
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.temporal.WeekFields

object ContestKeys {
    fun dayKey(date: LocalDate = LocalDate.now(ZoneOffset.UTC)): String = date.toString()

    fun yesterdayDayKey(date: LocalDate = LocalDate.now(ZoneOffset.UTC)): String =
        dayKey(date.minusDays(1))

    fun weekKey(date: LocalDate = LocalDate.now(ZoneOffset.UTC)): String {
        val weekFields = WeekFields.ISO
        val week = date.get(weekFields.weekOfWeekBasedYear())
        val year = date.get(weekFields.weekBasedYear())
        return "%d-W%02d".format(year, week)
    }

    fun previousWeekKey(date: LocalDate = LocalDate.now(ZoneOffset.UTC)): String =
        weekKey(date.minusWeeks(1))

    fun mondayOfWeek(weekKey: String): LocalDate? {
        // Not required for MVP listing; reserved for future filters.
        return null
    }

    fun isWeekendUtc(): Boolean {
        val dow = LocalDate.now(ZoneOffset.UTC).dayOfWeek
        return dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY
    }
}
