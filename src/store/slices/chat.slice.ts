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

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  activeRoomId: string | null;
}


const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  activeRoomId: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {

    // Установка активной комнаты
    setActiveRoom: (state, action: PayloadAction<string | null>) => {
      state.activeRoomId = action.payload;
      console.log(`📱 [chatSlice] Active room set to: ${action.payload}`);
    },

    // Добавление сообщения
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      console.log("addMessage", message)

      if (state.activeRoomId != message.roomId) {
        return;
      }

      state.messages.push(message);
      console.log(`📨 [chatSlice] Added message to room ${message.roomId}`);
    },

    // Установка истории сообщений
    setMessagesHistory: (state, action: PayloadAction<{ room_id: string; messages: Message[] }>) => {
      const { room_id, messages } = action.payload;
      console.log(`📜 [chatSlice] Set history for room ${room_id}: ${messages.length} messages`);

      if (state.activeRoomId != room_id) {
        return;
      }

      state.messages = messages;
      state.isLoading = false;
    },

    // Установка загрузки
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      console.log(`⏳ [chatSlice] Set loading for room `);
    },
  },
});

// Действия с мета-данными для WebSocket
export const sendMessage = (message: string, roomId: string, user: User) => ({
  type: 'chat/sendMessage',
  payload: {
    text: message,
    roomId: roomId,
    userName: user.username,
    userId: user.id
  },
  meta: { webSocket: true, event: 'new_message' }
});

export const requestHistory = (roomId: string) => ({
  type: 'chat/requestHistory',
  payload: { roomId },
  meta: { webSocket: true, event: 'request_history' }
});

export const {
  setActiveRoom,
  addMessage,
  setMessagesHistory,
  setLoading,
} = chatSlice.actions;

// Селекторы
export const selectActiveRoomId = (state: { chat: ChatState }) => state.chat.activeRoomId;
export const selectMessages = (state: { chat: ChatState }) => state.chat.messages;
export const selectIsLoading = (state: { chat: ChatState }) => state.chat.isLoading;
export default chatSlice.reducer;