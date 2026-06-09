import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Server } from 'mock-socket';
import { WebSocketService } from './websocket.service';

describe('WebSocketService (integration)', () => {
  const TEST_URL = 'ws://localhost:12345';

  describe('message exchange', () => {
    let service: WebSocketService;
    let mockWsInstance: any;
    let originalWebSocket: typeof WebSocket;

    class MockWebSocket {
      static readonly CONNECTING = 0;
      static readonly OPEN = 1;
      static readonly CLOSING = 2;
      static readonly CLOSED = 3;
      readyState = MockWebSocket.CONNECTING;
      onopen: ((event: any) => void) | null = null;
      onclose: ((event: any) => void) | null = null;
      onerror: ((event: any) => void) | null = null;
      onmessage: ((event: any) => void) | null = null;
      url: string;
      sentMessages: string[] = [];

      constructor(url: string) {
        this.url = url;
        mockWsInstance = this;
        setTimeout(() => {
          if (this.readyState === MockWebSocket.CONNECTING) {
            this.readyState = MockWebSocket.OPEN;
            this.onopen?.({ type: 'open' } as any);
          }
        }, 0);
      }

      send(data: string) {
        this.sentMessages.push(data);
      }

      close() {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.({ code: 1000, reason: 'Manual close' } as any);
      }
    }

    beforeEach(async () => {
      originalWebSocket = global.WebSocket;
      global.WebSocket = MockWebSocket as any;
      service = new WebSocketService({
        url: TEST_URL,
        reconnectInterval: 1000,
        maxReconnectAttempts: 3,
      });

      const connectedPromise = new Promise<void>((resolve) => {
        service.on('connect', () => resolve());
      });
      service.connect();
      await connectedPromise;
    });

    afterEach(() => {
      global.WebSocket = originalWebSocket;
      service.disconnect();
    });

    it('should send message when connected', () => {
      const testPayload = { foo: 'bar' };
      service.emitEvent('new_message', testPayload);

      expect(mockWsInstance.sentMessages.length).toBe(1);
      const sent = JSON.parse(mockWsInstance.sentMessages[0]);
      expect(sent.type).toBe('new_message');
      expect(sent.payload).toEqual(testPayload);
    });

    it('should buffer messages when disconnected and flush after reconnect', async () => {
      service.disconnect();
      const testPayload = { text: 'buffered' };
      service.emitEvent('test_event', testPayload);
      expect((service as any).pendingMessages).toHaveLength(1);

      const connectedPromise = new Promise<void>((resolve) => {
        service.on('connect', () => resolve());
      });
      service.connect();
      await connectedPromise;

      expect(mockWsInstance.sentMessages.length).toBe(1);
      const sent = JSON.parse(mockWsInstance.sentMessages[0]);
      expect(sent.type).toBe('test_event');
      expect(sent.payload).toEqual(testPayload);
      expect((service as any).pendingMessages).toHaveLength(0);
    });

    it('should emit message events with parsed payload', async () => {
      const messageHandler = vi.fn();
      const typedHandler = vi.fn();
      service.on('message', messageHandler);
      service.on('room_update', typedHandler);

      const testMessage = {
        type: 'room_update',
        payload: { id: 'room1', name: 'Updated' },
        timestamp: Date.now(),
      };
      mockWsInstance.onmessage?.({ data: JSON.stringify(testMessage) } as any);

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(messageHandler).toHaveBeenCalledWith(testMessage);
      expect(typedHandler).toHaveBeenCalledWith(testMessage.payload);
    });

    it('should emit error on invalid JSON', async () => {
      const errorHandler = vi.fn();
      service.on('error', errorHandler);

      mockWsInstance.onmessage?.({ data: '{invalid json}' } as any);

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ message: 'Failed to parse message' })
        })
      );
    });
  });

  describe('connection lifecycle & reconnection', () => {
    let service: WebSocketService;
    let mockServer: Server;

    beforeEach(async () => {
      mockServer = new Server(TEST_URL);
      service = new WebSocketService({
        url: TEST_URL,
        reconnectInterval: 500,
        maxReconnectAttempts: 3,
      });
    });

    afterEach(() => {
      mockServer.stop();
      service.disconnect();
    });

    it('should connect and emit connect event', async () => {
      const connectHandler = vi.fn();
      service.on('connect', connectHandler);

      service.connect();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(service.getConnectionStatus()).toBe(true);
      expect(connectHandler).toHaveBeenCalledWith({ connected: true });
    });

    it('should emit disconnect event when server closes connection', async () => {
      const disconnectHandler = vi.fn();
      service.on('disconnect', disconnectHandler);

      service.connect();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(service.getConnectionStatus()).toBe(true);

      mockServer.close();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(service.getConnectionStatus()).toBe(false);
      expect(disconnectHandler).toHaveBeenCalledWith(
        expect.objectContaining({ connected: false })
      );
    });

    it('should attempt to reconnect when connection drops unexpectedly', async () => {
      const reconnectingHandler = vi.fn();
      const connectHandler = vi.fn();
      service.on('reconnecting', reconnectingHandler);
      service.on('connect', connectHandler);

      service.connect();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(service.getConnectionStatus()).toBe(true);
      expect(connectHandler).toHaveBeenCalledTimes(1);

      mockServer.close();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(service.getConnectionStatus()).toBe(false);
      expect(reconnectingHandler).toHaveBeenCalled();

      mockServer = new Server(TEST_URL);
      const reconnectedPromise = new Promise<void>((resolve) => {
        mockServer.on('connection', () => resolve());
      });
      await reconnectedPromise;
      await new Promise(resolve => setTimeout(resolve, 1000));
      expect(service.getConnectionStatus()).toBe(true);
      expect(connectHandler).toHaveBeenCalledTimes(2);
    }, 10000);

    it('should stop reconnecting after max attempts', async () => {
      const errorHandler = vi.fn();
      service.on('error', errorHandler);

      mockServer.stop();
      service.connect();
      await new Promise(resolve => setTimeout(resolve, 5000));
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({ message: 'Max reconnection attempts reached' })
        })
      );
      expect(service.getReconnectAttempts()).toBe(3);
    }, 10000);

    it('should not reconnect after manual disconnect', async () => {
      const connectHandler = vi.fn();
      service.on('connect', connectHandler);

      service.connect();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(service.getConnectionStatus()).toBe(true);

      service.disconnect();
      expect(service.getConnectionStatus()).toBe(false);
      expect(connectHandler).toHaveBeenCalledTimes(1);

      await new Promise(resolve => setTimeout(resolve, 2000));
      expect(connectHandler).toHaveBeenCalledTimes(1);
    });

    it('should return correct readyState', async () => {
      expect(service.getReadyState()).toBe(WebSocket.CLOSED);
      service.connect();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(service.getReadyState()).toBe(WebSocket.OPEN);
    });

    it('should reset reconnect attempts', async () => {
      mockServer.stop();
      service.connect();
      await new Promise(resolve => setTimeout(resolve, 2000));
      expect(service.getReconnectAttempts()).toBeGreaterThan(0);
      service.resetReconnectAttempts();
      expect(service.getReconnectAttempts()).toBe(0);
    });
  });
});