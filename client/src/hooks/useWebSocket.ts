import { useEffect, useRef, useState } from "react";

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messageListeners = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      console.log("WebSocket connected");
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      console.log("WebSocket disconnected");
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        const listeners = messageListeners.current.get(message.type);
        if (listeners) {
          listeners.forEach((listener) => listener(message));
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const subscribe = (messageType: string, callback: (data: any) => void) => {
    if (!messageListeners.current.has(messageType)) {
      messageListeners.current.set(messageType, new Set());
    }
    messageListeners.current.get(messageType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = messageListeners.current.get(messageType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          messageListeners.current.delete(messageType);
        }
      }
    };
  };

  const send = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { isConnected, subscribe, send };
}
