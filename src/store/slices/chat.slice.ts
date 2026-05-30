// src/store/slices/chat.slice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from './user.slice';
export interface Message {
  id: string;
  roomId: string;
  userId: string;
  text: string;
  timestamp: string;
  isGuess?: boolean;
}

interface ChatRoomState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  lastReadId: string | null;
}

interface ChatState {
  rooms: Record<string, ChatRoomState>;
  activeRoomId: string | null;
  typingUsers: Record<string, string[]>;
}

const initialState: ChatState = {
  rooms: {},
  activeRoomId: null,
  typingUsers: {},
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Добавление комнаты чата
    addChatRoom: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      console.log(`📱 [chatSlice] try to add chat room: ${roomId}`);
      if (!state.rooms[roomId]) {
        state.rooms[roomId] = {
          messages: [],
          isLoading: false,
          error: null,
          lastReadId: null,
        };
        console.log(`📱 [chatSlice] Added chat room: ${roomId}`);
      }
    },

    // Установка активной комнаты
    setActiveRoom: (state, action: PayloadAction<string | null>) => {
      state.activeRoomId = action.payload;
      console.log(`📱 [chatSlice] Active room set to: ${action.payload}`);
    },

    // Добавление сообщения
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      console.log("addMessage",message)
      if (!state.rooms[message.roomId]) {
        state.rooms[message.roomId] = {
          messages: [],
          isLoading: false,
          error: null,
          lastReadId: null,
        };
      }

      const exists = state.rooms[message.roomId].messages.some(
        msg => msg.id === message.id
      );

      if (!exists) {
        state.rooms[message.roomId].messages.push(message);
        console.log(`📨 [chatSlice] Added message to room ${message.roomId}`);
      }
    },

    // Добавление нескольких сообщений
    addMessages: (state, action: PayloadAction<{ roomId: string; messages: Message[]; prepend?: boolean }>) => {
      console.log("add messafes/*/*")
      const { roomId, messages, prepend = false } = action.payload;
      
      if (!state.rooms[roomId]) {
        state.rooms[roomId] = {
          messages: [],
          isLoading: false,
          error: null,
          lastReadId: null,
        };
      }
      
      const existingIds = new Set(state.rooms[roomId].messages.map(m => m.id));
      const newMessages = messages.filter(m => !existingIds.has(m.id));
      
      if (newMessages.length > 0) {
        if (prepend) {
          state.rooms[roomId].messages = [...newMessages, ...state.rooms[roomId].messages];
        } else {
          state.rooms[roomId].messages = [...state.rooms[roomId].messages, ...newMessages];
        }
        console.log(`📜 [chatSlice] Added ${newMessages.length} messages to room ${roomId}`);
      }
    },

    // Установка истории сообщений
    setMessagesHistory: (state, action: PayloadAction<{ room_id: string; messages: Message[] }>) => {
      const { room_id, messages } = action.payload;
      addChatRoom(room_id);
      if (state.rooms[room_id]) {
        state.rooms[room_id].messages = messages;
        state.rooms[room_id].isLoading = false;
        console.log(`📜 [chatSlice] Set history for room ${room_id}: ${messages.length} messages`);
      }
    },

    // Установка загрузки
    setLoading: (state, action: PayloadAction<{ roomId: string; isLoading: boolean }>) => {
      const { roomId, isLoading } = action.payload;
      if (state.rooms[roomId]) {
        state.rooms[roomId].isLoading = isLoading;
        console.log(`⏳ [chatSlice] Set loading for room ${roomId}: ${isLoading}`);
      }
    },

    // Установка ошибки
    setError: (state, action: PayloadAction<{ roomId: string; error: string | null }>) => {
      const { roomId, error } = action.payload;
      if (state.rooms[roomId]) {
        state.rooms[roomId].error = error;
        state.rooms[roomId].isLoading = false;
        console.log(`❌ [chatSlice] Set error for room ${roomId}: ${error}`);
      }
    },

    // Очистка сообщений в комнате
    clearMessages: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      if (state.rooms[roomId]) {
        state.rooms[roomId].messages = [];
        console.log(`🧹 [chatSlice] Cleared messages for room ${roomId}`);
      }
    },

    // Удаление комнаты чата
    removeChatRoom: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      delete state.rooms[roomId];
      if (state.activeRoomId === roomId) {
        state.activeRoomId = null;
      }
      console.log(`🗑️ [chatSlice] Removed chat room: ${roomId}`);
    },

    // Удаление сообщения
    deleteMessage: (state, action: PayloadAction<{ roomId: string; messageId: string }>) => {
      const { roomId, messageId } = action.payload;
      if (state.rooms[roomId]) {
        state.rooms[roomId].messages = state.rooms[roomId].messages.filter(
          msg => msg.id !== messageId
        );
        console.log(`🗑️ [chatSlice] Deleted message ${messageId} from room ${roomId}`);
      }
    },

    // Обновление сообщения
    updateMessage: (state, action: PayloadAction<{ roomId: string; messageId: string; text: string }>) => {
      const { roomId, messageId, text } = action.payload;
      if (state.rooms[roomId]) {
        const message = state.rooms[roomId].messages.find(msg => msg.id === messageId);
        if (message) {
          message.text = text;
          message.timestamp = new Date().toISOString();
          console.log(`✏️ [chatSlice] Updated message ${messageId} in room ${roomId}`);
        }
      }
    },

    // Пользователь печатает
    userTyping: (state, action: PayloadAction<{ roomId: string; userId: string; isTyping: boolean }>) => {
      const { roomId, userId, isTyping } = action.payload;
      
      if (!state.typingUsers[roomId]) {
        state.typingUsers[roomId] = [];
      }
      
      if (isTyping && !state.typingUsers[roomId].includes(userId)) {
        state.typingUsers[roomId].push(userId);
      } else if (!isTyping) {
        state.typingUsers[roomId] = state.typingUsers[roomId].filter(id => id !== userId);
      }
    },

    // Очистка статуса печатания
    clearTypingUsers: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      if (state.typingUsers[roomId]) {
        state.typingUsers[roomId] = [];
      }
    },
  },
});

