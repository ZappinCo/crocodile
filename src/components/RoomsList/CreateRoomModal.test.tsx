import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CreateRoomModal } from './CreateRoomModal';
import userReducer from '../../store/slices/user.slice';
import roomsReducer, { createRoom } from '../../store/slices/rooms.slice';

vi.mock('../../store/slices/rooms.slice', async () => {
  const actual = await vi.importActual('../../store/slices/rooms.slice');
  return {
    ...actual,
    createRoom: vi.fn((payload) => ({ type: 'rooms/createRoom', payload })),
  };
});

const createTestStore = (userId = 'user123', userName = 'TestUser') =>
  configureStore({
    reducer: {
      user: userReducer,
      rooms: roomsReducer,
    },
    preloadedState: {
      user: {
        id: userId,
        username: userName,
        isSet: true,
        avatarColor: '#000',
      },
      rooms: {
        rooms: [],
        selectedRoomId: null,
        isLoading: false,
        error: null,
      },
    },
  });

describe('CreateRoomModal', () => {
  const onCloseMock = vi.fn();

  beforeEach(() => {
    vi.mocked(createRoom).mockClear();
    onCloseMock.mockClear();
  });

  it('renders nothing when isOpen is false', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CreateRoomModal isOpen={false} onClose={onCloseMock} />
      </Provider>
    );
    expect(screen.queryByText('Создать новую комнату')).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CreateRoomModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    expect(screen.getByText('Создать новую комнату')).toBeInTheDocument();
    expect(screen.getByLabelText('Название комнаты *')).toBeInTheDocument();
    expect(screen.getByLabelText('Описание (необязательно)')).toBeInTheDocument();
    expect(screen.getByLabelText('Максимум игроков')).toBeInTheDocument();
    expect(screen.getByText('Слова для угадывания (необязательно)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Создать' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument();
  });

  it('closes modal when close button clicked', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CreateRoomModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('closes modal when overlay clicked', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CreateRoomModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    const overlay = document.querySelector('.modal-overlay');
    fireEvent.click(overlay!);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('validates room name - empty', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CreateRoomModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    const createButton = screen.getByRole('button', { name: 'Создать' });
    fireEvent.click(createButton);
    expect(await screen.findByText('Название комнаты не может быть пустым')).toBeInTheDocument();
    expect(vi.mocked(createRoom)).not.toHaveBeenCalled();
  });

  it('validates room name - too short', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CreateRoomModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    const nameInput = screen.getByLabelText('Название комнаты *');
    await userEvent.type(nameInput, 'ab');
    const createButton = screen.getByRole('button', { name: 'Создать' });
    fireEvent.click(createButton);
    expect(await screen.findByText('Название должно содержать минимум 3 символа')).toBeInTheDocument();
    expect(vi.mocked(createRoom)).not.toHaveBeenCalled();
  });

  it('validates room name - too long', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CreateRoomModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    const nameInput = screen.getByLabelText('Название комнаты *');
    await userEvent.type(nameInput, 'a'.repeat(31));
    const createButton = screen.getByRole('button', { name: 'Создать' });
    fireEvent.click(createButton);
    expect(await screen.findByText('Название не может быть длиннее 30 символов')).toBeInTheDocument();
    expect(vi.mocked(createRoom)).not.toHaveBeenCalled();
  });

  it('submits form with valid data and no custom words', async () => {
    const store = createTestStore('creator123', 'Alice');
    render(
      <Provider store={store}>
        <CreateRoomModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    const nameInput = screen.getByLabelText('Название комнаты *');
    await userEvent.type(nameInput, 'My Game Room');
    const createButton = screen.getByRole('button', { name: 'Создать' });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(vi.mocked(createRoom)).toHaveBeenCalledTimes(1);
    });
    expect(vi.mocked(createRoom)).toHaveBeenCalledWith({
      room_id: null,
      name: 'My Game Room',
      description: null,
      capacity: 6,
      words: undefined,
      creator_id: 'creator123',
      creator_name: 'Alice',
    });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('submits form with description and custom words', async () => {
    const store = createTestStore('creator456', 'Bob');
    render(
      <Provider store={store}>
        <CreateRoomModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    const nameInput = screen.getByLabelText('Название комнаты *');
    await userEvent.type(nameInput, 'Fun Room');
    const descInput = screen.getByLabelText('Описание (необязательно)');
    await userEvent.type(descInput, 'Best room ever');
    const capacitySelect = screen.getByLabelText('Максимум игроков');
    fireEvent.change(capacitySelect, { target: { value: '8' } });

    const wordInput = screen.getByPlaceholderText('Введите слово и нажмите Enter...');
    await userEvent.type(wordInput, 'крокодил');
    fireEvent.click(screen.getByText('➕ Добавить'));
    await userEvent.type(wordInput, 'жираф');
    fireEvent.click(screen.getByText('➕ Добавить'));

    const createButton = screen.getByRole('button', { name: 'Создать' });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(vi.mocked(createRoom)).toHaveBeenCalledTimes(1);
    });
    expect(vi.mocked(createRoom)).toHaveBeenCalledWith({
      room_id: null,
      name: 'Fun Room',
      description: 'Best room ever',
      capacity: 8,
      words: ['крокодил', 'жираф'],
      creator_id: 'creator456',
      creator_name: 'Bob',
    });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('adds a word to the list', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CreateRoomModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    const wordInput = screen.getByPlaceholderText('Введите слово и нажмите Enter...');
    await userEvent.type(wordInput, 'змея');
    fireEvent.click(screen.getByText('➕ Добавить'));
    expect(screen.getByText('змея')).toBeInTheDocument();
  });

  it('prevents adding duplicate words', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CreateRoomModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    const wordInput = screen.getByPlaceholderText('Введите слово и нажмите Enter...');
    await userEvent.type(wordInput, 'лев');
    fireEvent.click(screen.getByText('➕ Добавить'));
    await userEvent.type(wordInput, 'лев');
    fireEvent.click(screen.getByText('➕ Добавить'));
    const words = screen.getAllByText('лев');
    expect(words).toHaveLength(1);
  });
});