package me.demoniacdeath.onlineplatformer

import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession

class ClientSession(
        val clientId: ClientId,
        val serverSession: ServerSession,
        val webSocketSession: WebSocketSession,
        val startTimestamp: Long,
        val objectMapper: ObjectMapper,
        playerGenerationStrategy: PlayerGenerationStrategy
) {
    val player = playerGenerationStrategy.generatePlayer(serverSession.world, clientId)
    init {
        sendMessage(ReceiveWorldMessage(clientId, serverSession.world))
    }

    companion object {
        private val log: Logger = LoggerFactory.getLogger(ClientSession::class.java)
    }

    fun receiveRawMessage(payload: String) {
        log.info("Received $payload from $clientId")
    }

    fun sendMessage(message: Any) {
        sendRawMessage(objectMapper.writeValueAsString(message))
    }

    fun sendRawMessage(payload: String) {
        webSocketSession.sendMessage(TextMessage(payload))
    }

    fun onRemoval() {
        player.removed = true
        serverSession.world.clean()
    }
}