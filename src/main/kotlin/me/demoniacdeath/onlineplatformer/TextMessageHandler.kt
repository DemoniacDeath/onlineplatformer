package me.demoniacdeath.onlineplatformer

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.stereotype.Component
import org.springframework.web.socket.CloseStatus
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler

@Component
class TextMessageHandler(
        val serverSession: ServerSession
) : TextWebSocketHandler() {
    override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        val clientId = ClientId(session.id)
        val clientSession = serverSession.getClientSession(clientId)
        if (clientSession === null) {
            throw RuntimeException("Received text message from unknown session")
        }
        clientSession.receiveRawMessage(message.payload)
    }

    override fun afterConnectionEstablished(session: WebSocketSession) {
        val clientId = ClientId(session.id)
        serverSession.createClientSession(clientId, session, System.currentTimeMillis())
    }

    override fun afterConnectionClosed(session: WebSocketSession, status: CloseStatus) {
        val clientId = ClientId(session.id)
        serverSession.removeClientSession(clientId)
    }
}