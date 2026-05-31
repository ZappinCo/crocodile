import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectUsername, selectUserId } from '../../store/slices/user.slice';
import type { Room } from '../../store/slices/rooms.slice';
import { deleteRoom, updateRoom } from '../../store/slices/rooms.slice';
import { useNavigate } from 'react-router';


export const RoomCard = ({ room }: { room: Room }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUsername = useAppSelector(selectUsername);
  const currentUserId = useAppSelector(selectUserId);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(room.name);
  const [editDescription, setEditDescription] = useState(room.description || '');
  const [editCapacity, setEditCapacity] = useState(room.capacity);
  const [isDeleting, setIsDeleting] = useState(false);

  const freeSpaces = room.capacity - room.current_users;
  const isFull = freeSpaces === 0;
  const occupancyPercent = (room.current_users / room.capacity) * 100;
  const isCreator = room.owner_id == currentUserId;
  const canEdit = isCreator && !room.game_active;

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

    dispatch(updateRoom({
      room_id: room.id,
      name: editName.trim(),
      description: editDescription.trim(),
      capacity: editCapacity,
      creator_id: currentUserId,
      creator_name: currentUsername
    }));

    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(room.name);
    setEditDescription(room.description || '');
    setEditCapacity(room.capacity);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!canEdit) return;
    setIsDeleting(true);
  };

  const confirmDelete = () => {
    dispatch(deleteRoom(room.id))
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
      className={`room-card ${isFull ? 'full' : ''}  animate-fade-in-up`}
      onClick={!isFull ? handleRoomClick : undefined}
      style={{ cursor: !isFull ? 'pointer' : 'not-allowed' }}
    >
      {/* Кнопки управления (только для пользовательских комнат) */}
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

      {room.created_at && (
        <div className="room-created">
          📅 {formatDate(room.created_at)}
        </div>
      )}
    </div>
  );
};