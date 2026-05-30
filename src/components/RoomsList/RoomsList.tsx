// src/components/RoomsList/RoomsList.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectAllRooms, selectRoom } from '../../store/slices/rooms.slice';
import { RoomCard } from './RoomCard';
import { CreateRoomModal } from './CreateRoomModal';
import '../../styles/components/rooms-list.css';

export const RoomsList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const rooms = useAppSelector(selectAllRooms);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const handleRoomClick = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room && room.current_users < room.capacity) {
      dispatch(selectRoom(room));
      navigate(`/room/${roomId}`);
    }
  };

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
              onClick={() => handleRoomClick(room.id)}
            />
          ))}
        </div>
      )}

      <CreateRoomModal isOpen={isCreateModalOpen} onClose={handleCloseModal} />
    </div>
  );
};