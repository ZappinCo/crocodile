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
  updateRoom,
  editRoom,
} from '../store/slices/rooms.slice';
import {
  addMessage,
  setMessagesHistory,
  setLoading,
} from '../store/slices/chat.slice';
import { store } from '../store';
import { addStroke } from '../store/slices/drawing.slice';

export const websocketMiddleware: Middleware = ({ dispatch, getState }) => {
  const setupListeners = () => {
    webSocketService.on('connect', (data) => {
      dispatch(connected(data));
    });

    webSocketService.on('disconnect', (data) => {
      dispatch(disconnected(data));
    });

    webSocketService.on('error', (data) => {
      dispatch(websocketError(data.error?.message || 'WebSocket error'));
    });

    webSocketService.on('reconnecting', (data) => {
      dispatch(reconnecting(data));
    });

    webSocketService.on('rooms_list', (rooms) => {
      if (Array.isArray(rooms)) {
        dispatch(setRooms(rooms));
      }
    });

    webSocketService.on('new_message', (message) => {
      if (message) {
        dispatch(addMessage(message));
      }
    });

    webSocketService.on('draw_stroke', (message) => {
      if (message) {
        dispatch(addStroke(message));
      }
    });

    webSocketService.on('message_history', (data) => {
      if (data && data.room_id) {
        dispatch(setMessagesHistory({
          room_id: data.room_id,
          messages: data.messages || []
        }));
        dispatch(setLoading(false));
      }
    });


    webSocketService.on('room_update', (data) => {
      dispatch(updateRoom(data));
    });
  };

  setupListeners();

  return (next) => (action) => {
    switch (action.type) {
      case 'chat/sendMessage':
        webSocketService.emitEvent('new_message', action.payload);
        break;
      case 'chat/requestHistory':
        webSocketService.emitEvent('request_history', action.payload);
        break;
      case 'rooms/userJoined':
        webSocketService.emitEvent('user_joined', action.payload);
        break;
      case 'rooms/userLeft':
        webSocketService.emitEvent('user_left', action.payload);
        break;
      case 'rooms/createRoom':
        webSocketService.emitEvent('create_room', action.payload);
        break;
      case 'rooms/editRoom':
        webSocketService.emitEvent('edit_room', action.payload);
        break;
      case 'rooms/deleteRoom':
        webSocketService.emitEvent('delete_room', action.payload);
        break;
      case 'drawing/addStroke':
        const state = getState();
        let result = action.payload;
        const usesId = state.user.id;
        if(result["userId"] === usesId)
          return;
        result["userId"] = usesId
        result["roomId"] = state.rooms.selectedRoomId

        webSocketService.emitEvent('add_stroke', result);
        break;
      default:
        break;
    }

    return next(action);
  };
};