import { describe, it, expect } from 'vitest';
import chatReducer, {
  setActiveRoom,
  addMessage,
  setMessagesHistory,
  setLoading,
  sendMessage,
  requestHistory,
  selectActiveRoomId,
  selectMessages,
  selectIsLoading,
} from './chat.slice';
import type { Message } from './chat.slice';

describe('chat slice', () => {
  const initialState = {
    messages: [],
    isLoading: false,
    error: null,
    activeRoomId: null,
  };

  it('should return initial state', () => {
    expect(chatReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('reducers', () => {
    it('should handle setActiveRoom', () => {
      const newState = chatReducer(initialState, setActiveRoom('room123'));
      expect(newState.activeRoomId).toBe('room123');
    });

    it('should handle addMessage only when activeRoomId matches message.roomId', () => {
      const message: Message = {
        id: '1',
        roomId: 'room456',
        userId: 'user1',
        text: 'Hello',
        timestamp: '2024-01-01T00:00:00Z',
        isGuess: false,
      };
      const state1 = chatReducer({ ...initialState, activeRoomId: 'room123' }, addMessage(message));
      expect(state1.messages).toHaveLength(0);

      const state2 = chatReducer({ ...initialState, activeRoomId: 'room456' }, addMessage(message));
      expect(state2.messages).toHaveLength(1);
      expect(state2.messages[0]).toEqual(message);
    });

    it('should handle setMessagesHistory only when activeRoomId matches room_id', () => {
      const messages = [
        { id: 'm1', roomId: 'room123', userId: 'u1', text: 'Hi', timestamp: 'now', isGuess: false },
      ];

      const stateWithLoadingTrue = { ...initialState, activeRoomId: 'other', isLoading: true };
      const state1 = chatReducer(stateWithLoadingTrue, setMessagesHistory({ room_id: 'room123', messages }));
      expect(state1.messages).toHaveLength(0);
      expect(state1.isLoading).toBe(true);
      const state2 = chatReducer(
        { ...initialState, activeRoomId: 'room123', isLoading: true },
        setMessagesHistory({ room_id: 'room123', messages })
      );
      expect(state2.messages).toEqual(messages);
      expect(state2.isLoading).toBe(false);
    });

    it('should handle setLoading', () => {
      const state = chatReducer(initialState, setLoading(true));
      expect(state.isLoading).toBe(true);
    });
  });

  describe('action creators', () => {
    it('sendMessage should create correct action', () => {
      const user = { id: 'user123', username: 'Alice', isSet: true, avatarColor: '#fff' };
      const action = sendMessage('Hello world', 'room999', user);
      expect(action).toEqual({
        type: 'chat/sendMessage',
        payload: {
          text: 'Hello world',
          roomId: 'room999',
          userId: 'user123',
          userName: 'Alice',
        },
        meta: { webSocket: true, event: 'new_message' },
      });
    });

    it('requestHistory should create correct action', () => {
      const action = requestHistory('room999');
      expect(action).toEqual({
        type: 'chat/requestHistory',
        payload: { roomId: 'room999' },
        meta: { webSocket: true, event: 'request_history' },
      });
    });
  });

  describe('selectors', () => {
    const state = {
      chat: {
        messages: [{ id: '1', text: 'test' }],
        isLoading: true,
        error: null,
        activeRoomId: 'room1',
      },
    };

    it('selectActiveRoomId', () => {
      expect(selectActiveRoomId(state)).toBe('room1');
    });

    it('selectMessages', () => {
      expect(selectMessages(state)).toEqual([{ id: '1', text: 'test' }]);
    });

    it('selectIsLoading', () => {
      expect(selectIsLoading(state)).toBe(true);
    });
  });
});