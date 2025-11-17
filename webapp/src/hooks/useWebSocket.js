import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket(url, options = {}) {
  const {
    reconnectInterval = 5000,      // Start with 5 seconds
    maxReconnectInterval = 30000,  // Max 30 seconds
    reconnectDecay = 1.5,          // Exponential backoff
    maxReconnectAttempts = Infinity, // Unlimited retries
    onOpen = null,
    onClose = null,
    onError = null,
    onMessage = null,
  } = options;

  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const shouldReconnect = useRef(true);
  const messageQueue = useRef([]);

  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Calculate reconnect delay with exponential backoff
  const getReconnectDelay = useCallback(() => {
    const delay = reconnectInterval * Math.pow(reconnectDecay, reconnectAttempts.current);
    return Math.min(delay, maxReconnectInterval);
  }, [reconnectInterval, maxReconnectInterval, reconnectDecay]);

  // Send queued messages after reconnect
  const processMessageQueue = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN && messageQueue.current.length > 0) {
      console.log(`Processing ${messageQueue.current.length} queued messages`);
      messageQueue.current.forEach(msg => {
        ws.current.send(msg);
      });
      messageQueue.current = [];
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!shouldReconnect.current) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found, cannot connect to WebSocket');
      setConnectionError('Authentication required');
      return;
    }

    try {
      console.log(`Connecting to WebSocket: ${url}`);
      const wsUrl = url.startsWith('ws') ? url : `ws://${window.location.hostname}:8080${url}`;
      ws.current = new WebSocket(`${wsUrl}?token=${token}`);

      ws.current.onopen = () => {
        console.log('✓ WebSocket connected');
        setConnected(true);
        setReconnecting(false);
        setConnectionError(null);
        reconnectAttempts.current = 0;

        // Process any queued messages
        processMessageQueue();

        // Call custom onOpen handler
        if (onOpen) onOpen();
      };

      ws.current.onclose = (event) => {
        console.log(`WebSocket disconnected (code: ${event.code})`);
        setConnected(false);

        // Call custom onClose handler
        if (onClose) onClose(event);

        // Attempt reconnection if allowed
        if (shouldReconnect.current && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = getReconnectDelay();
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);

          setReconnecting(true);
          reconnectAttempts.current += 1;

          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          setConnectionError('Connection failed after multiple attempts');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');

        // Call custom onError handler
        if (onError) onError(error);

        // Close will trigger reconnect
        ws.current?.close();
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages(prev => [...prev, data]);

          // Call custom onMessage handler
          if (onMessage) onMessage(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionError(error.message);

      // Retry connection
      if (shouldReconnect.current) {
        const delay = getReconnectDelay();
        setReconnecting(true);
        reconnectAttempts.current += 1;
        reconnectTimeout.current = setTimeout(connect, delay);
      }
    }
  }, [url, maxReconnectAttempts, getReconnectDelay, processMessageQueue, onOpen, onClose, onError, onMessage]);

  // Initialize connection
  useEffect(() => {
    shouldReconnect.current = true;
    connect();

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up WebSocket connection');
      shouldReconnect.current = false;

      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }

      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  // Send message (with queuing during disconnect)
  const send = useCallback((message) => {
    const data = typeof message === 'string' ? message : JSON.stringify(message);

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(data);
    } else {
      console.warn('WebSocket not connected, queuing message');
      messageQueue.current.push(data);
    }
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    console.log('Manual reconnect triggered');
    reconnectAttempts.current = 0;

    if (ws.current) {
      ws.current.close();
    }

    connect();
  }, [connect]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    connected,
    reconnecting,
    connectionError,
    send,
    reconnect,
    clearMessages,
  };
}
