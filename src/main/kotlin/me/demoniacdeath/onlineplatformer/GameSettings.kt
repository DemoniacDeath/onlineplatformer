package me.demoniacdeath.onlineplatformer

import org.springframework.stereotype.Component

@Component
data class GameSettings(
        val gridSquareSize: Double = 40.0,
        val gravityForce: Double = 33 * gridSquareSize,
        val itemChance: Double = 0.16,
        val worldWidth: Double = 40.0,
        val worldHeight: Double = 30.0,
        val speed: Double = 7.8 * gridSquareSize,
        val jumpSpeed: Double = 15 * gridSquareSize
)