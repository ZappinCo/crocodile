import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MainLayout } from './MainLayout';
import userReducer from '../store/slices/user.slice';
import websocketReducer from '../store/slices/websocket.slice';

vi.mock('../components/Header/Header', () => ({
  Header: () => <div data-testid="header">Header Mock</div>,
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      user: userReducer,
      websocket: websocketReducer,
    },
    preloadedState: {
      user: {
        id: 'user1',
        username: 'TestUser',
        isSet: true,
        avatarColor: '#000',
      },
      websocket: {
        isConnected: true,
        error: null,
        reconnectAttempts: 0,
      },
    },
  });
};

describe('MainLayout', () => {
  it('renders header and outlet content', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/test']}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/test" element={<div data-testid="outlet-content">Outlet Page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
    expect(screen.getByText('Outlet Page')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <MemoryRouter>
          <MainLayout />
        </MemoryRouter>
      </Provider>
    );
    const mainLayoutDiv = container.firstChild as HTMLElement;
    expect(mainLayoutDiv).toHaveClass('main-layout');
    const mainElement = document.querySelector('main');
    expect(mainElement).toHaveClass('layout-content');
    const containerDiv = mainElement?.querySelector('.container');
    expect(containerDiv).toBeInTheDocument();
  });
});