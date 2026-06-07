import { describe, it, expect } from 'vitest';
import websocketReducer, {
  connected,
  disconnected,
  websocketError,
  reconnecting,
  resetWebSocket,
  selectIsConnected,
  selectWebSocketError,
  selectReconnectAttempts,
} from './websocket.slice';

describe('websocket slice', () => {
  const initialState = {
    isConnected: false,
    error: null,
    reconnectAttempts: 0,
  };

  describe('reducers', () => {
    it('should handle connected', () => {
      const nextState = websocketReducer(initialState, connected({ connected: true }));
      expect(nextState.isConnected).toBe(true);
      expect(nextState.error).toBe(null);
      expect(nextState.reconnectAttempts).toBe(0);
    });

    it('should handle disconnected', () => {
      const stateWithConnection = {
        isConnected: true,
        error: null,
        reconnectAttempts: 0,
      };
      const nextState = websocketReducer(stateWithConnection, disconnected({ connected: false, code: 1000, reason: 'normal' }));
      expect(nextState.isConnected).toBe(false);
      expect(nextState.error).toBe(null);
      expect(nextState.reconnectAttempts).toBe(0);
    });

    it('should handle websocketError', () => {
      const errorMessage = 'Connection failed';
      const nextState = websocketReducer(initialState, websocketError(errorMessage));
      expect(nextState.error).toBe(errorMessage);
      expect(nextState.isConnected).toBe(false);
      expect(nextState.reconnectAttempts).toBe(0);
    });

    it('should handle reconnecting', () => {
      const nextState = websocketReducer(initialState, reconnecting({ attempt: 3 }));
      expect(nextState.reconnectAttempts).toBe(3);
      expect(nextState.isConnected).toBe(false);
      expect(nextState.error).toBe(null);
    });

    it('should handle resetWebSocket', () => {
      const modifiedState = {
        isConnected: true,
        error: 'Some error',
        reconnectAttempts: 5,
      };
      const nextState = websocketReducer(modifiedState, resetWebSocket());
      expect(nextState).toEqual(initialState);
    });
  });

  describe('selectors', () => {
    const mockState = {
      websocket: {
        isConnected: true,
        error: 'Test error',
        reconnectAttempts: 2,
      },
    };

    it('selectIsConnected returns isConnected', () => {
      expect(selectIsConnected(mockState)).toBe(true);
    });

    it('selectWebSocketError returns error', () => {
      expect(selectWebSocketError(mockState)).toBe('Test error');
    });

    it('selectReconnectAttempts returns reconnectAttempts', () => {
      expect(selectReconnectAttempts(mockState)).toBe(2);
    });
  });
});