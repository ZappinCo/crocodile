import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import roomsReducer, { setRooms, wsUpdateRoom, wsUserJoined, wsUserLeft, wsRoomCreated, wsRoomDeleted } from './features/roomsSlice';
import websocketReducer, { connected, disconnected, error } from './features/websocketSlice';
import userReducer from './features/userSlice';
import drawingReducer from './features/drawingSlice'
import chatReducer,{setupChatWebSocketSubscriptions} from './features/chatSlice'
import { webSocketService, WebSocketEventType, webSocketMiddleware } from './services/websocketService';

// Создаем store
export const store = configureStore({
  reducer: {
    rooms: roomsReducer,
    websocket: websocketReducer,
    user: userReducer,
    drawing: drawingReducer,
    chat: chatReducer,

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['websocket/connected', 'websocket/disconnected', 'websocket/error'],
      },
    }).concat(webSocketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

console.log('Setting up WebSocket subscriptions...');

// ✅ КЛЮЧЕВО: Подписка на CONNECT событие
webSocketService.subscribe(WebSocketEventType.CONNECT, (data) => {
  console.log('📡 CONNECT event received, dispatching connected action...', data);
  store.dispatch(connected(data));
});

// ✅ Подписка на DISCONNECT событие
webSocketService.subscribe(WebSocketEventType.DISCONNECT, (data) => {
  console.log('📡 DISCONNECT event received, dispatching disconnected action...', data);
  store.dispatch(disconnected(data));
});

// ✅ Подписка на CONNECT_ERROR событие
webSocketService.subscribe(WebSocketEventType.CONNECT_ERROR, (data) => {
  console.log('📡 CONNECT_ERROR event received, dispatching error action...', data);
  store.dispatch(error(data));
});

// Подписка на INITIAL_ROOMS
webSocketService.subscribe('initial_rooms', (data) => {
  console.log('📦 INITIAL_ROOMS received, rooms count:', data.length);
  store.dispatch(setRooms(data));
});

// Подписка на другие события
webSocketService.subscribe(WebSocketEventType.ROOM_UPDATE, (data) => {
  console.log('🔄 ROOM_UPDATE received:', data);
  store.dispatch(wsUpdateRoom(data));
});

webSocketService.subscribe(WebSocketEventType.USER_JOINED, (data) => {
  console.log('👤 USER_JOINED received:', data);
  store.dispatch(wsUserJoined(data));
});

webSocketService.subscribe(WebSocketEventType.USER_LEFT, (data) => {
  console.log('👋 USER_LEFT received:', data);
  store.dispatch(wsUserLeft(data));
});

webSocketService.subscribe(WebSocketEventType.ROOM_CREATED, (data) => {
  console.log('🏠 ROOM_CREATED received:', data);
  store.dispatch(wsRoomCreated(data));
});

webSocketService.subscribe(WebSocketEventType.ROOM_DELETED, (data) => {
  console.log('🗑️ ROOM_DELETED received:', data);
  store.dispatch(wsRoomDeleted(data));
});

setupChatWebSocketSubscriptions(store.dispatch)

console.log('✅ All WebSocket subscriptions registered');
console.log('✅ Subscribed to events:', [
  WebSocketEventType.CONNECT,
  WebSocketEventType.DISCONNECT,
  WebSocketEventType.CONNECT_ERROR,
  'initial_rooms',
]);