import { describe, it, expect, vi, beforeEach } from 'vitest';
import userReducer, {
  setUsername,
  clearUsername,
  editUsername,
  setAvatarColor,
  resetUser,
  selectUserId,
  selectUsername,
  selectIsUserSet,
  selectUserAvatarColor,
  selectUser,
  selectUserDisplayName,
  selectIsUsernameValid,
  selectUserForWebSocket,
} from './user.slice';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const originalRandom = Math.random;
beforeEach(() => {
  localStorageMock.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  Math.random = vi.fn(() => 0.5);
});

afterEach(() => {
  Math.random = originalRandom;
});

describe('user slice', () => {
  describe('reducers', () => {
    it('setUsername should set username, generate id, save to localStorage and set isSet', () => {
      const fixedTimestamp = 1672531200000;
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => fixedTimestamp);
      const originalRandomGen = Math.random;
      Math.random = vi.fn(() => 0.123456);

      const initialState = userReducer(undefined, { type: '@@INIT' });
      const nextState = userReducer(initialState, setUsername('  JohnDoe  '));

      expect(nextState.username).toBe('JohnDoe');
      expect(nextState.isSet).toBe(true);
      expect(nextState.id).toBe(`user_${fixedTimestamp}_${(0.123456).toString(36).substr(2, 9)}`);
      expect(nextState.avatarColor).toBe(initialState.avatarColor);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('username', 'JohnDoe');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userId', nextState.id);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userAvatarColor', nextState.avatarColor);

      Date.now = originalDateNow;
      Math.random = originalRandomGen;
    });

    it('setUsername should not override existing id', () => {
      const stateWithId = userReducer(undefined, setUsername('Alice'));
      const idBefore = stateWithId.id;
      const nextState = userReducer(stateWithId, setUsername('Bob'));
      expect(nextState.id).toBe(idBefore);
      expect(nextState.username).toBe('Bob');
    });

    it('clearUsername should reset user and clear localStorage', () => {
      const stateWithUser = userReducer(undefined, setUsername('TestUser'));
      expect(stateWithUser.isSet).toBe(true);
      const clearedState = userReducer(stateWithUser, clearUsername());
      expect(clearedState.username).toBe('');
      expect(clearedState.id).toBe('');
      expect(clearedState.isSet).toBe(false);
      expect(clearedState.avatarColor).toBe(stateWithUser.avatarColor);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('username');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userId');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userLastActive');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userAvatarColor');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('userStats');
    });

    it('editUsername should update username if non-empty', () => {
      const state = userReducer(undefined, setUsername('OldName'));
      localStorageMock.setItem.mockClear();
      const nextState = userReducer(state, editUsername('  NewName  '));
      expect(nextState.username).toBe('NewName');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('username', 'NewName');
    });

    it('editUsername should not update if trimmed empty', () => {
      const state = userReducer(undefined, setUsername('OldName'));
      localStorageMock.setItem.mockClear();
      const nextState = userReducer(state, editUsername('   '));
      expect(nextState.username).toBe('OldName');
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('username', expect.any(String));
    });

    it('setAvatarColor should update color and save to localStorage', () => {
      const state = userReducer(undefined, { type: '@@INIT' });
      const newColor = '#123456';
      const nextState = userReducer(state, setAvatarColor(newColor));
      expect(nextState.avatarColor).toBe(newColor);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userAvatarColor', newColor);
    });

    it('resetUser should return initial state (without loading from localStorage)', () => {
      const stateWithUser = userReducer(undefined, setUsername('ResetMe'));
      const resetState = userReducer(stateWithUser, resetUser());
      expect(resetState.username).toBe('');
      expect(resetState.id).toBe('');
      expect(resetState.isSet).toBe(false);
      expect(resetState.avatarColor).toBe(stateWithUser.avatarColor);
    });
  });

  describe('selectors', () => {
    const mockState = {
      user: {
        id: 'user-123',
        username: 'TestUser',
        isSet: true,
        avatarColor: '#ABCDEF',
      },
    };

    it('selectUserId returns user id', () => {
      expect(selectUserId(mockState)).toBe('user-123');
    });

    it('selectUsername returns username', () => {
      expect(selectUsername(mockState)).toBe('TestUser');
    });

    it('selectIsUserSet returns isSet', () => {
      expect(selectIsUserSet(mockState)).toBe(true);
    });

    it('selectUserAvatarColor returns avatarColor', () => {
      expect(selectUserAvatarColor(mockState)).toBe('#ABCDEF');
    });

    it('selectUser returns full user object', () => {
      expect(selectUser(mockState)).toEqual({
        id: 'user-123',
        username: 'TestUser',
        isSet: true,
        avatarColor: '#ABCDEF',
      });
    });

    describe('selectUserDisplayName', () => {
      it('returns username when isSet true', () => {
        expect(selectUserDisplayName(mockState)).toBe('TestUser');
      });
      it('returns "Гость" when isSet false', () => {
        const state = { user: { ...mockState.user, isSet: false } };
        expect(selectUserDisplayName(state)).toBe('Гость');
      });
    });

    describe('selectIsUsernameValid', () => {
      it('returns false for empty string', () => {
        const state = { user: { ...mockState.user, username: '' } };
        expect(selectIsUsernameValid(state)).toBe(false);
      });
      it('returns false for too short (<2)', () => {
        const state = { user: { ...mockState.user, username: 'a' } };
        expect(selectIsUsernameValid(state)).toBe(false);
      });
      it('returns false for too long (>20)', () => {
        const state = { user: { ...mockState.user, username: 'a'.repeat(21) } };
        expect(selectIsUsernameValid(state)).toBe(false);
      });
      it('returns false for invalid characters', () => {
        const state = { user: { ...mockState.user, username: 'user@name' } };
        expect(selectIsUsernameValid(state)).toBe(false);
      });
      it('returns true for valid username (letters, digits, underscore)', () => {
        const state = { user: { ...mockState.user, username: 'Valid_User123' } };
        expect(selectIsUsernameValid(state)).toBe(true);
      });
      it('returns true for Russian letters', () => {
        const state = { user: { ...mockState.user, username: 'Пользователь' } };
        expect(selectIsUsernameValid(state)).toBe(true);
      });
    });

    describe('selectUserForWebSocket', () => {
      it('returns object with user_id and user_name', () => {
        expect(selectUserForWebSocket(mockState)).toEqual({
          user_id: 'user-123',
          user_name: 'TestUser',
        });
      });
    });
  });
});