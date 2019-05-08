package me.demoniacdeath.onlineplatformer

import org.springframework.stereotype.Component
import java.util.*

@Component
class RandomWorldGenerationStrategy(
        private val gameSettings: GameSettings
) : WorldGenerationStrategy {
    override fun generateWorld(): GameObject {
        val world = GameObject(Rect(
                0.0,
                0.0,
                gameSettings.worldWidth * gameSettings.gridSquareSize,
                gameSettings.worldHeight * gameSettings.gridSquareSize
        ))

        val frame = Room(Rect(
                .0, .0,
                world.frame.size.width,
                world.frame.size.height
        ), gameSettings.gridSquareSize, 22.5 * gameSettings.gridSquareSize, 0.4 / gameSettings.gridSquareSize)
        world.addChild(frame)

        val rnd = Random()
        val count = (world.frame.size.width
                * world.frame.size.height
                * gameSettings.itemChance
                / (gameSettings.gridSquareSize * gameSettings.gridSquareSize)).toInt()
        var powerCount = count / 2
        val x = (world.frame.size.width / gameSettings.gridSquareSize - 2).toInt()
        val y = (world.frame.size.height / gameSettings.gridSquareSize - 2).toInt()
        var rndX: Int
        var rndY: Int
        val takenX = IntArray(count)
        val takenY = IntArray(count)
        for (i in 0 until count) {
            var taken: Boolean
            do {
                taken = false
                rndX = rnd.nextInt(x)
                rndY = rnd.nextInt(y)
                for (j in 0..i) {
                    if (rndX == takenX[j] && rndY == takenY[j]) {
                        taken = true
                        break
                    }
                }
            } while (taken)

            takenX[i] = rndX
            takenY[i] = rndY

            val rect = Rect(
                    world.frame.size.width / 2 - gameSettings.gridSquareSize * 1.5 - rndX * gameSettings.gridSquareSize,
                    world.frame.size.height / 2 - gameSettings.gridSquareSize * 1.5 - rndY * gameSettings.gridSquareSize,
                    gameSettings.gridSquareSize,
                    gameSettings.gridSquareSize)

            if (powerCount > 0) {
                val gameObject = Consumable(
                        rect,
                        0.06 * gameSettings.gridSquareSize,
                        0.06 * gameSettings.gridSquareSize)
                world.addChild(gameObject)
                powerCount--
            } else {
                val gameObject = Solid(rect,
                        22.5 * gameSettings.gridSquareSize,
                        0.4 / gameSettings.gridSquareSize)
                world.addChild(gameObject)
            }
        }

        return world
    }
}