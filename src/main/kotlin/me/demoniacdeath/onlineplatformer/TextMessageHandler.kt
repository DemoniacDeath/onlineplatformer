package me.demoniacdeath.onlineplatformer

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.web.socket.TextMessage
import org.springframework.web.socket.WebSocketSession
import org.springframework.web.socket.handler.TextWebSocketHandler

@Component
class TextMessageHandler : TextWebSocketHandler() {

    companion object {
        private val log: Logger = LoggerFactory.getLogger(TextMessageHandler::class.java)
    }


    override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
        log.info("Received ${message.payload} from ${session.id}")
        session.sendMessage(TextMessage("Hi back at 'ya"))
    }
}