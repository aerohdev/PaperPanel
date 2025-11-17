import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket(url) {
  const ws = useRef(null);
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const reconnectTimeout = useRef(null);
  const shouldConnect = useRef(true);

  const connect = useCallback(() => {
    if (!shouldConnect.current) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token available for WebSocket connection');
        return;
      }

      const wsUrl = `${url}?token=${token}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);

        // Attempt to reconnect after 3 seconds
        if (shouldConnect.current) {
          reconnectTimeout.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages((prev) => [...prev, data]);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, [url]);

  useEffect(() => {
    shouldConnect.current = true;
    connect();

    return () => {
      shouldConnect.current = false;
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      ws.current.send(data);
    } else {
      console.error('WebSocket is not connected');
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, connected, send, clearMessages };
}
