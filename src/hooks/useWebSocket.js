import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket(url) {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const messageQueue = useRef([]);
  const isProcessing = useRef(false);

  const processQueue = useCallback(() => {
    if (messageQueue.current.length === 0) {
      isProcessing.current = false;
      return;
    }

    isProcessing.current = true;
    const message = messageQueue.current.shift();

    // Usar requestIdleCallback para procesamiento no crítico
    requestIdleCallback(() => {
      setMessages(prev => [...prev, message]);
      processQueue();
    });
  }, []);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        messageQueue.current.push(data);
        
        if (!isProcessing.current) {
          processQueue();
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    return () => {
      ws.close();
    };
  }, [url, processQueue]);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return { messages, sendMessage, isConnected };
}