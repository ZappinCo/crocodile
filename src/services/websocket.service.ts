// src/services/websocket.service.ts
import { EventEmitter } from './event-emitter.service';

export type WebSocketEventType = 
  | 'connect'
  | 'disconnect'
  | 'error'
  | 'message'
  | 'reconnecting'
  // Комнаты
  | 'room_update'
  | 'user_joined'
  | 'user_left'
  | 'room_created'
  | 'room_deleted'
  | 'game_started'
  | 'game_ended'
  | 'word_changed'
  // Чат
  | 'new_message'
  | 'message_history'
  | 'message_deleted'
  | 'message_updated'
  | 'typing'
  // Другие
  | 'ping'
  | 'pong'
  | 'notification';

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

interface WebSocketMessage {
  type: WebSocketEventType;
  payload: any;
  timestamp: number;
}

interface PendingMessage {
  type: WebSocketEventType;
  payload: any;
}

class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private manualClose: boolean = false;
  private isConnected: boolean = false;
  private pendingMessages: PendingMessage[] = [];
  private config: WebSocketConfig;

  constructor(config: WebSocketConfig) {
    super();
    this.config = config;
    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    this.setMaxListeners(20);
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connecting');
      return;
    }

    this.manualClose = false;
    console.log('Connecting to WebSocket:', this.config.url);

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventListeners();
    } catch (error) {
      console.error('WebSocket creation error:', error);
      this.handleReconnect();
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = this.handleOpen.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = this.handleError.bind(this);
    this.ws.onmessage = this.handleMessage.bind(this);
  }

  private handleOpen(): void {
    console.log('WebSocket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.emit('connect', { connected: true });
    this.flushPendingMessages();
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected', event.code, event.reason);
    this.isConnected = false;
    this.stopHeartbeat();
    this.emit('disconnect', {
      connected: false,
      code: event.code,
      reason: event.reason
    });

    if (!this.manualClose) {
      this.handleReconnect();
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.emit('error', { error: new Error('WebSocket connection error') });
  }

  private handleMessage(event: MessageEvent): void {
    console.log('📨 Received message:',event.data)
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      console.log('📨 Received message:', message.type, message.payload);
      
      this.emit('message', message);
      this.emit(message.type, message.payload);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error, event.data);
      this.emit('error', { error: new Error('Failed to parse message') });
    }
  }

  send(type: WebSocketEventType, payload: any): void {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };

    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log('📤 Sent message:', type, payload);
    } else {
      console.warn(`WebSocket not connected, queueing message: ${type}`);
      this.pendingMessages.push({ type, payload });
      
      if (!this.isConnected && !this.manualClose && this.ws?.readyState !== WebSocket.CONNECTING) {
        this.connect();
      }
    }
  }

  private flushPendingMessages(): void {
    const messagesToSend = [...this.pendingMessages];
    this.pendingMessages = [];
    
    for (const msg of messagesToSend) {
      this.send(msg.type, msg.payload);
    }
  }

  emitEvent(type: WebSocketEventType, payload: any): void {
    this.send(type, payload);
  }

  private handleReconnect(): void {
    if (this.manualClose) return;

    const maxAttempts = this.config.maxReconnectAttempts || 5;
    if (this.reconnectAttempts >= maxAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('error', { error: new Error('Max reconnection attempts reached') });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      (this.config.reconnectInterval || 3000) * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );
    
    console.log(`Reconnecting attempt ${this.reconnectAttempts}/${maxAttempts} in ${delay}ms...`);
    this.emit('reconnecting', { attempt: this.reconnectAttempts, maxAttempts, delay });

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    const interval = this.config.heartbeatInterval || 30000;
    let lastPong = Date.now();
    let missedPongs = 0;

    const checkHeartbeat = (): void => {
      if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const now = Date.now();
      if (now - lastPong > interval * 2) {
        missedPongs++;
        console.warn(`Heartbeat missed ${missedPongs} time(s)`);
        
        if (missedPongs >= 3) {
          console.error('No heartbeat response, reconnecting...');
          this.ws?.close();
          return;
        }
      } else {
        missedPongs = 0;
      }

      this.send('ping', { timestamp: now });
    };

    const handlePong = (data: { timestamp: number }): void => {
      lastPong = Date.now();
      this.emit('pong', data);
    };

    // this.on('pong', handlePong);
    this.heartbeatTimer = window.setInterval(checkHeartbeat, interval);
    
    // (this.heartbeatTimer as any).pongHandler = handlePong;
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      if ((this.heartbeatTimer as any).pongHandler) {
        this.off('pong', (this.heartbeatTimer as any).pongHandler);
      }
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  disconnect(): void {
    console.log('Manually disconnecting WebSocket');
    this.manualClose = true;
    this.stopHeartbeat();
    this.pendingMessages = [];

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Manual disconnect');
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

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }
}

// Конфигурация WebSocket
const wsConfig: WebSocketConfig = {
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
};

export const webSocketService = new WebSocketService(wsConfig);

if (import.meta.env.DEV) {
  (window as any).webSocketService = webSocketService;
}

export default webSocketService;