package me.demoniacdeath.onlineplatformer

data class Rect(var center: Vector, var size: Size) {
    constructor(
            x: Double,
            y: Double,
            width: Double,
            height: Double
    ) : this(
            Vector(x, y),
            Size(width, height)
    )
}