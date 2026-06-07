import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router';
import { Header } from './Header';
import userReducer from '../../store/slices/user.slice';
import websocketReducer from '../../store/slices/websocket.slice';

vi.mock('../UserModal/UserModal', () => ({
  UserModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? <div data-testid="user-modal">UserModal</div> : null,
}));

vi.mock('./UserMenu', () => ({
  UserMenu: ({ onEditProfile, onLogout, onClose }: any) => (
    <div data-testid="user-menu">
      <button onClick={onEditProfile}>Edit</button>
      <button onClick={onLogout}>Logout</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockConfirm = vi.fn();
window.confirm = mockConfirm;

const mockLocation = { pathname: '/' };
Object.defineProperty(window, 'location', {
  value: { reload: vi.fn() },
  writable: true,
});

const createTestStore = (options: {
  username?: string;
  isConnected?: boolean;
}) => {
  const { username = '', isConnected = true } = options;
  return configureStore({
    reducer: {
      user: userReducer,
      websocket: websocketReducer,
    },
    preloadedState: {
      user: {
        id: 'user1',
        username,
        isSet: !!username,
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

describe('Header', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockConfirm.mockClear();
    (window.location.reload as any).mockClear();
  });

  it('renders logo and title', () => {
    const store = createTestStore({ username: 'TestUser' });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </Provider>
    );
    expect(screen.getByText('Крокодил')).toBeInTheDocument();
    expect(screen.getByText('Рисуй и угадывай')).toBeInTheDocument();
    expect(screen.getByAltText('Crocodile Logo')).toBeInTheDocument();
  });

  it('shows username when user is set', () => {
    const store = createTestStore({ username: 'Alex' });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </Provider>
    );
    expect(screen.getByText('Alex')).toBeInTheDocument();
    const avatar = screen.getByText('A');
    expect(avatar).toBeInTheDocument();
  });

  it('shows "Гость" when username is empty', () => {
    const store = createTestStore({ username: '' });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </Provider>
    );
    expect(screen.getByText('Гость')).toBeInTheDocument();
    const avatar = screen.getByText('?');
    expect(avatar).toBeInTheDocument();
  });

  it('shows connected status indicator when isConnected true', () => {
    const store = createTestStore({ isConnected: true });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </Provider>
    );
    const statusDot = document.querySelector('.status-indicator.connected');
    expect(statusDot).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('shows disconnected status indicator when isConnected false', () => {
    const store = createTestStore({ isConnected: false });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </Provider>
    );
    const statusDot = document.querySelector('.status-indicator.disconnected');
    expect(statusDot).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('navigates to home when logo clicked', () => {
    const store = createTestStore({});
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </Provider>
    );
    const logo = screen.getByText('Крокодил').closest('.header-logo');
    fireEvent.click(logo!);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to about page when about button clicked', () => {
    const store = createTestStore({});
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </Provider>
    );
    const aboutBtn = screen.getByText('О проекте');
    fireEvent.click(aboutBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/about');
  });

  it('opens user menu when user info clicked', () => {
    const store = createTestStore({ username: 'Test' });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </Provider>
    );
    const userInfo = screen.getByText('Test').closest('.user-info');
    expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
    fireEvent.click(userInfo!);
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('closes user menu when clicking outside', () => {
    const store = createTestStore({ username: 'Test' });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </Provider>
    );
    const userInfo = screen.getByText('Test').closest('.user-info');
    fireEvent.click(userInfo!);
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
  });

  it('opens UserModal when Edit is clicked', () => {
    const store = createTestStore({ username: 'Test' });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </Provider>
    );
    const userInfo = screen.getByText('Test').closest('.user-info');
    fireEvent.click(userInfo!);
    const editBtn = screen.getByText('Edit');
    fireEvent.click(editBtn);
    expect(screen.getByTestId('user-modal')).toBeInTheDocument();
  });

  it('logs out and reloads when Logout confirmed', () => {
    mockConfirm.mockReturnValue(true);
    const store = createTestStore({ username: 'Test' });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </Provider>
    );
    const userInfo = screen.getByText('Test').closest('.user-info');
    fireEvent.click(userInfo!);
    const logoutBtn = screen.getByText('Logout');
    fireEvent.click(logoutBtn);
    expect(mockConfirm).toHaveBeenCalledWith('Вы уверены, что хотите выйти?');
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('does not log out when Logout canceled', () => {
    mockConfirm.mockReturnValue(false);
    const store = createTestStore({ username: 'Test' });
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </Provider>
    );
    const userInfo = screen.getByText('Test').closest('.user-info');
    fireEvent.click(userInfo!);
    const logoutBtn = screen.getByText('Logout');
    fireEvent.click(logoutBtn);
    expect(mockConfirm).toHaveBeenCalled();
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});