import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export interface Room {
  id: string;
  name: string;
  description: string;
  capacity: number;
  owner_id:string;
  current_users: number;
  created_at: string;
  updated_at: string;
  leader_id: string | null;
  current_word: string | null;
  game_active: boolean;
  users?: string[];
}

export interface UserJoinedPayload {
  room_id: string;
  user_id: string;
  user_name: string;
  user_count: number;
  users?: string[];
  leader_id?: string;
  game_active?: boolean;
}

export interface UserLeftPayload {
  room_id: string;
  user_id: string;
  user_name: string;
  user_count: number;
  users?: string[];
  leader_id?: string;
}

interface RoomsState {
  rooms: Room[];
  selectedRoom: Room | null;
  currentRoomId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: RoomsState = {
  rooms: [],
  selectedRoom: null,
  currentRoomId: null,
  isLoading: false,
  error: null,
};

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    // Инициализация комнат
    setRooms: (state, action: PayloadAction<Room[]>) => {
      console.log('📦 [roomsSlice] setRooms:', action.payload.length, 'rooms');
      state.rooms = action.payload;
      state.isLoading = false;
      state.error = null;
    },

    // Пользователь присоединился
    userJoined: (state, action: PayloadAction<UserJoinedPayload>) => {
      console.log('👤 [roomsSlice] userJoined:', action.payload.user_name);
      const room = state.rooms.find(r => r.id === action.payload.room_id);
      if (room) {
        room.current_users = action.payload.user_count;
        if (action.payload.users) {
          room.users = action.payload.users;
        }
        if (action.payload.leader_id) {
          room.leader_id = action.payload.leader_id;
        }
        if (action.payload.game_active !== undefined) {
          room.game_active = action.payload.game_active;
        }
      }
      
      if (state.selectedRoom?.id === action.payload.room_id) {
        state.selectedRoom.current_users = action.payload.user_count;
        if (action.payload.users) {
          state.selectedRoom.users = action.payload.users;
        }
        if (action.payload.leader_id) {
          state.selectedRoom.leader_id = action.payload.leader_id;
        }
        if (action.payload.game_active !== undefined) {
          state.selectedRoom.game_active = action.payload.game_active;
        }
      }
    },

    // Пользователь вышел
    userLeft: (state, action: PayloadAction<UserLeftPayload>) => {
      console.log('👋 [roomsSlice] userLeft:', action.payload.user_name);
      const room = state.rooms.find(r => r.id === action.payload.room_id);
      if (room) {
        room.current_users = action.payload.user_count;
        if (action.payload.users) {
          room.users = action.payload.users;
        }
        if (action.payload.leader_id) {
          room.leader_id = action.payload.leader_id;
        }
      }
      
      if (state.selectedRoom?.id === action.payload.room_id) {
        state.selectedRoom.current_users = action.payload.user_count;
        if (action.payload.users) {
          state.selectedRoom.users = action.payload.users;
        }
        if (action.payload.leader_id) {
          state.selectedRoom.leader_id = action.payload.leader_id;
        }
      }
    },

    // Обновление статуса игры
    gameStatusChanged: (state, action: PayloadAction<{ room_id: string; game_active: boolean; current_word?: string | null }>) => {
      console.log('🎮 [roomsSlice] gameStatusChanged:', action.payload);
      const room = state.rooms.find(r => r.id === action.payload.room_id);
      if (room) {
        room.game_active = action.payload.game_active;
        if (action.payload.current_word !== undefined) {
          room.current_word = action.payload.current_word;
        }
      }
      
      if (state.selectedRoom?.id === action.payload.room_id) {
        state.selectedRoom.game_active = action.payload.game_active;
        if (action.payload.current_word !== undefined) {
          state.selectedRoom.current_word = action.payload.current_word;
        }
      }
    },

    // Выбор комнаты
    selectRoom: (state, action: PayloadAction<Room>) => {
      console.log('🎯 [roomsSlice] selectRoom:', action.payload.id);
      state.selectedRoom = action.payload;
    },

    // Установка текущей комнаты
    setCurrentRoom: (state, action: PayloadAction<string | null>) => {
      console.log('🔌 [roomsSlice] setCurrentRoom:', action.payload);
      state.currentRoomId = action.payload;
    },

    // Очистка выбранной комнаты
    clearSelectedRoom: (state) => {
      console.log('🧹 [roomsSlice] clearSelectedRoom');
      state.selectedRoom = null;
      state.currentRoomId = null;
    },

    clearError: (state) => {
      state.error = null;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

// Экспорт действий
export const {
  setRooms,
  userJoined,
  userLeft,
  gameStatusChanged,
  selectRoom,
  setCurrentRoom,
  clearSelectedRoom,
  clearError,
  setLoading,
  setError,
} = roomsSlice.actions;

export const selectAllRooms = (state: { rooms: RoomsState }) => state.rooms.rooms;
export const selectCurrentRoom = (state: { rooms: RoomsState }) => state.rooms.selectedRoom;
export const selectCurrentRoomId = (state: { rooms: RoomsState }) => state.rooms.currentRoomId;
export const selectRoomsLoading = (state: { rooms: RoomsState }) => state.rooms.isLoading;
export const selectRoomsError = (state: { rooms: RoomsState }) => state.rooms.error;

export const selectRoomById = (state: { rooms: RoomsState }, roomId: string) => {
  return state.rooms.rooms.find(room => room.id === roomId);
};
export default roomsSlice.reducer;