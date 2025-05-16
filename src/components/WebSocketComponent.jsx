import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const WebSocketComponent = () => {
  const { messages, sendMessage, isConnected } = useWebSocket('ws://localhost:3001');

  const handleSendMessage = () => {
    sendMessage({
      type: 'example',
      data: 'Test message',
      timestamp: Date.now()
    });
  };

  return (
    <div>
      <p>Estado: {isConnected ? 'Conectado' : 'Desconectado'}</p>
      <button onClick={handleSendMessage} disabled={!isConnected}>
        Enviar Mensaje
      </button>
      <div>
        <h3>Mensajes Recibidos:</h3>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{JSON.stringify(msg)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WebSocketComponent;