// src/components/RoomsList.tsx
import React from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store';
import { selectAllRooms, selectRoom } from '../features/roomsSlice';

export const RoomsList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const rooms = useAppSelector(selectAllRooms);
  
  const handleRoomClick = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      dispatch(selectRoom(room));
      navigate(`/room/${roomId}`);
    }
  };

    
  return (
    <div>
      <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {rooms.map(room => {
          const freeSpaces = room.capacity - room.current_users;
          const isFull = freeSpaces === 0;
          const occupancyPercent = (room.current_users / room.capacity) * 100;
          
          return (
            <div 
              key={room.id} 
              onClick={() => handleRoomClick(room.id)}
              style={{ 
                border: '1px solid #ddd', 
                padding: '15px', 
                borderRadius: '8px',
                backgroundColor: isFull ? '#ffe0e0' : '#f0f0f0',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              <h3>{room.name}</h3>
              
              <div style={{ marginTop: '10px' }}>
                <div>Участников: {room.current_users}</div>
                <div>Свободно: {freeSpaces}</div>
              </div>
              
              <div style={{ 
                marginTop: '10px', 
                height: '8px', 
                backgroundColor: '#ddd',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${occupancyPercent}%`,
                  height: '100%',
                  backgroundColor: isFull ? '#f44336' : '#4caf50',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};