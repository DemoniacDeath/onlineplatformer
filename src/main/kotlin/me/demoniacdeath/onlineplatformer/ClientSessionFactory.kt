package me.demoniacdeath.onlineplatformer

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Component
import org.springframework.web.socket.WebSocketSession

@Component
class ClientSessionFactory(
        val objectMapper: ObjectMapper,
        val playerGenerationStrategy: PlayerGenerationStrategy
) {
    fun createClientSession(clientId: ClientId,
                            serverSession: ServerSession,
                            webSocketSession: WebSocketSession,
                            startTimestamp: Long): ClientSession {
        return ClientSession(
                clientId,
                serverSession,
                webSocketSession,
                startTimestamp,
                objectMapper,
                playerGenerationStrategy)
    }
}