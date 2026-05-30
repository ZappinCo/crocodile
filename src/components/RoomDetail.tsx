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
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const room = useAppSelector(state => selectRoomById(state, roomId || ''));
  const userForWS = useAppSelector(selectUserForWebSocket);
  const isConnected = useAppSelector(state => state.websocket.isConnected);

  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (roomId && isConnected && !isJoining && room) {
      console.log(`🔌 Joining room: ${roomId}`);
      setIsJoining(true);

      webSocketService.emitEvent('user_joined', {
        room_id: roomId,
        user_id: userForWS.user_id,
        user_name: userForWS.user_name
      });
      
      dispatch(setCurrentRoom(roomId));
    }

    return () => {
      if (roomId && isConnected) {
        console.log(`👋 Leaving room: ${roomId}`);
        webSocketService.emitEvent('user_left', {
          room_id: roomId,
          user_id: userForWS.user_id,
          user_name: userForWS.user_name
        });
        dispatch(setCurrentRoom(null));
      }
    };
  }, [roomId, isConnected, dispatch, userForWS, isJoining, room]);

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