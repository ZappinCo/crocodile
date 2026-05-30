// src/components/RoomsList/RoomsList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectAllRooms } from '../../store/slices/rooms.slice';
import webSocketService from '../../services/websocket.service';
import { RoomCard } from './RoomCard';
import { CreateRoomModal } from './CreateRoomModal';
import '../../styles/components/rooms-list.css';

export const RoomsList: React.FC = () => {
  const rooms = useAppSelector(selectAllRooms);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateRoom = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
  };

  return (
    <div className="rooms-container">
      <div className="rooms-header">
        <h1>Игровые комнаты</h1>
        <button className="create-room-btn" onClick={handleCreateRoom}>
          <span>➕</span>
          <span>Создать комнату</span>
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="rooms-empty animate-fade-in">
          <div className="rooms-empty-icon">🎮</div>
          <div className="rooms-empty-text">Нет доступных комнат</div>
          <div className="rooms-empty-sub">Создайте первую комнату и начните игру!</div>
        </div>
      ) : (
        <div className="rooms-grid">
          {rooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
            />
          ))}
        </div>
      )}

      <CreateRoomModal isOpen={isCreateModalOpen} onClose={handleCloseModal} />
    </div>
  );
};