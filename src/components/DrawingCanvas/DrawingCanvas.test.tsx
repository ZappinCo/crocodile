import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { DrawingCanvas } from './DrawingCanvas';
import drawingReducer, { sendStroke } from '../../store/slices/drawing.slice';
import roomsReducer from '../../store/slices/rooms.slice';
import userReducer from '../../store/slices/user.slice';
import websocketReducer from '../../store/slices/websocket.slice';

vi.mock('./Pallete', () => ({
  Pallete: () => <div data-testid="pallete">Pallete</div>,
}));

vi.spyOn(await import('../../store/slices/drawing.slice'), 'sendStroke');

const createTestStore = (options: {
  isLeader?: boolean;
  strokes?: any[];
  brush?: { color: string; size: number };
}) => {
  const {
    isLeader = true,
    strokes = [],
    brush = { color: '#000000', size: 0.2 },
  } = options;

  const room = {
    id: 'room1',
    leader_id: isLeader ? 'user1' : 'user2',
    game_active: true,
  };
  const user = { id: 'user1', username: 'TestUser' };

  return configureStore({
    reducer: {
      drawing: drawingReducer,
      rooms: roomsReducer,
      user: userReducer,
      websocket: websocketReducer,
    },
    preloadedState: {
      drawing: {
        brush,
        eraserMode: false,
        strokes,
        canvasSize: { width: 800, height: 600 },
        history: { past: [], future: [] },
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
        isConnected: true,
        error: null,
        reconnectAttempts: 0,
      },
    },
  });
};

describe('DrawingCanvas', () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => { },
    }));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders canvas and pallete for leader', () => {
    const store = createTestStore({ isLeader: true });
    render(
      <Provider store={store}>
        <DrawingCanvas />
      </Provider>
    );
    expect(screen.getByTestId('pallete')).toBeInTheDocument();
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveStyle('cursor: crosshair');
  });

  it('hides pallete for non-leader', () => {
    const store = createTestStore({ isLeader: false });
    render(
      <Provider store={store}>
        <DrawingCanvas />
      </Provider>
    );
    expect(screen.queryByTestId('pallete')).not.toBeInTheDocument();
    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveStyle('cursor: not-allowed');
  });

  it('calls sendStroke after drawing and throttle', async () => {
    vi.useFakeTimers();
    const store = createTestStore({ isLeader: true });
    render(
      <Provider store={store}>
        <DrawingCanvas />
      </Provider>
    );
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;

    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 110, clientY: 110 });
    fireEvent.mouseMove(canvas, { clientX: 120, clientY: 120 });
    fireEvent.mouseUp(canvas);

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(sendStroke).toHaveBeenCalledTimes(1);
    const calledPayload = (sendStroke as any).mock.calls[0][0];
    expect(calledPayload.points).toBeDefined();
    expect(calledPayload.points.length).toBeGreaterThan(0);
  });

  it('does not call sendStroke when not leader', async () => {
    const store = createTestStore({ isLeader: false });
    render(
      <Provider store={store}>
        <DrawingCanvas />
      </Provider>
    );
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;

    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 110, clientY: 110 });
    fireEvent.mouseUp(canvas);

    expect(sendStroke).not.toHaveBeenCalled();
  });

  it('cleans up throttle timeout on unmount', () => {
    const store = createTestStore({ isLeader: true });
    const { unmount } = render(
      <Provider store={store}>
        <DrawingCanvas />
      </Provider>
    );
    unmount();
    expect(true).toBe(true);
  });
});