import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface WebSocketState {
  isConnected: boolean;
  error: string | null;
  reconnectAttempts: number;
}

const initialState: WebSocketState = {
  isConnected: false,
  error: null,
  reconnectAttempts: 0,
};

const websocketSlice = createSlice({
  name: 'websocket',
  initialState,
  reducers: {
    connected: (state, action: PayloadAction<{ connected: boolean }>) => {
      state.isConnected = action.payload.connected;
      state.error = null;
      state.reconnectAttempts = 0;
    },

    disconnected: (state, action: PayloadAction<{ connected: boolean; code?: number; reason?: string }>) => {
      state.isConnected = action.payload.connected;
    },

    websocketError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isConnected = false;
    },

    reconnecting: (state, action: PayloadAction<{ attempt: number }>) => {
      state.reconnectAttempts = action.payload.attempt;
    },


    resetWebSocket: () => initialState,
  },
});

export const {
  connected,
  disconnected,
  websocketError,
  reconnecting,
  resetWebSocket
} = websocketSlice.actions;

export default websocketSlice.reducer;

export const selectIsConnected = (state: { websocket: WebSocketState }) => state.websocket.isConnected;
export const selectWebSocketError = (state: { websocket: WebSocketState }) => state.websocket.error;
export const selectReconnectAttempts = (state: { websocket: WebSocketState }) => state.websocket.reconnectAttempts;