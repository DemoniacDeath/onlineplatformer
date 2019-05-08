package me.demoniacdeath.onlineplatformer

class Consumable(
        frame: Rect,
        val consumablePowerSpeedBoost: Double,
        val consumablePowerJumpSpeedBoost: Double
) : GameObject(frame) {
    override val type = "Consumable"
    init {
        physics = PhysicsState(this)
    }
}
