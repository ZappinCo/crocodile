// src/components/RoomsList/CreateRoomModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { webSocketService } from '../../services/websocket.service';
import { selectUserForWebSocket } from '../../store/slices/user.slice';
import { createRoom } from '../../store/slices/rooms.slice'

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState(6);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const userForWS = useAppSelector(selectUserForWebSocket);

  useEffect(() => {
    if (isOpen) {
      setRoomName('');
      setDescription('');
      setCapacity(6);
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const trimmedName = roomName.trim();

    if (!trimmedName) {
      setError('Название комнаты не может быть пустым');
      return;
    }

    if (trimmedName.length < 3) {
      setError('Название должно содержать минимум 3 символа');
      return;
    }

    if (trimmedName.length > 30) {
      setError('Название не может быть длиннее 30 символов');
      return;
    }

    dispatch(createRoom({
      room_id: null,
      name: trimmedName,
      description: description.trim() || null,
      capacity,
      creator_id: userForWS.user_id,
      creator_name: userForWS.user_name
    }));
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Создать новую комнату</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="input-group">
            <label htmlFor="roomName">Название комнаты *</label>
            <input
              ref={inputRef}
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => {
                setRoomName(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Например: Веселые крокодилы"
              autoComplete="off"
              className={error ? 'error' : ''}
            />
            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="input-group">
            <label htmlFor="description">Описание (необязательно)</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Краткое описание комнаты..."
            />
          </div>

          <div className="input-group">
            <label htmlFor="capacity">Максимум игроков</label>
            <select
              id="capacity"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            >
              <option value={4}>4 игрока</option>
              <option value={6}>6 игроков</option>
              <option value={8}>8 игроков</option>
              <option value={10}>10 игроков</option>
            </select>
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Отмена
          </button>
          <button className="btn-confirm" onClick={handleSubmit}>
            Создать
          </button>
        </div>
      </div>
    </div>
  );
};