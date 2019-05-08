package me.demoniacdeath.onlineplatformer

import com.fasterxml.jackson.annotation.JsonIgnore

class PhysicsState (@JsonIgnore val gameObject: GameObject) {
    var velocity: Vector = Vector()
    var gravity: Boolean = false
    var still: Boolean = true
    var gravityForce: Double = 0.0
    val colliders: MutableSet<GameObject> = HashSet()

    fun change() {
        if (gravity) {
            velocity += Vector(0.0, gravityForce)
        }
        gameObject.frame.center += velocity
    }

    fun clean() {
        colliders.removeAll { it.removed }
    }

    fun detectCollisions(c: PhysicsState?) {
        if (c === null) return
        if (still && c.still) return

        val x1 = gameObject.globalPosition().x - gameObject.frame.size.width / 2
        val x2 = c.gameObject.globalPosition().x - c.gameObject.frame.size.width / 2
        val X1 = x1 + gameObject.frame.size.width
        val X2 = x2 + c.gameObject.frame.size.width
        val y1 = gameObject.globalPosition().y - gameObject.frame.size.height / 2
        val y2 = c.gameObject.globalPosition().y - c.gameObject.frame.size.height / 2
        val Y1 = y1 + gameObject.frame.size.height
        val Y2 = y2 + c.gameObject.frame.size.height

        val diffX1 = X1 - x2
        val diffX2 = x1 - X2
        val diffY1 = Y1 - y2
        val diffY2 = y1 - Y2

        val alreadyCollided = colliders.contains(c.gameObject) || c.colliders.contains(gameObject)
        if (diffX1 > 0 &&
                diffX2 < 0 &&
                diffY1 > 0 &&
                diffY2 < 0) {
            val overlapArea = Vector(
                    if (Math.abs(diffX1) < Math.abs(diffX2)) diffX1 else diffX2,
                    if (Math.abs(diffY1) < Math.abs(diffY2)) diffY1 else diffY2
            )
            if (!alreadyCollided) {
                colliders.add(c.gameObject)
                c.colliders.add(gameObject)

                gameObject.handleEnterCollision(Collision(c.gameObject, overlapArea))
                c.gameObject.handleEnterCollision(Collision(gameObject, overlapArea * -1.0))
            }
            gameObject.handleCollision(Collision(c.gameObject, overlapArea))
            c.gameObject.handleCollision(Collision(gameObject, overlapArea * -1.0))
        } else if (alreadyCollided) {
            colliders.remove(c.gameObject)
            c.colliders.remove(gameObject)
            gameObject.handleExitCollision(c.gameObject)
            c.gameObject.handleExitCollision(gameObject)
        }
    }

}
