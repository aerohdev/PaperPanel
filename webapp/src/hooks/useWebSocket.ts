import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  message?: string;
  timestamp?: number;
  [key: string]: any;
}

interface UseWebSocketOptions {
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  reconnectDecay?: number;
  maxReconnectAttempts?: number;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

interface UseWebSocketReturn {
  messages: WebSocketMessage[];
  send: (data: any) => void;
  connected: boolean;
  reconnecting: boolean;
  connectionError: string | null;
  reconnect: () => void;
  disconnect: () => void;
  clearMessages: () => void;
}

export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    reconnectInterval = 5000,
    maxReconnectInterval = 30000,
    reconnectDecay = 1.5,
    maxReconnectAttempts = Infinity,
    onOpen = null,
    onClose = null,
    onError = null,
    onMessage = null,
  } = options;

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const shouldReconnect = useRef(true);
  const messageQueue = useRef<string[]>([]);

  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const getReconnectDelay = useCallback(() => {
    const delay = reconnectInterval * Math.pow(reconnectDecay, reconnectAttempts.current);
    return Math.min(delay, maxReconnectInterval);
  }, [reconnectInterval, maxReconnectInterval, reconnectDecay]);

  const processMessageQueue = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN && messageQueue.current.length > 0) {
      console.log(`Processing ${messageQueue.current.length} queued messages`);
      messageQueue.current.forEach(msg => {
        ws.current!.send(msg);
      });
      messageQueue.current = [];
    }
  }, []);

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
        processMessageQueue();
        if (onOpen) onOpen();
      };

      ws.current.onclose = (event) => {
        console.log(`WebSocket disconnected (code: ${event.code})`);
        setConnected(false);
        if (onClose) onClose(event);

        if (
          shouldReconnect.current &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          const delay = getReconnectDelay();
          console.log(`Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts.current + 1})`);
          setReconnecting(true);

          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          setConnectionError('Max reconnection attempts reached');
          setReconnecting(false);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('WebSocket connection error');
        if (onError) onError(error);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages(prev => [...prev, data]);
          if (onMessage) onMessage(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      setConnectionError('Failed to connect to WebSocket');
      setReconnecting(false);
    }
  }, [url, getReconnectDelay, maxReconnectAttempts, processMessageQueue, onOpen, onClose, onError, onMessage]);

  const send = useCallback((data: any) => {
    const message = typeof data === 'string' ? data : JSON.stringify(data);

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    } else {
      console.warn('WebSocket not connected, queuing message');
      messageQueue.current.push(message);
    }
  }, []);

  const disconnect = useCallback(() => {
    shouldReconnect.current = false;
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setConnected(false);
    setReconnecting(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnect.current = true;
    reconnectAttempts.current = 0;
    messageQueue.current = [];
    connect();
  }, [disconnect, connect]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      shouldReconnect.current = false;
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return {
    messages,
    send,
    connected,
    reconnecting,
    connectionError,
    reconnect,
    disconnect,
    clearMessages,
  };
}
