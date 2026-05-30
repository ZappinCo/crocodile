// src/components/RoomDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store';
import { selectRoomById, setCurrentRoom } from '../store/slices/rooms.slice';
import { webSocketService } from '../services/websocket.service';
import { selectUserForWebSocket } from '../store/slices/user.slice';
import { Chat } from './Chat/Chat';
import { DrawingCanvas } from './DrawingCanvas/DrawingCanvas';

export const RoomDetail: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const room = useAppSelector(state => selectRoomById(state, roomId || ''));

  const dispatch = useAppDispatch();

  const isConnected = useAppSelector(state => state.websocket.isConnected);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (roomId)
      dispatch(setCurrentRoom(roomId));
    return () => {
      dispatch(setCurrentRoom(null));
    };
  }, []);

  if (!room || !roomId) {
    return (
      <div className="rooms-empty">
        <div className="rooms-empty-icon">🔍</div>
        <div className="rooms-empty-text">Комната не найдена</div>
        <button className="create-room-btn" onClick={() => navigate('/')}>
          Вернуться к списку комнат
        </button>
      </div>
    );
  }

  return (
    <div className="room-container">
      <DrawingCanvas />
      <Chat />
    </div>
  );
};