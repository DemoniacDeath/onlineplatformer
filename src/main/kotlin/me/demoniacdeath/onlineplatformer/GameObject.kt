package me.demoniacdeath.onlineplatformer

import com.fasterxml.jackson.annotation.JsonIgnore

open class GameObject(open var frame: Rect) {
    open val type = "GameObject"
    val children: MutableList<GameObject> = ArrayList()

    @JsonIgnore
    var parent: GameObject? = null
    var physics: PhysicsState? = null
    var removed: Boolean = false

    open fun handleEnterCollision(collision: Collision) {}
    open fun handleExitCollision(collider: GameObject) {}
    open fun handleCollision(collision: Collision) {}

    fun processPhysics() {
        physics?.change()
        for (child in children) child.processPhysics()
    }

    fun detectCollisions() {
        val allColliders = ArrayList<GameObject>()
        detectCollisions(allColliders)
        val size = allColliders.size
        for (i in 0 until size) {
            for (j in i+1 until size) {
                allColliders[i].physics?.detectCollisions(allColliders[j].physics)
            }
        }
    }

    private fun detectCollisions(allColliders: MutableList<GameObject>) {
        if (physics != null) allColliders.add(this)

        for (child in children) child.detectCollisions(allColliders)
    }

    fun addChild(child: GameObject) {
        children.add(child)
        child.parent = this
    }

    fun clean() {
        for (child in children) child.physics?.clean()
        children.removeAll { it.removed }
    }

    fun globalPosition(): Vector {
        return frame.center + (parent?.globalPosition() ?: Vector())
    }
}
