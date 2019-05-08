package me.demoniacdeath.onlineplatformer

interface PlayerGenerationStrategy {
    fun generatePlayer(world: GameObject, clientId: ClientId): Player
}