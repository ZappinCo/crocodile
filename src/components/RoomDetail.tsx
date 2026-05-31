import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store';
import { selectCurrentRoom, selectRoomById, userJoined, userLeft } from '../store/slices/rooms.slice';
import { webSocketService } from '../services/websocket.service';
import { selectUserForWebSocket } from '../store/slices/user.slice';
import { Chat } from './Chat/Chat';
import { DrawingCanvas } from './DrawingCanvas/DrawingCanvas';

export const RoomDetail: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  
  const room = useAppSelector(selectCurrentRoom);
  const user = useAppSelector(selectUserForWebSocket)

  const dispatch = useAppDispatch();
  const isConnected = useAppSelector(state => state.websocket.isConnected);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (roomId && roomId != room?.id && isConnected) {
      dispatch(userJoined({
        ...user,
        room_id: roomId
      }))
    }
  }, [room, isConnected])

  useEffect(() => {
    return () => {
      if (roomId)
        dispatch(userLeft({
          ...user,
          room_id: roomId
        }))
    };
  }, []);

  if (!isConnected) {
    return (
      <div className="rooms-empty">
        <div className="chat-loading-spinner"></div>
        <div className="rooms-empty-text">Подключение к серверу...</div>
      </div>
    );
  }

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