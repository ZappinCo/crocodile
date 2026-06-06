import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectUsername, selectUserId } from '../../store/slices/user.slice';
import type { Room } from '../../store/slices/rooms.slice';
import { deleteRoom, editRoom } from '../../store/slices/rooms.slice';
import { useNavigate } from 'react-router';

export const RoomCard = ({ room }: { room: Room }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUserId = useAppSelector(selectUserId);
  const currentUserName = useAppSelector(selectUsername);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(room.name);
  const [editDescription, setEditDescription] = useState(room.description || '');
  const [editCapacity, setEditCapacity] = useState(room.capacity);
  const [editWords, setEditWords] = useState<string[]>(room.words_pool || []);
  const [newWord, setNewWord] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const freeSpaces = room.capacity - room.current_users;
  const isFull = freeSpaces === 0;
  const occupancyPercent = (room.current_users / room.capacity) * 100;
  const isCreator = room.owner_id === currentUserId;
  const canEdit = isCreator;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Недавно';
    }
  };

  const handleRoomClick = () => {
    if (room && room.current_users < room.capacity) {
      navigate(`/room/${room.id}`);
    }
  };

  const handleEdit = () => {
    if (!canEdit) return;
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      alert('Название комнаты не может быть пустым');
      return;
    }

    dispatch(editRoom({
      room_id: room.id,
      creator_id: currentUserId,
      creator_name: currentUserName,
      name: editName.trim(),
      description: editDescription.trim(),
      capacity: editCapacity,
      words: editWords
    }));

    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(room.name);
    setEditDescription(room.description || '');
    setEditCapacity(room.capacity);
    setEditWords(room.words_pool || []);
    setNewWord('');
    setIsEditing(false);
  };

  const handleAddWord = () => {
    const word = newWord.trim().toLowerCase();
    if (!word) return;
    if (editWords.includes(word)) {
      alert('Такое слово уже есть');
      return;
    }
    setEditWords([...editWords, word]);
    setNewWord('');
  };

  const handleRemoveWord = (wordToRemove: string) => {
    setEditWords(editWords.filter(w => w !== wordToRemove));
  };

  const handleDelete = () => {
    if (!canEdit) return;
    setIsDeleting(true);
  };

  const confirmDelete = () => {
    dispatch(deleteRoom(room.id));
  };

  const cancelDelete = () => {
    setIsDeleting(false);
  };

  if (isEditing) {
    return (
      <div className="room-card editing animate-fade-in">
        <div className="room-edit-form">
          <div className="edit-field">
            <label>Название комнаты:</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Введите название"
              maxLength={30}
              autoFocus
            />
          </div>

          <div className="edit-field">
            <label>Описание:</label>
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Описание комнаты"
              maxLength={100}
            />
          </div>

          <div className="edit-field">
            <label>Максимум игроков:</label>
            <select value={editCapacity} onChange={(e) => setEditCapacity(Number(e.target.value))}>
              <option value={4}>4 игрока</option>
              <option value={6}>6 игроков</option>
              <option value={8}>8 игроков</option>
              <option value={10}>10 игроков</option>
              <option value={12}>12 игроков</option>
            </select>
          </div>

          <div className="edit-field">
            <label>Список слов для угадывания:</label>
            <div className="words-list">
              {editWords.map((word, idx) => (
                <span key={idx} className="word-tag">
                  {word}
                  <button 
                    type="button" 
                    className="remove-word-btn"
                    onClick={() => handleRemoveWord(word)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="add-word-form">
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
                placeholder="Новое слово..."
                maxLength={30}
              />
              <button type="button" onClick={handleAddWord} className="add-word-btn">
                ➕ Добавить
              </button>
            </div>
            <small className="words-hint">Слова будут использоваться для игры. Ведущий будет загадывать их случайным образом.</small>
          </div>

          <div className="edit-actions">
            <button className="edit-save-btn" onClick={handleSaveEdit}>
              💾 Сохранить
            </button>
            <button className="edit-cancel-btn" onClick={handleCancelEdit}>
              ❌ Отмена
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isDeleting) {
    return (
      <div className="room-card deleting animate-fade-in">
        <div className="delete-confirm">
          <p>Удалить комнату "{room.name}"?</p>
          <div className="delete-actions">
            <button className="delete-confirm-btn" onClick={confirmDelete}>
              ✅ Да, удалить
            </button>
            <button className="delete-cancel-btn" onClick={cancelDelete}>
              ❌ Отмена
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`room-card ${isFull ? 'full' : ''} animate-fade-in-up`}
      onClick={!isFull ? handleRoomClick : undefined}
      style={{ cursor: !isFull ? 'pointer' : 'not-allowed' }}
    >
      {canEdit && (
        <div className="room-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="room-edit-btn"
            onClick={handleEdit}
            title="Редактировать комнату"
          >
            ✏️
          </button>
          <button
            className="room-delete-btn"
            onClick={handleDelete}
            title="Удалить комнату"
          >
            🗑️
          </button>
        </div>
      )}

      <div className="room-name">{room.name}</div>

      {room.description && (
        <div className="room-description">{room.description}</div>
      )}

      <div className="room-stats">
        <div className="stat">
          <span>👥</span>
          <span>
            <span className="stat-value">{room.current_users}</span>
            <span>/{room.capacity}</span>
          </span>
        </div>

        {room.game_active && (
          <div className="stat game-active">
            <span>🎮</span>
            <span className="stat-value">Игра идет</span>
          </div>
        )}
      </div>

      <div className="room-progress">
        <div className="progress-bar">
          <div
            className={`progress-fill ${isFull ? 'full' : ''}`}
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
      </div>

      {room.words_pool && room.words_pool.length > 0 && (
        <div className="room-words-preview">
          <span className="words-label">📚 Слова:</span>
          <span className="words-count">{room.words_pool.length} слов</span>
        </div>
      )}

      {room.created_at && (
        <div className="room-created">
          📅 {formatDate(room.created_at)}
        </div>
      )}
    </div>
  );
};