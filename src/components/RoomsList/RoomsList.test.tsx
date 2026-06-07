import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { RoomsList } from './RoomsList';
import roomsReducer from '../../store/slices/rooms.slice';

vi.mock('./RoomCard', () => ({
  RoomCard: ({ room }: { room: any }) => <div data-testid="room-card">{room.name}</div>,
}));

vi.mock('./CreateRoomModal', () => ({
  CreateRoomModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="create-room-modal">
        Create Room Modal
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

const createTestStore = (rooms: any[] = []) => {
  return configureStore({
    reducer: {
      rooms: roomsReducer,
    },
    preloadedState: {
      rooms: {
        rooms,
        selectedRoomId: null,
        isLoading: false,
        error: null,
      },
    },
  });
};

describe('RoomsList', () => {
  it('renders empty state when no rooms', () => {
    const store = createTestStore([]);
    render(
      <Provider store={store}>
        <RoomsList />
      </Provider>
    );
    expect(screen.getByText('Игровые комнаты')).toBeInTheDocument();
    expect(screen.getByText('Нет доступных комнат')).toBeInTheDocument();
    expect(screen.getByText('Создайте первую комнату и начните игру!')).toBeInTheDocument();
    expect(screen.queryByTestId('room-card')).not.toBeInTheDocument();
  });

  it('renders list of rooms when rooms exist', () => {
    const rooms = [
      { id: '1', name: 'Room 1' },
      { id: '2', name: 'Room 2' },
    ];
    const store = createTestStore(rooms);
    render(
      <Provider store={store}>
        <RoomsList />
      </Provider>
    );
    expect(screen.getByText('Room 1')).toBeInTheDocument();
    expect(screen.getByText('Room 2')).toBeInTheDocument();
    expect(screen.getAllByTestId('room-card')).toHaveLength(2);
    expect(screen.queryByText('Нет доступных комнат')).not.toBeInTheDocument();
  });

  it('opens CreateRoomModal when create button clicked', () => {
    const store = createTestStore([]);
    render(
      <Provider store={store}>
        <RoomsList />
      </Provider>
    );
    expect(screen.queryByTestId('create-room-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Создать комнату'));
    expect(screen.getByTestId('create-room-modal')).toBeInTheDocument();
  });

  it('closes CreateRoomModal when modal calls onClose', () => {
    const store = createTestStore([]);
    render(
      <Provider store={store}>
        <RoomsList />
      </Provider>
    );
    fireEvent.click(screen.getByText('Создать комнату'));
    expect(screen.getByTestId('create-room-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('create-room-modal')).not.toBeInTheDocument();
  });
});