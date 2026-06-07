import { EventEmitter } from './event-emitter.service';

export type WebSocketEventType =
  | 'connect'
  | 'disconnect'
  | 'error'
  | 'message'
  | 'reconnecting'
  | 'delete_room'
  | 'create_room'
  | 'update_room'
  | 'get_rooms'
  | 'room_update'
  | 'edit_room'
  | 'user_joined'
  | 'user_left'
  | 'add_stroke'
  | 'set_strokes'
  | 'request_history'
  | 'new_message'

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export interface WebSocketMessage {
  type: WebSocketEventType;
  payload: any;
  timestamp: number;
}

export interface PendingMessage {
  type: WebSocketEventType;
  payload: any;
}

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;

  private manualClose: boolean = false;
  private isConnected: boolean = false;
  private pendingMessages: PendingMessage[] = [];
  private config: WebSocketConfig;

  constructor(config: WebSocketConfig) {
    super();
    this.config = config;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.manualClose = false;

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventListeners();
    } catch (error) {
      console.log(error);
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
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.emit('connect', { connected: true });
    this.flushPendingMessages();
  }

  private handleClose(event: CloseEvent): void {
    this.isConnected = false;
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
    console.log(error);
    this.emit('error', { error: new Error('WebSocket connection error') });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;

      this.emit('message', message);
      this.emit(message.type, message.payload);
    } catch (error) {
      console.log(error)
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
    } else {
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
      this.emit('error', { error: new Error('Max reconnection attempts reached') });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      (this.config.reconnectInterval || 3000) * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );

    this.emit('reconnecting', { attempt: this.reconnectAttempts, maxAttempts, delay });

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  }


  disconnect(): void {
    this.manualClose = true;
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

const wsConfig: WebSocketConfig = {
  url: import.meta.env.VITE_WS_URL,
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
};

export const webSocketService = new WebSocketService(wsConfig);

if (import.meta.env.DEV) {
  (window as any).webSocketService = webSocketService;
}

export default webSocketService;