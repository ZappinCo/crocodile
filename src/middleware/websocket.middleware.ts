// src/middleware/websocket.middleware.ts
import type { Middleware } from '@reduxjs/toolkit';
import { webSocketService } from '../services/websocket.service';
import type { WebSocketEventType } from '../services/websocket.service';
import { 
  connected, 
  disconnected, 
  websocketError, 
  reconnecting 
} from '../store/slices/websocket.slice';
import {
  setRooms,
  userJoined,
  userLeft,
  gameStatusChanged,
} from '../store/slices/rooms.slice';
import {
  addMessage,
  setMessagesHistory,
  deleteMessage,
  updateMessage,
  userTyping,
  setLoading,
  addChatRoom,
} from '../store/slices/chat.slice';

// Упрощенная типизация middleware
export const websocketMiddleware: Middleware = ({ dispatch, getState }) => {
  // Настройка слушателей WebSocket событий
  const setupListeners = () => {
    console.log("setupListeners")
    webSocketService.on('connect', (data) => {
      console.log('🔌 [Middleware] Connected', data);
      dispatch(connected(data));
    });

    webSocketService.on('disconnect', (data) => {
      console.log('🔌 [Middleware] Disconnected', data);
      dispatch(disconnected(data));
    });

    webSocketService.on('error', (data) => {
      console.error('🔌 [Middleware] Error', data);
      dispatch(websocketError(data.error?.message || 'WebSocket error'));
    });

    webSocketService.on('reconnecting', (data) => {
      console.log('🔄 [Middleware] Reconnecting', data);
      dispatch(reconnecting(data));
    });

    webSocketService.on('rooms_list', (rooms) => {
      console.log('📦 [Middleware] rooms_list', rooms);
      if (Array.isArray(rooms)) {
        dispatch(setRooms(rooms));
      }
    });

    webSocketService.on('user_joined', (data) => {
      console.log('👤 [Middleware] user_joined', data);
      if (data) {
        dispatch(userJoined(data));
        if (data.room_id) {
          dispatch(addChatRoom(data.room_id));
        }
      }
    });

    webSocketService.on('user_left', (data) => {
      console.log('👋 [Middleware] user_left', data);
      if (data) {
        dispatch(userLeft(data));
      }
    });

    webSocketService.on('game_started', (data) => {
      console.log('🎮 [Middleware] game_started', data);
      if (data) {
        dispatch(gameStatusChanged({
          room_id: data.room_id,
          game_active: true,
          current_word: data.current_word
        }));
      }
    });

    webSocketService.on('game_ended', (data) => {
      console.log('🏁 [Middleware] game_ended', data);
      if (data) {
        dispatch(gameStatusChanged({
          room_id: data.room_id,
          game_active: false,
          current_word: null
        }));
      }
    });

    webSocketService.on('word_changed', (data) => {
      console.log('📝 [Middleware] word_changed', data);
      if (data) {
        dispatch(gameStatusChanged({
          room_id: data.room_id,
          game_active: true,
          current_word: data.current_word
        }));
      }
    });

    webSocketService.on('new_message', (message) => {
      console.log('💬 [Middleware] new_message', message);
      if (message) {
        dispatch(addMessage(message));
      }
    });

    webSocketService.on('message_history', (data) => {
      console.log('📜 [Middleware] message_history', data);
      if (data && data.room_id) {
        dispatch(setMessagesHistory({
          room_id: data.room_id,
          messages: data.messages || []
        }));
        dispatch(setLoading({ roomId: data.room_id, isLoading: false }));
      }
    });

    webSocketService.on('message_deleted', (data) => {
      console.log('🗑️ [Middleware] message_deleted', data);
      if (data) {
        dispatch(deleteMessage(data));
      }
    });

    webSocketService.on('message_updated', (data) => {
      console.log('✏️ [Middleware] message_updated', data);
      if (data) {
        dispatch(updateMessage(data));
      }
    });

    webSocketService.on('typing', (data) => {
      console.log('⌨️ [Middleware] typing', data);
      if (data) {
        dispatch(userTyping(data));
      }
    });

    webSocketService.on('leader_word', (data) => {
      console.log('🔤 [Middleware] leader_word', data);
      if (data && data.word) {
        const state = getState();
        const currentRoom = (state as any).rooms?.selectedRoom;
        if (currentRoom) {
          dispatch(updateRoom({
            ...currentRoom,
            current_word: data.word
          }));
        }
      }
    });
  };

  setupListeners();

  return (next) => (action) => {
    // Отправка сообщений через WebSocket
    switch (action.type) {
      case 'chat/sendMessage':
        webSocketService.emitEvent('new_message', action.payload);
        console.log('📤 [Middleware] sendMessage', action.payload);
        break;
      case 'chat/requestHistory':
        webSocketService.emitEvent('request_history', action.payload);
        console.log('📤 [Middleware] requestHistory', action.payload);
        break;
      case 'rooms/joinRoom':
        webSocketService.emitEvent('user_joined', action.payload);
        console.log('📤 [Middleware] joinRoom', action.payload);
        break;
      case 'rooms/leaveRoom':
        webSocketService.emitEvent('user_left', action.payload);
        console.log('📤 [Middleware] leaveRoom', action.payload);
        break;
      case 'rooms/createRoom':
        webSocketService.emitEvent('room_created', action.payload);
        console.log('📤 [Middleware] createRoom', action.payload);
        break;
      case 'game/startGame':
        webSocketService.emitEvent('start_game', action.payload);
        console.log('📤 [Middleware] startGame', action.payload);
        break;
      case 'game/makeGuess':
        webSocketService.emitEvent('make_guess', action.payload);
        console.log('📤 [Middleware] makeGuess', action.payload);
        break;
      case 'chat/sendTyping':
        webSocketService.emitEvent('typing', action.payload);
        break;
      default:
        break;
    }

    return next(action);
  };
};