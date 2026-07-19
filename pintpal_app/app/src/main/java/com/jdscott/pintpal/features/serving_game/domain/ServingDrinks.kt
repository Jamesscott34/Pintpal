/**
 * ServingDrinks.kt
 *
 * Purpose: Serving Rush drink/tap catalogue for Android.
 */
package com.jdscott.pintpal.features.serving_game.domain

import com.jdscott.pintpal.features.games_common.domain.PourConfig

data class ServingDrink(
    val id: String,
    val label: String,
    val pourConfig: PourConfig,
)

object ServingDrinks {
    const val ORDER_SECONDS = 14
    const val ORDERS_PER_RUN = 8
    const val MISS_PENALTY = 10

    val ALL = listOf(
        ServingDrink(
            id = "guinness",
            label = "Guinness",
            pourConfig = PourConfig(
                liquidColor = 0xFF1A1208.toInt(),
                headColor = 0xFFF2EBE0.toInt(),
                headRatio = 0.24f,
                targetLiquidLevel = 0.7f,
                targetHeadSize = 0.2f,
                pourSpeed = 0.32f,
            ),
        ),
        ServingDrink(
            id = "bulmers",
            label = "Bulmers",
            pourConfig = PourConfig(
                liquidColor = 0xFFC45A1A.toInt(),
                headColor = 0xFFF7E7C8.toInt(),
                headRatio = 0.12f,
                targetLiquidLevel = 0.82f,
                targetHeadSize = 0.1f,
                pourSpeed = 0.4f,
            ),
        ),
        ServingDrink(
            id = "lager",
            label = "Lager",
            pourConfig = PourConfig(
                liquidColor = 0xFFD4A017.toInt(),
                headColor = 0xFFFFF6E0.toInt(),
                headRatio = 0.16f,
                targetLiquidLevel = 0.78f,
                targetHeadSize = 0.14f,
                pourSpeed = 0.38f,
            ),
        ),
        ServingDrink(
            id = "cider",
            label = "Cider",
            pourConfig = PourConfig(
                liquidColor = 0xFFE8B84A.toInt(),
                headColor = 0xFFFFF8E8.toInt(),
                headRatio = 0.1f,
                targetLiquidLevel = 0.84f,
                targetHeadSize = 0.08f,
                pourSpeed = 0.42f,
            ),
        ),
    )

    fun byId(id: String): ServingDrink =
        ALL.first { it.id == id }

    fun randomId(exclude: String? = null): String {
        val pool = ALL.map { it.id }.filter { it != exclude }
        return pool.random()
    }
}
