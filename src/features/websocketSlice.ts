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
    },
    disconnected: (state, action: PayloadAction<{ connected: boolean }>) => {
      state.isConnected = action.payload.connected;
    },
    error: (state, action: PayloadAction<{ error: any }>) => {
      state.error = action.payload.error?.message || 'WebSocket error';
      state.isConnected = false;
    },
    reconnect: (state) => {
      state.reconnectAttempts += 1;
    },
    resetWebSocket: () => initialState,
  },
});

export const { connected, disconnected, error, reconnect, resetWebSocket } = websocketSlice.actions;
export default websocketSlice.reducer;