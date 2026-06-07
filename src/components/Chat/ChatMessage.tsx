import React from 'react';
import type { Message } from '../../store/slices/chat.slice';
interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  isLeader: boolean;
  isGameActive: boolean;
  username: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isOwn,
  isLeader,
  isGameActive,
  username
}) => {
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (message.userId === 'system') {
    return (
      <div className="chat-system-message animate-fade-in">
        <div className="system-message-content">
          <span className="system-icon">ℹ️</span>
          <span className="system-text">{message.text}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-message ${isOwn ? 'own' : 'other'} ${message.isGuess ? 'guess' : ''} animate-fade-in`}>
      <div className="message-bubble">
        {!isOwn && (
          <div className="message-author">
            {username}
            {isLeader && isGameActive && (
              <span className="leader-badge-small" title="Ведущий">
                👑
              </span>
            )}
          </div>
        )}
        <div className="message-text">{message.text}</div>
        <div className="message-time">
          {formatTime(message.timestamp)}
          {message.isGuess && (
            <span className="guess-badge">
              🔍 Попытка угадать
            </span>
          )}
        </div>
      </div>
    </div>
  );
};