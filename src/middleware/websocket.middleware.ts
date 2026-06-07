import type { Middleware, UnknownAction } from '@reduxjs/toolkit';
import { webSocketService } from '../services/websocket.service';
import { connected, disconnected, websocketError, reconnecting } from '../store/slices/websocket.slice';
import { setRooms, updateRoom, } from '../store/slices/rooms.slice';
import { addMessage, setMessagesHistory, setLoading } from '../store/slices/chat.slice';
import { addStroke, setStrokes } from '../store/slices/drawing.slice';



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
      console.log("webSocketService.on('new_message'", message)
      if (message) {
        dispatch(addMessage(message));
      }
    });

    webSocketService.on('draw_stroke', (message) => {
      const state = getState()
      const usesId = state.user.id;
      if (message["userId"] === usesId)
        return;

      if (message) {
        dispatch(addStroke(message));
      }
    });


    webSocketService.on('set_strokes', (message) => {
      if (message) {
        dispatch(setStrokes(message.strokes));
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


  const checkCurrentUserStroke = (payload: any) => {
    const state = getState();
    const result = { ...payload };
    const usesId = state.user.id;
    if (result["userId"] === usesId)
      return ({
        needSend: false,
        result: null
      });
    result["userId"] = usesId
    result["roomId"] = state.rooms.selectedRoomId
    return ({
      needSend: true,
      result: result
    });
  }

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
        {
          const { needSend, result } = checkCurrentUserStroke(action.payload);
          if (needSend)
            webSocketService.emitEvent('add_stroke', result);
          break;
        }

      case 'drawing/sendStroke':
        {
          const { needSend, result } = checkCurrentUserStroke(action.payload);
          if (needSend)
            webSocketService.emitEvent('add_stroke', result);
          break;
        }

      case 'drawing/redoStroke':
      case 'drawing/undoStroke':
      case 'drawing/clearCanvas':
        {
          const state = getState();
          const { needSend, result } = checkCurrentUserStroke(state.drawing.strokes);
          if (needSend)
            webSocketService.emitEvent('set_strokes', result);
          break;
        }

      default:
        break;
    }

    return next(action);
  };
};