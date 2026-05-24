import type { Middleware } from '@reduxjs/toolkit';

export type WebSocketEventTypeValue = 
  // Комнаты
  | 'room_update'
  | 'user_joined'
  | 'user_left'
  | 'room_created'
  | 'room_deleted'
  // Чат
  | 'new_message'
  | 'message_history'
  | 'message_deleted'
  | 'message_updated'
  | 'request_history'
  | 'delete_message'
  | 'update_message'
  // Системные
  | 'connection_established'
  | 'initial_rooms'
  | 'notification'
  | 'connect'
  | 'disconnect'
  | 'connect_error'
  | 'ping'
  | 'pong'
  | 'error';

export const WebSocketEventType: Record<string, WebSocketEventTypeValue> = {
  // Комнаты
  ROOM_UPDATE: 'room_update',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  ROOM_CREATED: 'room_created',
  ROOM_DELETED: 'room_deleted',
  
  // Чат
  NEW_MESSAGE: 'new_message',
  MESSAGE_HISTORY: 'message_history',
  MESSAGE_DELETED: 'message_deleted',
  MESSAGE_UPDATED: 'message_updated',
  REQUEST_HISTORY: 'request_history',
  DELETE_MESSAGE: 'delete_message',
  UPDATE_MESSAGE: 'update_message',
  
  // Системные
  CONNECTION_ESTABLISHED: 'connection_established',
  INITIAL_ROOMS: 'initial_rooms',
  NOTIFICATION: 'notification',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error',
} as const;

type EventHandler = (data: any) => void;
type EventHandlers = Map<WebSocketEventTypeValue, Set<EventHandler>>;

// Конфигурация WebSocket
interface WebSocketConfig {
    url: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
    heartbeatInterval?: number;
}

class WebSocketService {
    private ws: WebSocket | null = null;
    private handlers: EventHandlers = new Map();
    private isConnected: boolean = false;
    private config: WebSocketConfig;
    private reconnectAttempts: number = 0;
    private reconnectTimer: number | null = null;
    private heartbeatTimer: number | null = null;
    private manualClose: boolean = false;

    constructor(config: WebSocketConfig) {
        this.config = {
            reconnectInterval: 3000,
            maxReconnectAttempts: 10,
            heartbeatInterval: 30000,
            ...config,
        };
    }

    connect(): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        this.manualClose = false;

        try {
            console.log('WebSocket try to connected', this.config.url);
            this.ws = new WebSocket(this.config.url);
            this.setupEventListeners();
        } catch (error) {
            console.error('WebSocket creation error:', error);
            this.handleReconnect();
        }
    }

    private setupEventListeners(): void {
        if (!this.ws) return;

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.startHeartbeat();
            this.emitToHandlers(WebSocketEventType.CONNECT, { connected: true });
        };

        this.ws.onclose = (event) => {
            console.log('WebSocket disconnected', event.code, event.reason);
            this.isConnected = false;
            this.stopHeartbeat();
            this.emitToHandlers(WebSocketEventType.DISCONNECT, {
                connected: false,
                code: event.code,
                reason: event.reason
            });

            if (!this.manualClose) {
                this.handleReconnect();
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.emitToHandlers(WebSocketEventType.CONNECT_ERROR, { error });
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event.data);
        };
    }

    private handleMessage(data: string): void {
        console.log("message", data)
        try {
            const message = JSON.parse(data);

            if (message.type && message.payload !== undefined) {
                this.emitToHandlers(message.type as WebSocketEventTypeValue, message.payload);
            } else {
                console.warn('Invalid message format:', message);
            }
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error, data);
        }
    }

    private sendMessage(type: WebSocketEventTypeValue, payload: any): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const message = {
                type,
                payload,
                timestamp: Date.now(),
            };
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn(`WebSocket not connected, cannot send message type: ${type}`);
        }
    }

    emitEvent(type: WebSocketEventTypeValue, payload: any): void {
        this.sendMessage(type, payload);
    }

    subscribe(eventType: WebSocketEventTypeValue, handler: EventHandler): () => void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }

        this.handlers.get(eventType)!.add(handler);

        return () => {
            this.handlers.get(eventType)?.delete(handler);
            if (this.handlers.get(eventType)?.size === 0) {
                this.handlers.delete(eventType);
            }
        };
    }

    private emitToHandlers(eventType: WebSocketEventTypeValue, data: any): void {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in handler for ${eventType}:`, error);
                }
            });
        }
    }

    private handleReconnect(): void {
        if (this.manualClose) return;

        if (this.reconnectAttempts < (this.config.maxReconnectAttempts || 5)) {
            this.reconnectAttempts++;
            console.log(`Reconnecting attempt ${this.reconnectAttempts}...`);

            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
            }

            this.reconnectTimer = window.setTimeout(() => {
                this.connect();
            }, this.config.reconnectInterval);
        } else {
            console.error('Max reconnection attempts reached');
            this.emitToHandlers(WebSocketEventType.CONNECT_ERROR, {
                error: 'Max reconnection attempts reached'
            });
        }
    }

    private startHeartbeat(): void {
        this.stopHeartbeat();

        this.heartbeatTimer = window.setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.sendMessage(WebSocketEventType.NOTIFICATION, { type: 'ping' });
            }
        }, this.config.heartbeatInterval);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    disconnect(): void {
        this.manualClose = true;
        this.stopHeartbeat();

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close();
            }
            this.ws = null;
        }

        this.isConnected = false;
    }

    getConnectionStatus(): boolean {
        return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
    }

    getReadyState(): number {
        return this.ws?.readyState ?? WebSocket.CLOSED;
    }
}

const wsConfig: WebSocketConfig = {
    url: 'ws://localhost:8080/ws',
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
};

export const webSocketService = new WebSocketService(wsConfig);

export const webSocketMiddleware: Middleware = (store) => (next) => (action) => {
    if (action && typeof action === 'object' && 'type' in action) {
        const actionType = (action as { type: string }).type;

        if (typeof actionType === 'string' && actionType.startsWith('ws/')) {
            const wsAction = action as {
                type: string;
                meta?: { webSocketEvent?: WebSocketEventTypeValue };
                payload?: any;
            };

            const eventType = wsAction.meta?.webSocketEvent;
            if (eventType && webSocketService.getConnectionStatus()) {
                webSocketService.emitEvent(eventType, wsAction.payload);
            }
        }
    }

    return next(action);
};
export default webSocketService;