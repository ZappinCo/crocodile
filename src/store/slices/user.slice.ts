import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type User = {
  id: string;
  username: string;
  isSet: boolean;
  avatarColor: string;
}

function getRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8C471', '#A9DFBF', '#F9E79F', '#D7BDE2', '#AED6F1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const loadFromStorage = (): Partial<User> => {
  try {
    return {
      id: localStorage.getItem('userId') || '',
      username: localStorage.getItem('username') || '',
      isSet: !!localStorage.getItem('username'),
      avatarColor: localStorage.getItem('userAvatarColor') || getRandomColor(),
    };
  } catch {
    return {};
  }
};

const initialState: User = {
  id: '',
  username: '',
  isSet: false,
  avatarColor: getRandomColor(),
  ...loadFromStorage(),
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUsername: (state, action: PayloadAction<string>) => {
      const trimmedName = action.payload.trim();
      state.username = trimmedName;
      state.isSet = true;

      if (!state.id) {
        state.id = generateUserId();
      }

      localStorage.setItem('username', trimmedName);
      localStorage.setItem('userId', state.id);
      localStorage.setItem('userAvatarColor', state.avatarColor);
    },

    clearUsername: (state) => {
      state.username = '';
      state.id = '';
      state.isSet = false;

      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      localStorage.removeItem('userLastActive');
      localStorage.removeItem('userAvatarColor');
      localStorage.removeItem('userStats');

    },

    editUsername: (state, action: PayloadAction<string>) => {
      const trimmedName = action.payload.trim();
      if (trimmedName) {
        state.username = trimmedName;
        localStorage.setItem('username', trimmedName);
      }
    },

    setAvatarColor: (state, action: PayloadAction<string>) => {
      state.avatarColor = action.payload;
      localStorage.setItem('userAvatarColor', action.payload);
    },

    resetUser: () => initialState,
  },
});

export const {
  setUsername,
  clearUsername,
  editUsername,
  setAvatarColor,
  resetUser
} = userSlice.actions;

export const selectUserId = (state: { user: User }) => state.user.id;
export const selectUsername = (state: { user: User }) => state.user.username;
export const selectIsUserSet = (state: { user: User }) => state.user.isSet;
export const selectUserAvatarColor = (state: { user: User }) => state.user.avatarColor;

export const selectUser = (state: { user: User }) => ({
  id: state.user.id,
  username: state.user.username,
  isSet: state.user.isSet,
  avatarColor: state.user.avatarColor,
});

export const selectUserDisplayName = createSelector(
  [selectUsername, selectIsUserSet],
  (username, isSet) => isSet ? username : 'Гость'
);

export const selectIsUsernameValid = createSelector(
  [selectUsername],
  (username) => {
    if (!username) return false;
    if (username.length < 2) return false;
    if (username.length > 20) return false;
    if (!/^[a-zA-Zа-яА-Я0-9_]+$/.test(username)) return false;
    return true;
  }
);

export const selectUserForWebSocket = createSelector(
  [selectUserId, selectUsername],
  (userId, username) => ({
    user_id: userId,
    user_name: username,
  })
);

export default userSlice.reducer;