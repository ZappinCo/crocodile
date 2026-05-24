// src/features/chatSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { webSocketService, WebSocketEventType } from '../services/websocketService';

// ========== ТИПЫ ==========

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  text: string;
  timestamp: string;
  isGuess?: boolean;
}

export interface RoomInfo {
  id: string;
  name: string;
  description: string;
  capacity: number;
  current_users: number;
  leader_id: string | null;
  current_word: string | null;
  game_active: boolean;
  scores: Record<string, number>;
}

export interface ChatState {
  roomId: string;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  roomInfo: RoomInfo | null;
}

interface ChatListState {
  list: Record<string, ChatState>;
  activeRoomId: string | null;
}

// ========== НАЧАЛЬНОЕ СОСТОЯНИЕ ==========

const initialState: ChatListState = {
  list: {},
  activeRoomId: null
};

// ========== СЛАЙС ==========

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addChatRoom: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      if (!state.list[roomId]) {
        state.list[roomId] = {
          roomId,
          messages: [],
          isLoading: false,
          error: null,
          roomInfo: null
        };
        console.log(`📱 [chatSlice] Added chat room: ${roomId}`);
      }
    },

    setActiveRoom: (state, action: PayloadAction<string | null>) => {
      state.activeRoomId = action.payload;
      console.log(`📱 [chatSlice] Active room set to: ${action.payload}`);
    },

    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      if (state.list[message.roomId]) {
        // Проверяем на дубликаты
        const exists = state.list[message.roomId].messages.some(
          msg => msg.id === message.id
        );
        if (!exists) {
          state.list[message.roomId].messages.push(message);
          console.log(`📨 [chatSlice] Added message to room ${message.roomId}`);
        }
      } else {
        // Создаем комнату если её нет
        state.list[message.roomId] = {
          roomId: message.roomId,
          messages: [message],
          isLoading: false,
          error: null,
          roomInfo: null
        };
        console.log(`📨 [chatSlice] Created room and added message: ${message.roomId}`);
      }
    },

    addMessages: (state, action: PayloadAction<{ roomId: string; messages: Message[]; prepend?: boolean }>) => {
      const { roomId, messages, prepend = false } = action.payload;
      
      if (!state.list[roomId]) {
        state.list[roomId] = {
          roomId,
          messages: [],
          isLoading: false,
          error: null,
          roomInfo: null
        };
      }
      
      // Фильтруем дубликаты
      const existingIds = new Set(state.list[roomId].messages.map(m => m.id));
      const newMessages = messages.filter(m => !existingIds.has(m.id));
      
      if (newMessages.length > 0) {
        if (prepend) {
          state.list[roomId].messages = [...newMessages, ...state.list[roomId].messages];
        } else {
          state.list[roomId].messages = [...state.list[roomId].messages, ...newMessages];
        }
        console.log(`📜 [chatSlice] Added ${newMessages.length} messages to room ${roomId}`);
      }
    },

    setMessagesHistory: (state, action: PayloadAction<{ room_id: string; messages: Message[] }>) => {
      const { room_id, messages } = action.payload;
      if (state.list[room_id]) {
        state.list[room_id].messages = messages;
        state.list[room_id].isLoading = false;
        console.log(`📜 [chatSlice] Set history for room ${room_id}: ${messages.length} messages`);
      }
    },

    updateRoomInfo: (state, action: PayloadAction<RoomInfo>) => {
      const roomInfo = action.payload;
      if (state.list[roomInfo.id]) {
        state.list[roomInfo.id].roomInfo = roomInfo;
        console.log(`🏠 [chatSlice] Updated room info for ${roomInfo.id}`);
      }
    },

    setLoading: (state, action: PayloadAction<{ roomId: string; isLoading: boolean }>) => {
      const { roomId, isLoading } = action.payload;
      if (state.list[roomId]) {
        state.list[roomId].isLoading = isLoading;
        console.log(`⏳ [chatSlice] Set loading for room ${roomId}: ${isLoading}`);
      }
    },

    setError: (state, action: PayloadAction<{ roomId: string; error: string | null }>) => {
      const { roomId, error } = action.payload;
      if (state.list[roomId]) {
        state.list[roomId].error = error;
        state.list[roomId].isLoading = false;
        console.log(`❌ [chatSlice] Set error for room ${roomId}: ${error}`);
      }
    },

    removeChatRoom: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      delete state.list[roomId];
      if (state.activeRoomId === roomId) {
        state.activeRoomId = null;
      }
      console.log(`🗑️ [chatSlice] Removed chat room: ${roomId}`);
    },

    updateUsersInRoom: (state, action: PayloadAction<{ roomId: string; users: string[]; leader_id: string | null; game_active: boolean }>) => {
      const { roomId, users, leader_id, game_active } = action.payload;
      if (state.list[roomId] && state.list[roomId].roomInfo) {
        state.list[roomId].roomInfo!.current_users = users.length;
        state.list[roomId].roomInfo!.leader_id = leader_id;
        state.list[roomId].roomInfo!.game_active = game_active;
        console.log(`👥 [chatSlice] Updated users in room ${roomId}: ${users.length} players`);
      }
    },

    clearChatRoom: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      if (state.list[roomId]) {
        state.list[roomId].messages = [];
        state.list[roomId].error = null;
        console.log(`🧹 [chatSlice] Cleared chat room: ${roomId}`);
      }
    },

    deleteMessage: (state, action: PayloadAction<{ roomId: string; messageId: string }>) => {
      const { roomId, messageId } = action.payload;
      if (state.list[roomId]) {
        state.list[roomId].messages = state.list[roomId].messages.filter(
          msg => msg.id !== messageId
        );
        console.log(`🗑️ [chatSlice] Deleted message ${messageId} from room ${roomId}`);
      }
    },

    updateMessage: (state, action: PayloadAction<{ roomId: string; messageId: string; text: string }>) => {
      const { roomId, messageId, text } = action.payload;
      if (state.list[roomId]) {
        const message = state.list[roomId].messages.find(msg => msg.id === messageId);
        if (message) {
          message.text = text;
          message.timestamp = new Date().toISOString();
          console.log(`✏️ [chatSlice] Updated message ${messageId} in room ${roomId}`);
        }
      }
    }
  }
});

