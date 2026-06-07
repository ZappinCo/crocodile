import { describe, it, expect, vi } from 'vitest';
import roomsReducer, {
  setRooms,
  userJoined,
  userLeft,
  deleteRoom,
  updateRoom,
  createRoom,
  editRoom,
  selectAllRooms,
  selectCurrentRoom,
  selectRoomsLoading,
  selectRoomsError,
  selectRoomById,
  type Room,
  type UserMovePayload,
  type RoomCreatePayload,
} from './rooms.slice';

describe('rooms slice', () => {
  const mockRoom: Room = {
    id: 'room-1',
    name: 'Test Room',
    description: 'Test Description',
    capacity: 5,
    owner_id: 'user-1',
    current_users: 2,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    leader_id: 'user-1',
    current_word: null,
    game_active: false,
    users: ['user-1', 'user-2'],
    words_pool: ['apple', 'banana'],
  };

  const mockRoom2: Room = {
    id: 'room-2',
    name: 'Another Room',
    description: 'Another Desc',
    capacity: 3,
    owner_id: 'user-2',
    current_users: 1,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    leader_id: null,
    current_word: null,
    game_active: false,
    users: ['user-2'],
    words_pool: [],
  };

  const initialState = {
    rooms: [],
    selectedRoomId: null,
    isLoading: false,
    error: null,
  };

  describe('reducers', () => {
    it('should handle setRooms', () => {
      const nextState = roomsReducer(
        initialState,
        setRooms([mockRoom, mockRoom2])
      );
      expect(nextState.rooms).toEqual([mockRoom, mockRoom2]);
      expect(nextState.isLoading).toBe(false);
      expect(nextState.error).toBe(null);
    });

    it('should handle userJoined', () => {
      const payload: UserMovePayload = {
        room_id: 'room-1',
        user_id: 'user-1',
        user_name: 'Alice',
      };
      const nextState = roomsReducer(initialState, userJoined(payload));
      expect(nextState.selectedRoomId).toBe('room-1');
    });

    it('should handle userLeft', () => {
      const stateWithSelection = {
        ...initialState,
        selectedRoomId: 'room-1',
      };
      const payload: UserMovePayload = {
        room_id: 'room-1',
        user_id: 'user-1',
        user_name: 'Alice',
      };
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
      const nextState = roomsReducer(stateWithSelection, userLeft(payload));
      expect(nextState.selectedRoomId).toBe(null);
      expect(consoleSpy).toHaveBeenCalledWith('user left ', 'user-1');
      consoleSpy.mockRestore();
    });

    it('should handle deleteRoom when room exists', () => {
      const stateWithRooms = {
        ...initialState,
        rooms: [mockRoom, mockRoom2],
        selectedRoomId: 'room-1',
      };
      const nextState = roomsReducer(stateWithRooms, deleteRoom('room-1'));
      expect(nextState.rooms).toEqual([mockRoom2]);
      expect(nextState.selectedRoomId).toBe(null);
    });

    it('should handle deleteRoom when selectedRoomId is different', () => {
      const stateWithRooms = {
        ...initialState,
        rooms: [mockRoom, mockRoom2],
        selectedRoomId: 'room-2',
      };
      const nextState = roomsReducer(stateWithRooms, deleteRoom('room-1'));
      expect(nextState.rooms).toEqual([mockRoom2]);
      expect(nextState.selectedRoomId).toBe('room-2');
    });

    it('should handle updateRoom when room exists', () => {
      const updatedRoom = { ...mockRoom, name: 'Updated Name' };
      const stateWithRooms = {
        ...initialState,
        rooms: [mockRoom, mockRoom2],
      };
      const nextState = roomsReducer(stateWithRooms, updateRoom(updatedRoom));
      expect(nextState.rooms).toHaveLength(2);
      expect(nextState.rooms[0]).toEqual(updatedRoom);
      expect(nextState.rooms[1]).toEqual(mockRoom2);
    });

    it('should handle updateRoom when room does not exist', () => {
      const stateWithRooms = {
        ...initialState,
        rooms: [mockRoom2],
      };
      const nextState = roomsReducer(stateWithRooms, updateRoom(mockRoom));
      expect(nextState.rooms).toEqual([mockRoom2]);
    });
  });

  describe('action creators (WebSocket actions)', () => {
    const createPayload: RoomCreatePayload = {
      room_id: null,
      name: 'New Room',
      description: 'New Desc',
      capacity: 4,
      creator_id: 'user-1',
      creator_name: 'Alice',
      words: ['cat', 'dog'],
    };

    it('should create createRoom action with meta', () => {
      const action = createRoom(createPayload);
      expect(action.type).toBe('rooms/createRoom');
      expect(action.payload).toEqual(createPayload);
      expect(action.meta).toEqual({ webSocket: true, event: 'create_room' });
    });

    it('should create editRoom action with meta', () => {
      const editPayload: RoomCreatePayload = {
        ...createPayload,
        room_id: 'room-1',
      };
      const action = editRoom(editPayload);
      expect(action.type).toBe('rooms/editRoom');
      expect(action.payload).toEqual(editPayload);
      expect(action.meta).toEqual({ webSocket: true, event: 'edit_room' });
    });
  });

  describe('selectors', () => {
    const state = {
      rooms: {
        rooms: [mockRoom, mockRoom2],
        selectedRoomId: 'room-1',
        isLoading: true,
        error: 'Some error',
      },
    };

    it('selectAllRooms should return all rooms', () => {
      expect(selectAllRooms(state)).toEqual([mockRoom, mockRoom2]);
    });

    it('selectCurrentRoom should return selected room', () => {
      expect(selectCurrentRoom(state)).toEqual(mockRoom);
    });

    it('selectCurrentRoom should return undefined if no room selected', () => {
      const emptyState = {
        rooms: {
          ...state.rooms,
          selectedRoomId: null,
        },
      };
      expect(selectCurrentRoom(emptyState)).toBeUndefined();
    });

    it('selectRoomsLoading should return isLoading flag', () => {
      expect(selectRoomsLoading(state)).toBe(true);
    });

    it('selectRoomsError should return error', () => {
      expect(selectRoomsError(state)).toBe('Some error');
    });

    it('selectRoomById should return room by id', () => {
      expect(selectRoomById(state, 'room-2')).toEqual(mockRoom2);
      expect(selectRoomById(state, 'non-existent')).toBeUndefined();
    });
  });
});