/**
 * ServingDrinks.kt
 *
 * Purpose: Serving Rush drink catalogue + progressive heat difficulty.
 */
package com.jdscott.pintpal.features.serving_game.domain

import com.jdscott.pintpal.features.games_common.domain.PourConfig

data class ServingDrink(
    val id: String,
    val label: String,
    val pourConfig: PourConfig,
)

data class ServingHeat(
    val label: String,
    val seconds: Int,
    val choiceCount: Int,
    val pourSpeedMul: Float,
    val toleranceMul: Float,
)

object ServingDrinks {
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

    fun heatForOrder(orderIndex: Int): ServingHeat = when {
        orderIndex <= 1 -> ServingHeat("Easy", 22, 2, 0.72f, 1.55f)
        orderIndex <= 3 -> ServingHeat("Warming up", 16, 3, 0.95f, 1.2f)
        orderIndex <= 5 -> ServingHeat("Busy", 12, 4, 1.15f, 1f)
        else -> ServingHeat("Rush hour", 9, 4, 1.4f, 0.72f)
    }

    /** Pint names for this order — always includes the correct drink. */
    fun choicesForOrder(correctId: String, orderIndex: Int): List<String> {
        val count = heatForOrder(orderIndex).choiceCount.coerceAtMost(ALL.size)
        val others = ALL.map { it.id }.filter { it != correctId }.shuffled().take(count - 1)
        return (listOf(correctId) + others).shuffled()
    }

    fun pourConfigForHeat(drinkId: String, orderIndex: Int): PourConfig {
        val drink = byId(drinkId)
        val heat = heatForOrder(orderIndex)
        val base = drink.pourConfig
        return base.copy(
            pourSpeed = base.pourSpeed * heat.pourSpeedMul,
            liquidTolerance = base.liquidTolerance * heat.toleranceMul,
            headTolerance = base.headTolerance * heat.toleranceMul,
        )
    }
}