// ========== ЭКСПОРТ ДЕЙСТВИЙ ==========

export const {
  addChatRoom,
  setActiveRoom,
  addMessage,
  addMessages,
  setMessagesHistory,
  updateRoomInfo,
  setLoading,
  setError,
  removeChatRoom,
  updateUsersInRoom,
  clearChatRoom,
  deleteMessage,
  updateMessage
} = chatSlice.actions;

// ========== WEB SOCKET ЭМИТТЕРЫ ==========

export const emitSendMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
  console.log(`📤 [WS] Sending message to room ${message.roomId}:`, message.text);
  webSocketService.emitEvent(WebSocketEventType.NEW_MESSAGE, message);
};

export const emitRequestHistory = (roomId: string) => {
  console.log(`📜 [WS] Requesting history for room ${roomId}`);
  webSocketService.emitEvent(WebSocketEventType.REQUEST_HISTORY, { roomId });
};

export const emitDeleteMessage = (roomId: string, messageId: string) => {
  console.log(`🗑️ [WS] Deleting message ${messageId} in room ${roomId}`);
  webSocketService.emitEvent(WebSocketEventType.DELETE_MESSAGE, { roomId, messageId });
};

export const emitUpdateMessage = (roomId: string, messageId: string, text: string) => {
  console.log(`✏️ [WS] Updating message ${messageId} in room ${roomId}`);
  webSocketService.emitEvent(WebSocketEventType.UPDATE_MESSAGE, { roomId, messageId, text });
};

// ========== СЕЛЕКТОРЫ ==========

/**
 * Получить все чаты
 */
export const selectAllChats = (state: { chat: ChatListState }) => state.chat.list;

/**
 * Получить чат по ID комнаты
 */
export const selectChatByRoomId = (state: { chat: ChatListState }, roomId: string) => 
  state.chat.list[roomId];

/**
 * Получить сообщения для комнаты
 * @param state - состояние Redux
 * @param roomId - ID комнаты
 * @returns массив сообщений
 */
export const selectMessagesByRoomId = (state: { chat: ChatListState }, roomId: string) => 
  state.chat.list[roomId]?.messages || [];

/**
 * Получить статус загрузки для комнаты
 * @param state - состояние Redux
 * @param roomId - ID комнаты
 * @returns boolean - true если идет загрузка
 */
export const selectIsLoadingByRoomId = (state: { chat: ChatListState }, roomId: string) => 
  state.chat.list[roomId]?.isLoading || false;

/**
 * Получить ошибку для комнаты
 * @param state - состояние Redux
 * @param roomId - ID комнаты
 * @returns строка с ошибкой или null
 */
export const selectErrorByRoomId = (state: { chat: ChatListState }, roomId: string) => 
  state.chat.list[roomId]?.error || null;

/**
 * Получить информацию о комнате
 */
export const selectRoomInfoByRoomId = (state: { chat: ChatListState }, roomId: string) => 
  state.chat.list[roomId]?.roomInfo || null;

/**
 * Получить активную комнату
 */
