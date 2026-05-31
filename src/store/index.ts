import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import { websocketMiddleware } from '../middleware/websocket.middleware';
import websocketReducer from './slices/websocket.slice';
import roomsReducer from './slices/rooms.slice';
import chatReducer from './slices/chat.slice';
import userReducer from './slices/user.slice';
import drawingReducer from './slices/drawing.slice';

export const store = configureStore({
  reducer: {
    websocket: websocketReducer,
    rooms: roomsReducer,
    chat: chatReducer,
    user: userReducer,
    drawing: drawingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['websocket/connected', 'websocket/disconnected', 'websocket/error'],
        ignoredPaths: ['websocket.error'],
      },
    }).concat(websocketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;