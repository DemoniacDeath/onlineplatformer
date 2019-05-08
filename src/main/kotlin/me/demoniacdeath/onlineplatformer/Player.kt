package me.demoniacdeath.onlineplatformer

class Player(frame: Rect, val clientId: ClientId): GameObject(frame) {
    override val type = "Player"
    var speed: Double = 0.0
    var jumpSpeed: Double = 0.0
    var power: Int = 0
    var maxPower: Int = 0
    var jumped: Boolean = false
    var health: Int = 100
    var dead: Boolean = false
    var won: Boolean = false
    var crouched: Boolean = false
        set(value) {
            if (value && !field) {
                field = true
                frame.center.y += originalSize.height / 4
                frame.size.height = originalSize.height / 2
            } else if (!value && field) {
                field = false
                frame.center.y -= originalSize.height / 4
                frame.size.height = originalSize.height
            }
        }
    private val originalSize: Size

    init {
        physics = PhysicsState(this)
        physics?.gravity = true
        physics?.still = false
        originalSize = frame.size.copy()
    }

    fun handlePlayerEvents(events: EventBuffer<PlayerEvent>) {
        if (!dead) {
            var sitDown = false
            val moveVector = Vector()
            if (events.contains()) {
                moveVector.x -= speed
            }
            if (events.contains()) {
                moveVector.x += speed
            }
            if (events.contains()) {
                if (physics?.gravity != true) {
                    moveVector.y -= speed
                } else if (!jumped) {
                    physics?.velocity?.y = ((physics?.velocity?.y ?: 0.0) - jumpSpeed)
                    jumped = true
                }
            }
            if (events.contains()) {
                if (physics?.gravity != true) {
                    moveVector.y += speed
                } else {
                    sitDown = true
                }
            }
            crouched = sitDown

            frame.center += moveVector
        }
    }

    override fun handleEnterCollision(collision: Collision) {
        val consumable = collision.collider
        if (consumable is Consumable) {
            power += 1
            consumable.removed = true
            speed += 0.01
            jumpSpeed += 0.01
            if (power >= maxPower) {
                win()
            }
        }
    }

    override fun handleExitCollision(collider: GameObject) {
        if (physics?.colliders?.count() == 0) {
            jumped = true
        }
    }

    override fun handleCollision(collision: Collision) {
        if (Math.abs(collision.collisionVector.x) > Math.abs(collision.collisionVector.y)) {
            if (collision.collisionVector.y > 0 && jumped && physics?.gravity == true) {
                jumped = false
            }
        }
    }

    fun dealDamage(damage: Int) {
        if (!won) {
            health -= damage
            if (health < 0) {
                die()
            }
        }
    }

    private fun die() {
        dead = true
    }

    private fun win() {
        won = true
    }


}
