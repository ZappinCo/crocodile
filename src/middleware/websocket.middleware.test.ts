import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { websocketMiddleware } from './websocket.middleware';
import { webSocketService } from '../services/websocket.service';
import {
  connected,
  disconnected,
  websocketError,
  reconnecting,
} from '../store/slices/websocket.slice';
import { setRooms, updateRoom } from '../store/slices/rooms.slice';
import { addMessage, setMessagesHistory, setLoading } from '../store/slices/chat.slice';
import { addStroke, setStrokes } from '../store/slices/drawing.slice';

vi.mock('../services/websocket.service', () => ({
  webSocketService: {
    on: vi.fn(),
    emitEvent: vi.fn(),
    getConnectionStatus: vi.fn(() => true),
  },
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      websocket: (state = { isConnected: false, error: null, reconnectAttempts: 0 }) => state,
      rooms: (state = { rooms: [], selectedRoomId: null, isLoading: false, error: null }) => state,
      chat: (state = { messages: [], isLoading: false, error: null, activeRoomId: null }) => state,
      drawing: (state = { strokes: [] }) => state,
      user: (state = { id: 'user1', username: 'TestUser' }) => state,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(websocketMiddleware),
  });
};

describe('websocketMiddleware', () => {
  let store: ReturnType<typeof createTestStore>;
  let dispatchSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore();
    dispatchSpy = vi.spyOn(store, 'dispatch');
  });

  describe('action forwarding to WebSocket', () => {
    it('sends "new_message" on chat/sendMessage action', () => {
      const action = { type: 'chat/sendMessage', payload: { text: 'Hello' } };
      store.dispatch(action);
      expect(webSocketService.emitEvent).toHaveBeenCalledWith('new_message', action.payload);
    });

    it('sends "request_history" on chat/requestHistory action', () => {
      const action = { type: 'chat/requestHistory', payload: { roomId: 'room1' } };
      store.dispatch(action);
      expect(webSocketService.emitEvent).toHaveBeenCalledWith('request_history', action.payload);
    });

    it('sends "user_joined" on rooms/userJoined action', () => {
      const action = { type: 'rooms/userJoined', payload: { room_id: 'room1', user_id: 'user1' } };
      store.dispatch(action);
      expect(webSocketService.emitEvent).toHaveBeenCalledWith('user_joined', action.payload);
    });

    it('sends "user_left" on rooms/userLeft action', () => {
      const action = { type: 'rooms/userLeft', payload: { room_id: 'room1', user_id: 'user1' } };
      store.dispatch(action);
      expect(webSocketService.emitEvent).toHaveBeenCalledWith('user_left', action.payload);
    });

    it('sends "create_room" on rooms/createRoom action', () => {
      const action = { type: 'rooms/createRoom', payload: { name: 'New Room' } };
      store.dispatch(action);
      expect(webSocketService.emitEvent).toHaveBeenCalledWith('create_room', action.payload);
    });

    it('sends "edit_room" on rooms/editRoom action', () => {
      const action = { type: 'rooms/editRoom', payload: { room_id: 'room1', name: 'Edited' } };
      store.dispatch(action);
      expect(webSocketService.emitEvent).toHaveBeenCalledWith('edit_room', action.payload);
    });

    it('sends "delete_room" on rooms/deleteRoom action', () => {
      const action = { type: 'rooms/deleteRoom', payload: 'room1' };
      store.dispatch(action);
      expect(webSocketService.emitEvent).toHaveBeenCalledWith('delete_room', action.payload);
    });

    it('sends "add_stroke" with modified payload on drawing/addStroke', () => {
      const originalPayload = { points: [{ x: 10, y: 20 }] };
      const action = { type: 'drawing/addStroke', payload: originalPayload };
      store.dispatch(action);
      expect(webSocketService.emitEvent).toHaveBeenCalledWith(
        'add_stroke',
        expect.objectContaining({
          ...originalPayload,
          userId: 'user1',
          roomId: null,
        })
      );
    });

    it('sends "add_stroke" on drawing/sendStroke action', () => {
      const action = { type: 'drawing/sendStroke', payload: { points: [] } };
      store.dispatch(action);
      expect(webSocketService.emitEvent).toHaveBeenCalledWith('add_stroke', expect.any(Object));
    });

    it('sends "set_strokes" on drawing/clearCanvas', () => {
      const action = { type: 'drawing/clearCanvas', payload: undefined };
      store.dispatch(action);
      expect(webSocketService.emitEvent).toHaveBeenCalledWith('set_strokes', expect.any(Object));
    });
  });
});