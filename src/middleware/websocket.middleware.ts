import type { Middleware, UnknownAction } from '@reduxjs/toolkit';
import { webSocketService } from '../services/websocket.service';
import { connected, disconnected, websocketError, reconnecting } from '../store/slices/websocket.slice';
import { setRooms, updateRoom } from '../store/slices/rooms.slice';
import { addMessage, setMessagesHistory, setLoading } from '../store/slices/chat.slice';
import { addStroke, setStrokes } from '../store/slices/drawing.slice';
import type { Room } from '../store/slices/rooms.slice';
import type { Message } from '../store/slices/chat.slice';
import type { AddStrokePayload, Stroke } from '../store/slices/drawing.slice';

interface StrokeMessage extends AddStrokePayload {
  userId: string;
  roomId?: string;
}

export const websocketMiddleware: Middleware = ({ dispatch, getState }) => {
  const setupListeners = () => {
    webSocketService.on('connect', (data: { connected: boolean }) => {
      dispatch(connected(data));
    });

    webSocketService.on('disconnect', (data: { connected: boolean; code?: number; reason?: string }) => {
      dispatch(disconnected(data));
    });

    webSocketService.on('error', (data: { error?: { message?: string } }) => {
      dispatch(websocketError(data.error?.message || 'WebSocket error'));
    });

    webSocketService.on('reconnecting', (data: { attempt: number }) => {
      dispatch(reconnecting(data));
    });

    webSocketService.on('rooms_list', (rooms: Room[]) => {
      if (Array.isArray(rooms)) {
        dispatch(setRooms(rooms));
      }
    });

    webSocketService.on('new_message', (message: Message) => {
      console.log("webSocketService.on('new_message'", message);
      if (message) {
        dispatch(addMessage(message));
      }
    });

    webSocketService.on('draw_stroke', (message: StrokeMessage) => {
      const state = getState();
      const usesId = state.user.id;
      if (message.userId === usesId) return;
      if (message) {
        dispatch(addStroke(message));
      }
    });

    webSocketService.on('set_strokes', (message: { strokes: Stroke[] }) => {
      if (message) {
        dispatch(setStrokes(message.strokes));
      }
    });

    webSocketService.on('message_history', (data: { room_id: string; messages: Message[] }) => {
      if (data && data.room_id) {
        dispatch(setMessagesHistory({
          room_id: data.room_id,
          messages: data.messages || []
        }));
        dispatch(setLoading(false));
      }
    });

    webSocketService.on('room_update', (data: Room) => {
      dispatch(updateRoom(data));
    });
  };

  setupListeners();

  const checkCurrentUserStroke = (payload: Record<string, unknown>) => {
    const state = getState();
    const result = { ...payload };
    const usesId = state.user.id;
    if (result["userId"] === usesId) {
      return { needSend: false, result: null };
    }
    result["userId"] = usesId;
    result["roomId"] = state.rooms.selectedRoomId;
    return { needSend: true, result };
  };

  return (next) => (action: UnknownAction) => {
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
      case 'drawing/sendStroke': {
        const { needSend, result } = checkCurrentUserStroke(action.payload as Record<string, unknown>);
        if (needSend) webSocketService.emitEvent('add_stroke', result);
        break;
      }
      case 'drawing/redoStroke':
      case 'drawing/undoStroke':
      case 'drawing/clearCanvas': {
        const state = getState();
        const strokes = state.drawing.strokes;
        const payload = { strokes };
        const { needSend, result } = checkCurrentUserStroke(payload);
        if (needSend) webSocketService.emitEvent('set_strokes', result);
        break;
      }
      default:
        break;
    }
    return next(action);
  };
};