import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export interface Room {
  id: string;
  name: string;
  description: string;
  capacity: number;
  owner_id: string;
  current_users: number;
  created_at: string;
  updated_at: string;
  leader_id: string | null;
  current_word: string | null;
  game_active: boolean;
  users?: string[];
}

export interface UserMovePayload {
  room_id: string;
  user_id: string;
  user_name: string;
}

export interface RoomCreatePayload {
  room_id: string | null;
  name: string;
  description: string | null;
  capacity: number;
  creator_id: string;
  creator_name: string;
}

interface RoomsState {
  rooms: Room[];
  selectedRoom: Room | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: RoomsState = {
  rooms: [],
  selectedRoom: null,
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
    userJoined: (state, action: PayloadAction<UserMovePayload>) => {
      console.log('👤 [roomsSlice] userJoined:', action.payload.user_name);
      const room = state.rooms.find(r => r.id === action.payload.room_id);
      if (room) {
        state.selectedRoom = room;
      }
    },

    // Пользователь вышел
    userLeft: (state, action: PayloadAction<UserMovePayload>) => {
      console.log('👋 [roomsSlice] userLeft:', action.payload.user_name);
      const room = state.rooms.find(r => r.id === action.payload.room_id);
      if (room === state.selectedRoom) {
        state.selectedRoom = null;
      }
    },

    deleteRoom: (state, action: PayloadAction<string>) => {
      console.log('🎮 [roomsSlice] deleteRoom:', action.payload);
      state.rooms = state.rooms.filter(room => room.id !== action.payload);
      if (state.selectedRoom?.id === action.payload) {
        state.selectedRoom = null;
      }
    },

    updateRoom: (state, action: PayloadAction<RoomCreatePayload>) => {
      console.log('🎮 [roomsSlice] updateRoom:', action.payload);
    },

    createRoom: (state, action: PayloadAction<RoomCreatePayload>) => {
      console.log('🎮 [roomsSlice] createRoom:', action.payload);
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
  deleteRoom,
  createRoom,
  updateRoom,
  gameStatusChanged,
  clearError,
  setLoading,
  setError,
} = roomsSlice.actions;

export const selectAllRooms = (state: { rooms: RoomsState }) => state.rooms.rooms;
export const selectCurrentRoom = (state: { rooms: RoomsState }) => state.rooms.selectedRoom;
export const selectRoomsLoading = (state: { rooms: RoomsState }) => state.rooms.isLoading;
export const selectRoomsError = (state: { rooms: RoomsState }) => state.rooms.error;

export const selectRoomById = (state: { rooms: RoomsState }, roomId: string) => {
  return state.rooms.rooms.find(room => room.id === roomId);
};

export default roomsSlice.reducer;