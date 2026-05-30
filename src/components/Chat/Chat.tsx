// src/components/Chat/Chat.tsx
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { sendMessage, requestHistory, setActiveRoom, setLoading } from '../../store/slices/chat.slice';
import { selectUser } from '../../store/slices/user.slice';
import { selectCurrentRoom } from '../../store/slices/rooms.slice';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { ChatMessage } from './ChatMessage';
import '../../styles/components/chat.css';

export const Chat: React.FC = () => {
  const dispatch = useAppDispatch();
  const room = useAppSelector(selectCurrentRoom);
  const user = useAppSelector(selectUser);
  const isConnected = useAppSelector(state => state.websocket.isConnected);
  const [input, setInput] = useState('');

  const messages = useAppSelector(state =>
    room ? state.chat.rooms[room.id]?.messages || [] : []
  );
  const isLoading = useAppSelector(state =>
    room ? state.chat.rooms[room.id]?.isLoading || false : false
  );

  const { containerRef, handleScroll, autoScroll } = useAutoScroll([messages]);

  // Инициализация чата
  useEffect(() => {
    if (room?.id && isConnected) {
      dispatch(setActiveRoom(room.id));
      dispatch(setLoading({ roomId: room.id, isLoading: true }));
      dispatch(requestHistory(room.id));

      const timeout = setTimeout(() => {
        dispatch(setLoading({ roomId: room.id, isLoading: false }));
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [room?.id, isConnected, dispatch]);

  const handleSendMessage = () => {
    const text = input.trim();
    if (!text || !isConnected || !room) return;

    dispatch(sendMessage(text,room.id,user));
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Отображение загаданного слова для ведущего
  const renderCurrentWord = () => {
    const isLeader = room?.leader_id === user.id;
    const currentWord = room?.current_word;

    if (isLeader && currentWord) {
      return (
        <div className="current-word-display animate-fade-in-up">
          <div className="word-label">🎯 Загаданное слово:</div>
          <div className="word-value">{currentWord}</div>
          <div className="word-hint">Не показывайте его другим игрокам!</div>
        </div>
      );
    }
    return null;
  };

  if (!room) return null;

  if (!isConnected) {
    return (
      <div className="chat-container">
        <div className="chat-offline">
          <div className="chat-loading-spinner"></div>
          <div className="chat-loading-text">Подключение к чату...</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="chat-container">
        <div className="chat-loading">
          <div className="chat-loading-spinner"></div>
          <div className="chat-loading-text">Загрузка сообщений...</div>
        </div>
      </div>
    );
  }

  const isLeader = room.leader_id === user.id;
  const isGameActive = room.game_active;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-info">
          <span className="chat-header-title">{room.name}</span>
        </div>
        <div className="chat-header-stats">
          <span className="stat-item">
            👥 {room.current_users || 0}/{room.capacity}
          </span>
        </div>
      </div>

      {renderCurrentWord()}

      <div
        className="chat-messages"
        ref={containerRef}
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
          groupMessagesByDate(messages).map(([date, dateMessages]) => (
            <div key={date} className="chat-date-group">
              <div className="chat-date-separator">
                <span>{date}</span>
              </div>
              {dateMessages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwn={message.userId === user.id}
                  isLeader={message.userId === room.leader_id}
                  isGameActive={isGameActive}
                  username={user.username}
                />
              ))}
            </div>
          ))
        )}
      </div>

      <div className="chat-input-container">
        {isLeader && isGameActive && (
          <div className="game-hint leader-hint animate-fade-in">
            💡 Вы ведущий! Игроки пытаются угадать слово. Не подсказывайте!
          </div>
        )}
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
            disabled={!isConnected}
          />
          <button
            className={`chat-send-btn ${!input.trim() || !isConnected ? 'disabled' : ''}`}
            onClick={handleSendMessage}
            disabled={!input.trim() || !isConnected}
            aria-label="Отправить сообщение"
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

// Вспомогательная функция для группировки сообщений по датам
function groupMessagesByDate(messages: any[]) {
  const groups: Record<string, any[]> = {};

  messages.forEach(message => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });

  return Object.entries(groups);
}

function formatDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  } catch {
    return 'Invalid date';
  }
}