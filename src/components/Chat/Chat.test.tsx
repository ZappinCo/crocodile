import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Chat } from './Chat';
import chatReducer from '../../store/slices/chat.slice';
import roomsReducer from '../../store/slices/rooms.slice';
import userReducer from '../../store/slices/user.slice';
import websocketReducer from '../../store/slices/websocket.slice';
import * as reactRedux from 'react-redux';

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: vi.fn(() => vi.fn()),
  };
});

vi.mock('../../hooks/useAutoScroll', () => ({
  useAutoScroll: () => ({
    containerRef: { current: null },
    handleScroll: vi.fn(),
  }),
}));

vi.mock('./ChatMessage', () => ({
  ChatMessage: ({ message }: { message: any }) => <div data-testid="chat-message">{message.text}</div>,
}));

const createTestStore = (options: {
  isConnected?: boolean;
  room?: {
    id: string;
    name: string;
    capacity: number;
    current_users: number;
    game_active: boolean;
    leader_id?: string;
    current_word?: string;
  };
  user?: { id: string; username: string };
  messages?: any[];
  isLoading?: boolean;
}) => {
  const {
    isConnected = true,
    room = {
      id: 'room1',
      name: 'Test Room',
      capacity: 6,
      current_users: 2,
      game_active: true,
      leader_id: 'user1',
    },
    user = { id: 'user1', username: 'TestUser' },
    messages = [],
    isLoading = false,
  } = options;

  return configureStore({
    reducer: {
      chat: chatReducer,
      rooms: roomsReducer,
      user: userReducer,
      websocket: websocketReducer,
    },
    preloadedState: {
      chat: {
        messages,
        isLoading,
        error: null,
        activeRoomId: room.id,
      },
      rooms: {
        rooms: [room],
        selectedRoomId: room.id,
        isLoading: false,
        error: null,
      },
      user: {
        id: user.id,
        username: user.username,
        isSet: true,
        avatarColor: '#000',
      },
      websocket: {
        isConnected,
        error: null,
        reconnectAttempts: 0,
      },
    },
  });
};

describe('Chat', () => {
  it('renders loading state when not connected', () => {
    const store = createTestStore({ isConnected: false });
    render(
      <Provider store={store}>
        <Chat />
      </Provider>
    );
    expect(screen.getByText(/Подключение к чату/i)).toBeInTheDocument();
  });

  it('renders loading spinner when isLoading', () => {
    const store = createTestStore({ isLoading: true });
    render(
      <Provider store={store}>
        <Chat />
      </Provider>
    );
    expect(screen.getByText(/Загрузка сообщений/i)).toBeInTheDocument();
  });


  it('renders messages when they exist', () => {
    const now = new Date().toISOString();
    const messages = [
      { id: '1', roomId: 'room1', userId: 'user1', userName: 'Leader', text: 'Hello', timestamp: now, isGuess: false },
      { id: '2', roomId: 'room1', userId: 'user2', userName: 'Player', text: 'Hi', timestamp: now, isGuess: false },
    ];
    const store = createTestStore({
      room: {
        id: 'room1',
        name: 'Chat Room',
        capacity: 6,
        current_users: 2,
        game_active: true,
        leader_id: 'user1',
      },
      user: { id: 'user2', username: 'Player' },
      messages,
      isLoading: false,
    });
    render(
      <Provider store={store}>
        <Chat />
      </Provider>
    );
    expect(screen.getAllByTestId('chat-message')).toHaveLength(2);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });

  it('shows current word for leader', () => {
    const store = createTestStore({
      room: {
        id: 'room1',
        name: 'Word Room',
        capacity: 6,
        current_users: 2,
        game_active: true,
        leader_id: 'user1',
        current_word: 'Крокодил',
      },
      user: { id: 'user1', username: 'Leader' },
      messages: [],
      isLoading: false,
    });
    render(
      <Provider store={store}>
        <Chat />
      </Provider>
    );
    expect(screen.getByText('🎯 Загаданное слово:')).toBeInTheDocument();
    expect(screen.getByText('Крокодил')).toBeInTheDocument();
  });
});