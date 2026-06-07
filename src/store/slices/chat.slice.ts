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

    setActiveRoom: (state, action: PayloadAction<string | null>) => {
      state.activeRoomId = action.payload;
    },

    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      if (state.activeRoomId != message.roomId) {
        return;
      }
      state.messages.push(message);
    },

    setMessagesHistory: (state, action: PayloadAction<{ room_id: string; messages: Message[] }>) => {
      const { room_id, messages } = action.payload;
      if (state.activeRoomId != room_id) {
        return;
      }
      state.messages = messages;
      state.isLoading = false;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

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

export const selectActiveRoomId = (state: { chat: ChatState }) => state.chat.activeRoomId;
export const selectMessages = (state: { chat: ChatState }) => state.chat.messages;
export const selectIsLoading = (state: { chat: ChatState }) => state.chat.isLoading;
export default chatSlice.reducer;