package me.demoniacdeath.onlineplatformer

import org.springframework.stereotype.Component

@Component
class RandomPlayerGenerationStrategy(
        private val gameSettings: GameSettings
) : PlayerGenerationStrategy {
    override fun generatePlayer(world: GameObject, clientId: ClientId): Player {
        val player = Player(Rect(
                0.0,
                0.0,
                gameSettings.gridSquareSize,
                gameSettings.gridSquareSize * 2
        ), clientId)
        player.speed = gameSettings.speed
        player.jumpSpeed = gameSettings.jumpSpeed
        player.physics?.gravityForce = gameSettings.gravityForce
        player.physics?.gravity = true
        world.addChild(player)
        val count = (world.frame.size.width *
                world.frame.size.height *
                gameSettings.itemChance /
                (gameSettings.gridSquareSize * gameSettings.gridSquareSize)).toInt()
        val powerCount = count / 2
        player.maxPower = powerCount

        return Player(Rect(.0,.0,.0,.0), clientId)
    }
}