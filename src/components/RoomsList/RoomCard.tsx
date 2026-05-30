// src/components/RoomsList/RoomCard.tsx
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { webSocketService } from '../../services/websocket.service';
import { selectUsername, selectUserId } from '../../store/slices/user.slice';
import type { Room } from '../../store/slices/rooms.slice';

interface RoomCardProps {
  room: Room;
  onClick: () => void;
  onRoomUpdate?: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onClick, onRoomUpdate }) => {
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
  const isCreator = room.owner_id == currentUserId; // Пользовательские комнаты может редактировать создатель
  const canEdit = isCreator && !room.game_active;

  // Форматирование даты
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

  // Редактирование комнаты
  const handleEdit = () => {
    if (!canEdit) return;
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      alert('Название комнаты не может быть пустым');
      return;
    }

    webSocketService.emitEvent('update_room', {
      room_id: room.id,
      name: editName.trim(),
      description: editDescription.trim(),
      capacity: editCapacity,
      user_id: currentUserId,
      user_name: currentUsername
    });

    setIsEditing(false);
    onRoomUpdate?.();
  };

  const handleCancelEdit = () => {
    setEditName(room.name);
    setEditDescription(room.description || '');
    setEditCapacity(room.capacity);
    setIsEditing(false);
  };

  // Удаление комнаты
  const handleDelete = () => {
    if (!canEdit) return;
    setIsDeleting(true);
  };

  const confirmDelete = () => {
    if (window.confirm(`Вы уверены, что хотите удалить комнату "${room.name}"?`)) {
      webSocketService.emitEvent('delete_room', {
        room_id: room.id,
        user_id: currentUserId,
        user_name: currentUsername
      });
      
      onRoomUpdate?.();
    }
    setIsDeleting(false);
  };

  const cancelDelete = () => {
    setIsDeleting(false);
  };

  // Если в режиме редактирования
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

  // Если в режиме подтверждения удаления
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
      onClick={!isFull ? onClick : undefined}
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