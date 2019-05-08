package me.demoniacdeath.onlineplatformer

data class Vector(var x: Double = 0.0, var y: Double = 0.0) {
    operator fun times(scalar: Double) = Vector(x * scalar, y * scalar)
    operator fun div(scalar: Double) = Vector(x / scalar, y / scalar)
    operator fun plus(v: Vector): Vector = Vector(x + v.x, y + v.y)
    operator fun minus(v: Vector) = Vector(x - v.x, y - v.y)
}