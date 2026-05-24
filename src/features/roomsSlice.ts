// src/features/roomsSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Room {
  id: string;
  name: string;
  description: string;
  capacity: number;
  current_users: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomDTO {
  name: string;
  description: string;
  capacity: number;
}

export interface UpdateRoomDTO {
  id: string;
  name?: string;
  description?: string;
  capacity?: number;
}

export interface UserJoinedPayload {
  room_id: string;
  user_id: string;
  user_count: number;
}

export interface UserLeftPayload {
  room_id: string;
  user_id: string;
  user_count: number;
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
    // Установка начального списка комнат
    setRooms: (state, action: PayloadAction<Room[]>) => {
      console.log('📦 [roomsSlice] setRooms:', action.payload.length, 'rooms');
      state.rooms = action.payload;
      state.isLoading = false;
      state.error = null;
    },

    // Обновление комнаты
    wsUpdateRoom: (state, action: PayloadAction<Room>) => {
      console.log('🔄 [roomsSlice] wsUpdateRoom:', action.payload.id);
      const index = state.rooms.findIndex(room => room.id === action.payload.id);
      if (index !== -1) {
        state.rooms[index] = action.payload;
      } else {
        state.rooms.push(action.payload);
      }
      
      if (state.selectedRoom?.id === action.payload.id) {
        state.selectedRoom = action.payload;
      }
    },

    // Пользователь присоединился
    wsUserJoined: (state, action: PayloadAction<UserJoinedPayload>) => {
      console.log('👤 [roomsSlice] wsUserJoined:', action.payload);
      const room = state.rooms.find(r => r.id === action.payload.room_id);
      if (room) {
        room.current_users = action.payload.user_count;
      }
      if (state.selectedRoom?.id === action.payload.room_id) {
        state.selectedRoom.current_users = action.payload.user_count;
      }
    },

    // Пользователь вышел
    wsUserLeft: (state, action: PayloadAction<UserLeftPayload>) => {
      console.log('👋 [roomsSlice] wsUserLeft:', action.payload);
      const room = state.rooms.find(r => r.id === action.payload.room_id);
      if (room) {
        room.current_users = action.payload.user_count;
      }
      if (state.selectedRoom?.id === action.payload.room_id) {
        state.selectedRoom.current_users = action.payload.user_count;
      }
    },

    // Создана новая комната
    wsRoomCreated: (state, action: PayloadAction<Room>) => {
      console.log('🏠 [roomsSlice] wsRoomCreated:', action.payload);
      state.rooms.push(action.payload);
    },

    // Удалена комната
    wsRoomDeleted: (state, action: PayloadAction<string>) => {
      console.log('🗑️ [roomsSlice] wsRoomDeleted:', action.payload);
      state.rooms = state.rooms.filter(room => room.id !== action.payload);
      if (state.selectedRoom?.id === action.payload) {
        state.selectedRoom = null;
        state.currentRoomId = null;
      }
    },

    // Выбор комнаты
    selectRoom: (state, action: PayloadAction<Room>) => {
      console.log('🎯 [roomsSlice] selectRoom:', action.payload.id);
      state.selectedRoom = action.payload;
    },

    // Установка текущей комнаты для WebSocket
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
  wsUpdateRoom,
  wsUserJoined,
  wsUserLeft,
  wsRoomCreated,
  wsRoomDeleted,
  selectRoom,
  setCurrentRoom,
  clearSelectedRoom,
  clearError,
  setLoading,
  setError,
} = roomsSlice.actions;

// Экспорт редюсера
export default roomsSlice.reducer;

// ========== СЕЛЕКТОРЫ ==========

// Базовые селекторы
export const selectAllRooms = (state: { rooms: RoomsState }) => state.rooms.rooms;
export const selectSelectedRoom = (state: { rooms: RoomsState }) => state.rooms.selectedRoom;
export const selectCurrentRoomId = (state: { rooms: RoomsState }) => state.rooms.currentRoomId;
export const selectRoomsLoading = (state: { rooms: RoomsState }) => state.rooms.isLoading;
export const selectRoomsError = (state: { rooms: RoomsState }) => state.rooms.error;

export const selectRoomById = (state: { rooms: RoomsState }, roomId: string) => {
  return state.rooms.rooms.find(room => room.id === roomId);
};

export const selectAvailableRooms = (state: { rooms: RoomsState }) => {
  return state.rooms.rooms.filter(room => room.current_users < room.capacity);
};

export const selectFullRooms = (state: { rooms: RoomsState }) => {
  return state.rooms.rooms.filter(room => room.current_users >= room.capacity);
};

export const selectRoomsStatistics = (state: { rooms: RoomsState }) => {
  const rooms = state.rooms.rooms;
  const totalRooms = rooms.length;
  const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
  const totalUsers = rooms.reduce((sum, room) => sum + room.current_users, 0);
  const occupancyRate = totalCapacity > 0 ? (totalUsers / totalCapacity) * 100 : 0;
  
  return {
    totalRooms,
    totalCapacity,
    totalUsers,
    occupancyRate: Math.round(occupancyRate),
    availableRoomsCount: rooms.filter(r => r.current_users < r.capacity).length,
    fullRoomsCount: rooms.filter(r => r.current_users >= r.capacity).length,
  };
};