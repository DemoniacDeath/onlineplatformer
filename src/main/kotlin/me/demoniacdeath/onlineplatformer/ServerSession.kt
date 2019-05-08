package me.demoniacdeath.onlineplatformer

import org.springframework.stereotype.Component
import org.springframework.web.socket.WebSocketSession

@Component
class ServerSession(
        val clientSessionFactory: ClientSessionFactory,
        worldGenerationStrategy: WorldGenerationStrategy
) {
    val world = worldGenerationStrategy.generateWorld()

    private val clientSessions: MutableMap<ClientId, ClientSession> = mutableMapOf()

    fun getClientSession(clientId: ClientId): ClientSession? {
        return clientSessions[clientId]
    }

    fun createClientSession(clientId: ClientId, session: WebSocketSession, currentTimeMillis: Long) {
        clientSessions[clientId] = clientSessionFactory.createClientSession(
                clientId, this, session, currentTimeMillis)
    }

    fun removeClientSession(clientId: ClientId) {
        clientSessions.remove(clientId)?.onRemoval()
    }
}
