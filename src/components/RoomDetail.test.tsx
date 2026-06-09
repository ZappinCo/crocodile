import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router';
import { RoomDetail } from './RoomDetail';
import roomsReducer, { userJoined, userLeft } from '../store/slices/rooms.slice';
import userReducer from '../store/slices/user.slice';
import websocketReducer from '../store/slices/websocket.slice';

vi.mock('./Chat/Chat', () => ({
  Chat: () => <div data-testid="chat">Chat Component</div>,
}));

vi.mock('./DrawingCanvas/DrawingCanvas', () => ({
  DrawingCanvas: () => <div data-testid="drawing-canvas">DrawingCanvas Component</div>,
}));

const mockDispatch = vi.fn();
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createTestStore = (options: {
  room?: any;
  userId?: string;
  isConnected?: boolean;
  selectedRoomId?: string | null;
}) => {
  const { room = null, userId = 'user1', isConnected = true, selectedRoomId = null } = options;
  return configureStore({
    reducer: {
      rooms: roomsReducer,
      user: userReducer,
      websocket: websocketReducer,
    },
    preloadedState: {
      rooms: {
        rooms: room ? [room] : [],
        selectedRoomId,
        isLoading: false,
        error: null,
      },
      user: {
        id: userId,
        username: 'TestUser',
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

describe('RoomDetail', () => {
  const baseRoom = {
    id: 'room1',
    name: 'Test Room',
    capacity: 6,
    current_users: 2,
    leader_id: 'user1',
    game_active: true,
  };

  beforeEach(() => {
    mockDispatch.mockClear();
    mockNavigate.mockClear();
  });

  it('shows loading state when not connected', () => {
    const store = createTestStore({ isConnected: false });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/room/room1']}>
          <Routes>
            <Route path="/room/:roomId" element={<RoomDetail />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText(/Подключение к серверу/i)).toBeInTheDocument();
  });

  it('shows room not found when room does not exist in store', () => {
    const store = createTestStore({ room: null });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/room/nonexistent']}>
          <Routes>
            <Route path="/room/:roomId" element={<RoomDetail />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText('Комната не найдена')).toBeInTheDocument();
    expect(screen.getByText('Вернуться к списку комнат')).toBeInTheDocument();
  });

  it('renders room detail when room exists and connected', () => {
    const store = createTestStore({ room: baseRoom, selectedRoomId: baseRoom.id });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/room/room1']}>
          <Routes>
            <Route path="/room/:roomId" element={<RoomDetail />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByTestId('chat')).toBeInTheDocument();
    expect(screen.getByTestId('drawing-canvas')).toBeInTheDocument();
  });

  it('dispatches userJoined when entering a new room that is not yet selected', async () => {
    const store = createTestStore({ room: baseRoom, selectedRoomId: null });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/room/room1']}>
          <Routes>
            <Route path="/room/:roomId" element={<RoomDetail />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rooms/userJoined',
          payload: expect.objectContaining({
            room_id: 'room1',
            user_id: 'user1',
            user_name: 'TestUser',
          }),
        })
      );
    });
  });

  it('does not dispatch userJoined if already in the same room', async () => {
    const store = createTestStore({ room: baseRoom, selectedRoomId: baseRoom.id });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/room/room1']}>
          <Routes>
            <Route path="/room/:roomId" element={<RoomDetail />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    await waitFor(() => {
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'rooms/userJoined' })
      );
    });
  });

  it('dispatches userLeft on unmount', () => {
    const store = createTestStore({ room: baseRoom, selectedRoomId: baseRoom.id });
    const { unmount } = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/room/room1']}>
          <Routes>
            <Route path="/room/:roomId" element={<RoomDetail />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    unmount();
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rooms/userLeft',
        payload: expect.objectContaining({
          room_id: 'room1',
          user_id: 'user1',
          user_name: 'TestUser',
        }),
      })
    );
  });

  it('navigates back when room not found and button clicked', () => {
    const store = createTestStore({ room: null });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/room/nonexistent']}>
          <Routes>
            <Route path="/room/:roomId" element={<RoomDetail />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    const button = screen.getByText('Вернуться к списку комнат');
    button.click();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});