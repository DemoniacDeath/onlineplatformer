package me.demoniacdeath.onlineplatformer

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonIgnoreProperties

@JsonIgnoreProperties("children")
class Room(rect: Rect,
           val width: Double,
           @Suppress("CanBeParameter") val damageVelocityThreshold: Double,
           @Suppress("CanBeParameter") val damageVelocityMultiplier: Double
) : GameObject(rect) {
    override val type = "Room"
    @JsonIgnore
    val floor: Solid = Solid(Rect(
            .0,
            frame.size.height / 2 - width / 2,
            frame.size.width,
            width
    ), damageVelocityThreshold, damageVelocityMultiplier)
    @JsonIgnore
    val wallLeft: Solid = Solid(Rect(
            -frame.size.width / 2 + width / 2,
            .0,
            width,
            frame.size.height - width * 2
    ), damageVelocityThreshold, damageVelocityMultiplier)
    @JsonIgnore
    val wallRight: Solid = Solid(Rect(
            frame.size.width / 2 - width / 2,
            .0,
            width,
            frame.size.height - width * 2
    ), damageVelocityThreshold, damageVelocityMultiplier)
    @JsonIgnore
    val ceiling: Solid = Solid(Rect(
            .0,
            -frame.size.height / 2 + width / 2,
            frame.size.width,
            width
    ), damageVelocityThreshold, damageVelocityMultiplier)

    init {
        addChild(floor)
        addChild(wallLeft)
        addChild(wallRight)
        addChild(ceiling)
    }
}
