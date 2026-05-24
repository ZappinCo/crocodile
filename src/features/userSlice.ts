// src/features/userSlice.ts
import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// Тип состояния пользователя
interface UserState {
  id: string;
  username: string;
  isSet: boolean;
  lastActive: string | null;
  avatarColor: string;
}

// Начальное состояние
const initialState: UserState = {
  id: localStorage.getItem('userId') || '',
  username: localStorage.getItem('username') || '',
  isSet: !!localStorage.getItem('username'),
  lastActive: localStorage.getItem('userLastActive') || null,
  avatarColor: localStorage.getItem('userAvatarColor') || getRandomColor(),
};

// Функция для генерации случайного цвета аватара
function getRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8C471', '#A9DFBF', '#F9E79F', '#D7BDE2', '#AED6F1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Генерация ID пользователя
function generateUserId(): string {
  return `user_${Math.random().toString(36).substr(2, 9)}`;
}

// Создание слайса
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Установка имени пользователя
    setUsername: (state, action: PayloadAction<string>) => {
      const trimmedName = action.payload.trim();
      state.username = trimmedName;
      state.isSet = true;
      state.lastActive = new Date().toISOString();
      
      // Генерируем ID если его нет
      if (!state.id) {
        state.id = generateUserId();
        localStorage.setItem('userId', state.id);
      }
      
      // Сохраняем в localStorage
      localStorage.setItem('username', trimmedName);
      localStorage.setItem('userLastActive', state.lastActive);
      localStorage.setItem('userAvatarColor', state.avatarColor);
      
      console.log('👤 [userSlice] Username set:', trimmedName);
      console.log('🆔 [userSlice] User ID:', state.id);
    },
    
    // Очистка имени пользователя
    clearUsername: (state) => {
      state.username = '';
      state.id = '';
      state.isSet = false;
      state.lastActive = null;
      
      // Удаляем из localStorage
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      localStorage.removeItem('userLastActive');
      localStorage.removeItem('userAvatarColor');
      
      console.log('👤 [userSlice] Username cleared');
    },
    
    // Обновление времени активности
    updateLastActive: (state) => {
      state.lastActive = new Date().toISOString();
      localStorage.setItem('userLastActive', state.lastActive);
    },
    
    // Редактирование имени (без очистки isSet)
    editUsername: (state, action: PayloadAction<string>) => {
      const trimmedName = action.payload.trim();
      if (trimmedName) {
        state.username = trimmedName;
        state.lastActive = new Date().toISOString();
        localStorage.setItem('username', trimmedName);
        localStorage.setItem('userLastActive', state.lastActive);
        console.log('👤 [userSlice] Username edited:', trimmedName);
      }
    },
    
    // Смена цвета аватара
    setAvatarColor: (state, action: PayloadAction<string>) => {
      state.avatarColor = action.payload;
      localStorage.setItem('userAvatarColor', action.payload);
    },
    
    // Обновление ID пользователя
    setUserId: (state, action: PayloadAction<string>) => {
      state.id = action.payload;
      localStorage.setItem('userId', action.payload);
    },
    
    // Сброс всех данных пользователя
    resetUser: () => initialState,
  },
});

// Экспорт действий
export const { 
  setUsername, 
  clearUsername, 
  updateLastActive, 
  editUsername,
  setAvatarColor,
  setUserId,
  resetUser
} = userSlice.actions;

// Экспорт редюсера
export default userSlice.reducer;

// ========== СЕЛЕКТОРЫ ==========

// Базовые селекторы
export const selectUserId = (state: { user: UserState }) => state.user.id;
export const selectUsername = (state: { user: UserState }) => state.user.username;
export const selectIsUserSet = (state: { user: UserState }) => state.user.isSet;
export const selectUserLastActive = (state: { user: UserState }) => state.user.lastActive;
export const selectUserAvatarColor = (state: { user: UserState }) => state.user.avatarColor;

// Получение полной информации о пользователе
export const selectUser = (state: { user: UserState }) => ({
  id: state.user.id,
  username: state.user.username,
  isSet: state.user.isSet,
  lastActive: state.user.lastActive,
  avatarColor: state.user.avatarColor
});

// Мемоизированные селекторы
export const selectUserDisplayName = createSelector(
  [selectUsername, selectIsUserSet],
  (username, isSet) => {
    if (!isSet) return 'Гость';
    return username;
  }
);

// Селектор для проверки валидности имени
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

// Селектор для получения статистики пользователя
export const selectUserStats = createSelector(
  [selectUserId, selectUsername, selectUserLastActive, selectIsUsernameValid, selectUserAvatarColor],
  (id, username, lastActive, isValid, avatarColor) => ({
    id,
    username,
    isValid,
    lastActive: lastActive ? new Date(lastActive) : null,
    isGuest: !username,
    avatarColor
  })
);

// Селектор для получения информации для WebSocket подключения
export const selectUserForWebSocket = createSelector(
  [selectUserId, selectUsername],
  (id, username) => ({
    user_id: id || username,
    user_name: username,
    displayName: username
  })
);