// Действия с мета-данными для WebSocket
export const sendMessage = (message: string, roomId:string, user:User) => ({
  type: 'chat/sendMessage',
  payload: {
    text:message,
    roomId:roomId,
    userName:user.username,
    userId:user.id
  },
  meta: { webSocket: true, event: 'new_message' }
});

export const requestHistory = (roomId: string) => ({
  type: 'chat/requestHistory',
  payload: { roomId },
  meta: { webSocket: true, event: 'request_history' }
});

export const sendTyping = (roomId: string, isTyping: boolean) => ({
  type: 'chat/sendTyping',
  payload: { roomId, isTyping },
  meta: { webSocket: true, event: 'typing' }
});

export const {
  addChatRoom,
  setActiveRoom,
  addMessage,
  addMessages,
  setMessagesHistory,
  setLoading,
  setError,
  clearMessages,
  removeChatRoom,
  deleteMessage,
  updateMessage,
  userTyping,
  clearTypingUsers,
} = chatSlice.actions;

// Селекторы
export const selectChatRooms = (state: { chat: ChatState }) => state.chat.rooms;
export const selectChatByRoomId = (state: { chat: ChatState }, roomId: string) => state.chat.rooms[roomId];
export const selectMessagesByRoomId = (state: { chat: ChatState }, roomId: string) => 
  state.chat.rooms[roomId]?.messages || [];
export const selectIsLoadingByRoomId = (state: { chat: ChatState }, roomId: string) => 
  state.chat.rooms[roomId]?.isLoading || false;
export const selectErrorByRoomId = (state: { chat: ChatState }, roomId: string) => 
  state.chat.rooms[roomId]?.error || null;
export const selectActiveRoomId = (state: { chat: ChatState }) => state.chat.activeRoomId;
export const selectTypingUsers = (state: { chat: ChatState }, roomId: string) => 
  state.chat.typingUsers[roomId] || [];

export default chatSlice.reducer;