package com.rubricas.evaluation_service.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // Habilita nuestro servidor de WebSockets
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Este es el "número de teléfono" al que los clientes se conectarán
        // para iniciar la comunicación WebSocket.
        registry.addEndpoint("/ws").setAllowedOrigins("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Estas son como las "extensiones" o "canales" de la llamada.
        // Los clientes se suscribirán a canales que empiecen con "/topic".
        registry.enableSimpleBroker("/topic");
        // Los mensajes enviados desde el cliente al servidor irán a destinos que empiecen con "/app".
        registry.setApplicationDestinationPrefixes("/app");
    }
}