export const selectActiveRoomId = (state: { chat: ChatListState }) => state.chat.activeRoomId;

/**
 * Получить последнее сообщение в комнате
 */
export const selectLastMessageByRoomId = (state: { chat: ChatListState }, roomId: string) => {
  const messages = selectMessagesByRoomId(state, roomId);
  return messages.length > 0 ? messages[messages.length - 1] : null;
};

/**
 * Получить количество сообщений в комнате
 */
export const selectMessageCountByRoomId = (state: { chat: ChatListState }, roomId: string) => 
  selectMessagesByRoomId(state, roomId).length;

/**
 * Получить сообщения пользователя в комнате
 */
export const selectMessagesByUserId = (
  state: { chat: ChatListState }, 
  roomId: string, 
  userId: string
) => selectMessagesByRoomId(state, roomId).filter(msg => msg.userId === userId);

/**
 * Получить список ID всех комнат с чатами
 */
export const selectChatRoomIds = (state: { chat: ChatListState }) => 
  Object.keys(state.chat.list);

/**
 * Проверить, существует ли комната в чате
 */
export const selectHasChatRoom = (state: { chat: ChatListState }, roomId: string) => 
  !!state.chat.list[roomId];

/**
 * Получить сообщения с группировкой по датам
 */
export const selectMessagesGroupedByDate = (state: { chat: ChatListState }, roomId: string) => {
  const messages = selectMessagesByRoomId(state, roomId);
  const groups: { [date: string]: Message[] } = {};
  
  messages.forEach(message => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });
  
  return groups;
};

/**
 * Получить только сообщения-попытки угадать слово
 */
export const selectGuessMessages = (state: { chat: ChatListState }, roomId: string) => 
  selectMessagesByRoomId(state, roomId).filter(msg => msg.isGuess === true);

/**
 * Получить только обычные сообщения (не попытки угадать)
 */
export const selectRegularMessages = (state: { chat: ChatListState }, roomId: string) => 
  selectMessagesByRoomId(state, roomId).filter(msg => !msg.isGuess);

// ========== НАСТРОЙКА WEB SOCKET ПОДПИСОК ==========

export const setupChatWebSocketSubscriptions = (dispatch: any) => {
  console.log('🔌 Setting up chat WebSocket subscriptions...');
  
  // Подписка на новые сообщения
  webSocketService.subscribe(WebSocketEventType.NEW_MESSAGE, (data: Message) => {
    console.log('📨 [WS] NEW_MESSAGE received:', data);
    dispatch(addMessage(data));
  });

  // Подписка на историю сообщений
  webSocketService.subscribe(WebSocketEventType.MESSAGE_HISTORY, (data: { room_id: string; messages: Message[] }) => {
    console.log('📜 [WS] MESSAGE_HISTORY received:', data.room_id, data.messages?.length);
    dispatch(setMessagesHistory(data));
  });

  // Подписка на обновление комнаты
  webSocketService.subscribe(WebSocketEventType.ROOM_UPDATE, (data: RoomInfo) => {
    console.log('🏠 [WS] ROOM_UPDATE received:', data);
    dispatch(updateRoomInfo(data));
  });

  // Подписка на удаление сообщения
  webSocketService.subscribe(WebSocketEventType.MESSAGE_DELETED, (data: { roomId: string; messageId: string }) => {
    console.log('🗑️ [WS] MESSAGE_DELETED received:', data);
    dispatch(deleteMessage(data));
  });

  // Подписка на обновление сообщения
  webSocketService.subscribe(WebSocketEventType.MESSAGE_UPDATED, (data: { roomId: string; messageId: string; text: string }) => {
    console.log('✏️ [WS] MESSAGE_UPDATED received:', data);
    dispatch(updateMessage(data));
  });

  // Подписка на события пользователей
  webSocketService.subscribe("user_joined", (data: { room_id: string; user_id: string; users: string[]; leader_id: string; game_active: boolean }) => {
    console.log('👤 [WS] USER_JOINED received:', data);
    dispatch(updateUsersInRoom({
      roomId: data.room_id,
      users: data.users,
      leader_id: data.leader_id,
      game_active: data.game_active
    }));
  });

  webSocketService.subscribe("user_left", (data: { room_id: string; user_id: string; users: string[]; leader_id: string }) => {
    console.log('👋 [WS] USER_LEFT received:', data);
    dispatch(updateUsersInRoom({
      roomId: data.room_id,
      users: data.users,
      leader_id: data.leader_id,
      game_active: true
    }));
  });
  
  console.log('✅ Chat WebSocket subscriptions ready');
};

// ========== ЭКСПОРТ РЕДЮСЕРА ==========

export default chatSlice.reducer;