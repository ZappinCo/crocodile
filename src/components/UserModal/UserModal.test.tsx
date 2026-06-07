import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { UserModal } from './UserModal';
import userReducer, { setUsername } from '../../store/slices/user.slice';

vi.mock('../../store/slices/user.slice', async () => {
  const actual = await vi.importActual('../../store/slices/user.slice');
  return {
    ...actual,
    setUsername: vi.fn((name) => ({ type: 'user/setUsername', payload: name })),
  };
});

const createTestStore = (username = '') =>
  configureStore({
    reducer: {
      user: userReducer,
    },
    preloadedState: {
      user: {
        id: '',
        username,
        isSet: !!username,
        avatarColor: '#000',
      },
    },
  });

describe('UserModal', () => {
  const onCloseMock = vi.fn();

  beforeEach(() => {
    onCloseMock.mockClear();
    vi.mocked(setUsername).mockClear();
  });

  it('renders nothing when isOpen is false', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <UserModal isOpen={false} onClose={onCloseMock} />
      </Provider>
    );
    expect(screen.queryByText('Добро пожаловать!')).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <UserModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    expect(screen.getByText('Добро пожаловать!')).toBeInTheDocument();
    expect(screen.getByLabelText('Ваше имя:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Начать игру' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument();
  });

  it('closes modal when close button clicked', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <UserModal isOpen={true} onClose={onCloseMock} />
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
        <UserModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    const overlay = document.querySelector('.modal-overlay');
    fireEvent.click(overlay!);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('validates empty username', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <UserModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    const startButton = screen.getByRole('button', { name: 'Начать игру' });
    fireEvent.click(startButton);
    expect(await screen.findByText('Имя пользователя не может быть пустым')).toBeInTheDocument();
    expect(vi.mocked(setUsername)).not.toHaveBeenCalled();
  });

  it('validates username too short', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <UserModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    const input = screen.getByLabelText('Ваше имя:');
    await userEvent.type(input, 'a');
    const startButton = screen.getByRole('button', { name: 'Начать игру' });
    fireEvent.click(startButton);
    expect(await screen.findByText('Имя пользователя должно содержать минимум 2 символа')).toBeInTheDocument();
    expect(vi.mocked(setUsername)).not.toHaveBeenCalled();
  });

  it('validates username too long', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <UserModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    const input = screen.getByLabelText('Ваше имя:');
    await userEvent.type(input, 'a'.repeat(21));
    const startButton = screen.getByRole('button', { name: 'Начать игру' });
    fireEvent.click(startButton);
    expect(await screen.findByText('Имя пользователя не может быть длиннее 20 символов')).toBeInTheDocument();
    expect(vi.mocked(setUsername)).not.toHaveBeenCalled();
  });

  it('validates invalid characters', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <UserModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    const input = screen.getByLabelText('Ваше имя:');
    await userEvent.type(input, 'test@name');
    const startButton = screen.getByRole('button', { name: 'Начать игру' });
    fireEvent.click(startButton);
    expect(await screen.findByText(/только буквы, цифры и подчеркивания/)).toBeInTheDocument();
    expect(vi.mocked(setUsername)).not.toHaveBeenCalled();
  });

  it('submits valid username and closes modal', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <UserModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    const input = screen.getByLabelText('Ваше имя:');
    await userEvent.type(input, 'ValidUser');
    const startButton = screen.getByRole('button', { name: 'Начать игру' });
    fireEvent.click(startButton);
    await waitFor(() => {
      expect(vi.mocked(setUsername)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(setUsername)).toHaveBeenCalledWith('ValidUser');
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  it('submits on Enter key', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <UserModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    const input = screen.getByLabelText('Ваше имя:');
    await userEvent.type(input, 'UserEnter{enter}');
    await waitFor(() => {
      expect(vi.mocked(setUsername)).toHaveBeenCalledWith('UserEnter');
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  it('prefills username from store if already set', () => {
    const store = createTestStore('ExistingUser');
    render(
      <Provider store={store}>
        <UserModal isOpen={true} onClose={onCloseMock} />
      </Provider>
    );
    expect(screen.getByDisplayValue('ExistingUser')).toBeInTheDocument();
  });
});