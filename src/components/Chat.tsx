// src/components/Chat.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  selectMessagesByRoomId,
  emitSendMessage,
  emitRequestHistory,
  selectIsLoadingByRoomId,
  selectErrorByRoomId,
  addChatRoom,
  setLoading,
  setError
} from '../features/chatSlice';
import { selectUsername } from '../features/userSlice';
import { webSocketService } from '../services/websocketService';
import { selectRoomById } from '../features/roomsSlice';
import './Chat.css';

interface ChatProps {
  roomId: string;
}

export const Chat: React.FC<ChatProps> = ({ roomId }) => {
  const dispatch = useAppDispatch();
  const room = useAppSelector(state => selectRoomById(state, roomId || ''));
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const messages = useAppSelector(state => selectMessagesByRoomId(state, roomId));
  const isLoading = useAppSelector(state => selectIsLoadingByRoomId(state, roomId));
  const error = useAppSelector(state => selectErrorByRoomId(state, roomId));
  const username = useAppSelector(selectUsername);
  const isConnected = useAppSelector(state => state.websocket.isConnected);
  const roomInfo = useAppSelector(state => state.chat.list[roomId]?.roomInfo);

  // Инициализация чата для комнаты
  useEffect(() => {
    if (roomId && isConnected) {
      console.log(`📱 Initializing chat for room: ${roomId}`);
      dispatch(addChatRoom(roomId));
      dispatch(setLoading({ roomId, isLoading: true }));

      // Запрашиваем историю сообщений
      emitRequestHistory(roomId);

      // Таймаут для снятия загрузки, если история не пришла
      const timeout = setTimeout(() => {
        dispatch(setLoading({ roomId, isLoading: false }));
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [roomId, isConnected, dispatch]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Обработка скролла для отключения автоскролла
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isAtBottom);
    }
  }, []);

  // Подписка на новые сообщения через WebSocket
  useEffect(() => {
    if (!roomId) return;

    // Обработчик новых сообщений
    const handleNewMessage = (message: any) => {
      if (message.roomId === roomId) {
        console.log('📨 New message received:', message);
        if (message.isGuess) {
          console.log(`🔍 Guess message from ${message.userId}: ${message.text}`);
        }
      }
    };

    // Обработчик истории сообщений
    const handleMessageHistory = (data: any) => {
      if (data.room_id === roomId) {
        console.log(`📜 History received: ${data.messages?.length || 0} messages`);
        dispatch(setLoading({ roomId, isLoading: false }));
      }
    };

    // Обработчик обновления комнаты
    const handleRoomUpdate = (data: any) => {
      if (data.id === roomId) {
        console.log(`🏠 Room update received:`, data);
      }
    };

    // Подписываемся на события
    const unsubscribeNewMessage = webSocketService.subscribe('new_message', handleNewMessage);
    const unsubscribeHistory = webSocketService.subscribe('message_history', handleMessageHistory);
    const unsubscribeRoomUpdate = webSocketService.subscribe('room_update', handleRoomUpdate);

    return () => {
      unsubscribeNewMessage();
      unsubscribeHistory();
      unsubscribeRoomUpdate();
    };
  }, [roomId, dispatch]);

  const handleSendMessage = () => {
    const text = input.trim();
    if (!text || !isConnected) return;

    console.log(`📤 Sending message to room ${roomId}: ${text}`);

    emitSendMessage({
      roomId,
      userId: username,
      text
    });

    setInput('');
    setIsTyping(false);

    // Автоскролл после отправки
    setAutoScroll(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const handleRetry = () => {
    dispatch(setLoading({ roomId, isLoading: true }));
    dispatch(setError({ roomId, error: null }));
    emitRequestHistory(roomId);

    setTimeout(() => {
      dispatch(setLoading({ roomId, isLoading: false }));
    }, 5000);
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Invalid time';
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return 'Invalid date';
    }
  };

  // Группировка сообщений по датам
  const groupMessagesByDate = () => {
    const groups: { [key: string]: typeof messages } = {};

    messages.forEach(message => {
      const date = formatDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  // Определение, является ли сообщение системным
  const isSystemMessage = (userId: string) => userId === 'system';

  // Определение, является ли сообщение попыткой угадать
  const isGuessMessage = (message: any) => message.isGuess === true;

  // Отображение загаданного слова для ведущего
  const getCurrentWordDisplay = () => {
    const isLeader = roomInfo?.leader_id === username;
    const currentWord = roomInfo?.current_word;
    
    if (isLeader && currentWord) {
      return (
        <div className="current-word-display">
          <div className="word-label">🎯 Загаданное слово:</div>
          <div className="word-value">{currentWord}</div>
          <div className="word-hint">Не показывайте его другим игрокам!</div>
        </div>
      );
    }
    return null;
  };

  if (!isConnected) {
    return (
      <div className="chat-offline">
        <div className="chat-offline-icon">🔌</div>
        <div className="chat-offline-text">Connecting to chat...</div>
        <div className="chat-offline-sub">Please wait while we establish connection</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="chat-loading">
        <div className="chat-loading-spinner"></div>
        <div className="chat-loading-text">Loading messages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-error">
        <div className="chat-error-icon">⚠️</div>
        <div className="chat-error-text">{error}</div>
        <button className="chat-retry-btn" onClick={handleRetry}>
          Try Again
        </button>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate();
  const isLeader = roomInfo?.leader_id === username;
  const isGameActive = roomInfo?.game_active;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-info">
          <span className="chat-header-title">{room?.name || 'Game Room'}</span>
          {!isGameActive && roomInfo?.leader_id && (
            <span className="game-status-badge waiting">⏳ Ожидание игроков</span>
          )}
        </div>
        <div className="chat-header-stats">
          <span className="stat-item">👥 {room?.current_users || 0}</span>
        </div>
      </div>

      {getCurrentWordDisplay()}

      <div
        className="chat-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">💭</div>
            <div className="chat-empty-text">Нет сообщений</div>
            <div className="chat-empty-sub">
              {isLeader && isGameActive 
                ? "Вы ведущий! Игроки будут пытаться угадать ваше слово."
                : "Будьте первым, кто отправит сообщение!"}
            </div>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date} className="chat-date-group">
              <div className="chat-date-separator">
                <span>{date}</span>
              </div>
              {dateMessages.map((message) => {
                const isOwn = message.userId === username;
                const isSystem = isSystemMessage(message.userId);
                const isGuess = isGuessMessage(message);
                const isLeaderMessage = message.userId === roomInfo?.leader_id;

                if (isSystem) {
                  return (
                    <div key={message.id} className="chat-system-message">
                      <div className="system-message-content">
                        <span className="system-icon">ℹ️</span>
                        <span className="system-text">{message.text}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={message.id}
                    className={`chat-message ${isOwn ? 'own' : 'other'} ${isGuess ? 'guess' : ''}`}
                  >
                    <div className="message-bubble">
                      {!isOwn && (
                        <div className="message-author">
                          {message.userId}
                          {isLeaderMessage && isGameActive && (
                            <span className="leader-badge-small" title="Ведущий"> 👑</span>
                          )}
                        </div>
                      )}
                      <div className="message-text">{message.text}</div>
                      <div className="message-time">
                        {formatTime(message.timestamp)}
                        {isGuess && <span className="guess-badge">🔍 Попытка угадать</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        {isLeader && isGameActive && (
          <div className="game-hint leader-hint">
            💡 Вы ведущий! Игроки пытаются угадать слово. Не подсказывайте!
          </div>
        )}
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isLeader && isGameActive 
              ? "Вы ведущий. Наблюдайте за попытками игроков..." 
              : "Введите сообщение или попробуйте угадать слово..."}
            rows={1}
            disabled={!isConnected}
          />
          <button
            className={`chat-send-btn ${!input.trim() || !isConnected ? 'disabled' : ''}`}
            onClick={handleSendMessage}
            disabled={!input.trim() || !isConnected}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};