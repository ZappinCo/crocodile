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
  words_pool?: string[];
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
  creator_name:string;
  words?: string[];
}

interface RoomsState {
  rooms: Room[];
  selectedRoomId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: RoomsState = {
  rooms: [],
  selectedRoomId: null,
  isLoading: false,
  error: null,
};

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    setRooms: (state, action: PayloadAction<Room[]>) => {
      state.rooms = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    userJoined: (state, action: PayloadAction<UserMovePayload>) => {
      state.selectedRoomId = action.payload.room_id;
    },

    userLeft: (state, action: PayloadAction<UserMovePayload>) => {
      console.log("user left ",action.payload.user_id)
      state.selectedRoomId = null;
    },

    deleteRoom: (state, action: PayloadAction<string>) => {
      state.rooms = state.rooms.filter(room => room.id !== action.payload);
      if (state.selectedRoomId === action.payload) {
        state.selectedRoomId = null;
      }
    },

    updateRoom: (state, action: PayloadAction<Room>) => {
      const index = state.rooms.findIndex(room => room.id === action.payload.id);
      if (index !== -1) {
        state.rooms[index] = action.payload;
      }
    },
  },
});

export const {
  setRooms,
  userJoined,
  userLeft,
  deleteRoom,
  updateRoom,
} = roomsSlice.actions;

export const createRoom = (payload:RoomCreatePayload) => ({
  type: 'rooms/createRoom',
  payload: payload,
  meta: { webSocket: true, event: 'create_room' }
});

export const editRoom = (payload:RoomCreatePayload) => ({
  type: 'rooms/editRoom',
  payload: payload,
  meta: { webSocket: true, event: 'edit_room' }
});

export const selectAllRooms = (state: { rooms: RoomsState }) => state.rooms.rooms;
export const selectCurrentRoom = (state: { rooms: RoomsState }) => {
  return state.rooms.rooms.find(room => room.id === state.rooms.selectedRoomId);
};
export const selectRoomsLoading = (state: { rooms: RoomsState }) => state.rooms.isLoading;
export const selectRoomsError = (state: { rooms: RoomsState }) => state.rooms.error;

export const selectRoomById = (state: { rooms: RoomsState }, roomId: string) => {
  return state.rooms.rooms.find(room => room.id === roomId);
};

export default roomsSlice.reducer;