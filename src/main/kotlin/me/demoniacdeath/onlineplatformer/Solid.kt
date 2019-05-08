package me.demoniacdeath.onlineplatformer

class Solid(
        frame: Rect,
        val damageVelocityThreshold: Double,
        val damageVelocityMultiplier: Double
) : GameObject(frame) {
    override val type = "Solid"
    init {
        physics = PhysicsState(this)
    }

    override fun handleEnterCollision(collision: Collision) {
        val player = collision.collider
        when (player) {
            is Player -> {
                val physics = collision.collider.physics
                if (physics != null && physics.velocity.y > 5) {
                    player.dealDamage(Math.round(physics.velocity.y * 10).toInt())
                }
            }
        }
    }

    override fun handleCollision(collision: Collision) {
        if (Math.abs(collision.collisionVector.x) < Math.abs(collision.collisionVector.y)) {
            collision.collider.frame.center.x += collision.collisionVector.x
            collision.collider.physics?.velocity?.x = 0.0
        } else {
            collision.collider.frame.center.y += collision.collisionVector.y
            collision.collider.physics?.velocity?.y = 0.0
        }
    }
}
