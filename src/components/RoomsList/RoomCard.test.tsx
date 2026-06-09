import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router';
import { RoomCard } from './RoomCard';
import roomsReducer, { deleteRoom, editRoom } from '../../store/slices/rooms.slice';
import userReducer from '../../store/slices/user.slice';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../store/slices/rooms.slice', async () => {
  const actual = await vi.importActual('../../store/slices/rooms.slice');
  return {
    ...actual,
    deleteRoom: vi.fn((id) => ({ type: 'rooms/deleteRoom', payload: id })),
    editRoom: vi.fn((payload) => ({ type: 'rooms/editRoom', payload })),
  };
});

const createTestStore = (room: any, currentUserId: string) => {
  return configureStore({
    reducer: {
      rooms: roomsReducer,
      user: userReducer,
    },
    preloadedState: {
      rooms: {
        rooms: [room],
        selectedRoomId: null,
        isLoading: false,
        error: null,
      },
      user: {
        id: currentUserId,
        username: 'CurrentUser',
        isSet: true,
        avatarColor: '#000',
      },
    },
  });
};

describe('RoomCard', () => {
  const baseRoom = {
    id: 'room1',
    name: 'Test Room',
    description: 'Test description',
    capacity: 6,
    current_users: 3,
    created_at: '2024-01-01T10:00:00Z',
    owner_id: 'user1',
    game_active: true,
    leader_id: 'user1',
    words_pool: ['cat', 'dog'],
  };

  beforeEach(() => {
    mockNavigate.mockClear();
    vi.mocked(deleteRoom).mockClear();
    vi.mocked(editRoom).mockClear();
  });

  it('renders room info correctly', () => {
    const store = createTestStore(baseRoom, 'user1');
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RoomCard room={baseRoom} />
        </BrowserRouter>
      </Provider>
    );
    expect(screen.getByText('Test Room')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('👥')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('/6')).toBeInTheDocument();
    expect(screen.getByText(/1 янв\./)).toBeInTheDocument();
    expect(screen.getByText('Игра идет')).toBeInTheDocument();
    expect(screen.getByText('📚 Слова:')).toBeInTheDocument();
    expect(screen.getByText('2 слов')).toBeInTheDocument();
  });

  it('shows edit and delete buttons for creator', () => {
    const store = createTestStore(baseRoom, 'user1');
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RoomCard room={baseRoom} />
        </BrowserRouter>
      </Provider>
    );
    expect(screen.getByTitle('Редактировать комнату')).toBeInTheDocument();
    expect(screen.getByTitle('Удалить комнату')).toBeInTheDocument();
  });

  it('does not show edit and delete buttons for non-creator', () => {
    const store = createTestStore(baseRoom, 'user2');
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RoomCard room={baseRoom} />
        </BrowserRouter>
      </Provider>
    );
    expect(screen.queryByTitle('Редактировать комнату')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Удалить комнату')).not.toBeInTheDocument();
  });

  it('navigates to room detail on click when not full', () => {
    const store = createTestStore(baseRoom, 'user1');
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RoomCard room={baseRoom} />
        </BrowserRouter>
      </Provider>
    );
    const card = screen.getByText('Test Room').closest('.room-card');
    fireEvent.click(card!);
    expect(mockNavigate).toHaveBeenCalledWith('/room/room1');
  });

  it('does not navigate when room is full', () => {
    const fullRoom = { ...baseRoom, current_users: 6 };
    const store = createTestStore(fullRoom, 'user1');
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RoomCard room={fullRoom} />
        </BrowserRouter>
      </Provider>
    );
    const card = screen.getByText('Test Room').closest('.room-card');
    expect(card).toHaveStyle('cursor: not-allowed');
    fireEvent.click(card!);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('enters edit mode when edit button clicked', () => {
    const store = createTestStore(baseRoom, 'user1');
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RoomCard room={baseRoom} />
        </BrowserRouter>
      </Provider>
    );
    fireEvent.click(screen.getByTitle('Редактировать комнату'));
    expect(screen.getByDisplayValue('Test Room')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    const selectedOption = screen.getByRole('option', { selected: true });
    expect(selectedOption).toHaveTextContent('6 игроков');
    expect(screen.getByText('💾 Сохранить')).toBeInTheDocument();
    expect(screen.getByText('❌ Отмена')).toBeInTheDocument();
  });

  it('saves edited room data', async () => {
    const store = createTestStore(baseRoom, 'user1');
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RoomCard room={baseRoom} />
        </BrowserRouter>
      </Provider>
    );
    fireEvent.click(screen.getByTitle('Редактировать комнату'));
    const nameInput = screen.getByDisplayValue('Test Room');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    const descInput = screen.getByDisplayValue('Test description');
    fireEvent.change(descInput, { target: { value: 'New desc' } });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '8' } });
    const wordInput = screen.getByPlaceholderText('Новое слово...');
    fireEvent.change(wordInput, { target: { value: 'mouse' } });
    fireEvent.click(screen.getByText('➕ Добавить'));
    fireEvent.click(screen.getByText('💾 Сохранить'));
    await waitFor(() => {
      expect(vi.mocked(editRoom)).toHaveBeenCalledTimes(1);
    });
    expect(vi.mocked(editRoom)).toHaveBeenCalledWith({
      room_id: 'room1',
      creator_id: 'user1',
      creator_name: 'CurrentUser',
      name: 'New Name',
      description: 'New desc',
      capacity: 8,
      words: ['cat', 'dog', 'mouse'],
    });
  });

  it('cancels edit mode without changes', () => {
    const store = createTestStore(baseRoom, 'user1');
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RoomCard room={baseRoom} />
        </BrowserRouter>
      </Provider>
    );
    fireEvent.click(screen.getByTitle('Редактировать комнату'));
    fireEvent.click(screen.getByText('❌ Отмена'));
    expect(screen.queryByDisplayValue('Test Room')).not.toBeInTheDocument();
    expect(screen.getByText('Test Room')).toBeInTheDocument();
    expect(vi.mocked(editRoom)).not.toHaveBeenCalled();
  });

  it('opens delete confirmation dialog', () => {
    const store = createTestStore(baseRoom, 'user1');
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RoomCard room={baseRoom} />
        </BrowserRouter>
      </Provider>
    );
    fireEvent.click(screen.getByTitle('Удалить комнату'));
    expect(screen.getByText('Удалить комнату "Test Room"?')).toBeInTheDocument();
    expect(screen.getByText('✅ Да, удалить')).toBeInTheDocument();
    expect(screen.getByText('❌ Отмена')).toBeInTheDocument();
  });

  it('deletes room when confirmed', async () => {
    const store = createTestStore(baseRoom, 'user1');
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RoomCard room={baseRoom} />
        </BrowserRouter>
      </Provider>
    );
    fireEvent.click(screen.getByTitle('Удалить комнату'));
    fireEvent.click(screen.getByText('✅ Да, удалить'));
    await waitFor(() => {
      expect(vi.mocked(deleteRoom)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(deleteRoom)).toHaveBeenCalledWith('room1');
    });
  });

  it('cancels delete confirmation', () => {
    const store = createTestStore(baseRoom, 'user1');
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RoomCard room={baseRoom} />
        </BrowserRouter>
      </Provider>
    );
    fireEvent.click(screen.getByTitle('Удалить комнату'));
    fireEvent.click(screen.getByText('❌ Отмена'));
    expect(screen.queryByText('Удалить комнату "Test Room"?')).not.toBeInTheDocument();
    expect(vi.mocked(deleteRoom)).not.toHaveBeenCalled();
  });

  it('shows full room style when full', () => {
    const fullRoom = { ...baseRoom, current_users: 6 };
    const store = createTestStore(fullRoom, 'user1');
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RoomCard room={fullRoom} />
        </BrowserRouter>
      </Provider>
    );
    const card = screen.getByText('Test Room').closest('.room-card');
    expect(card).toHaveClass('full');
  });
});