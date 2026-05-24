// src/components/RoomDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store';
import { selectRoomById, setCurrentRoom, selectCurrentRoomId } from '../features/roomsSlice';
import { webSocketService } from '../services/websocketService';
import { selectUserForWebSocket } from '../features/userSlice'
import { Chat } from './Chat';
import DrawingCanvas from './DrawingCanvas';

export const RoomDetail: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const room = useAppSelector(state => selectRoomById(state, roomId || ''));
  const userForWS = useAppSelector(selectUserForWebSocket);
  const currentRoomId = useAppSelector(selectCurrentRoomId);
  const isConnected = useAppSelector(state => state.websocket.isConnected);

  const [isJoining, setIsJoining] = useState(false);

  // При загрузке компонента - подключаемся к комнате
  useEffect(() => {
    if (roomId && isConnected && !isJoining) {
      console.log(`🔌 Joining room: ${roomId}`);
      setIsJoining(true);

      // Отправляем команду на подключение к комнате
      webSocketService.emitEvent('user_joined', {
        room_id: roomId,
        user_id: userForWS.user_id,      // Используем ID или имя
        user_name: userForWS.user_name    // Отображаемое имя
      });
      // Обновляем Redux состояние
      dispatch(setCurrentRoom(roomId));
    }

    // При размонтировании - выходим из комнаты
    return () => {
      if (currentRoomId && isConnected) {
        console.log(`👋 Leaving room: ${currentRoomId}`);
        webSocketService.emitEvent('user_left', {
          room_id: currentRoomId,
          user_id: userForWS.user_id,      // Используем ID или имя
          user_name: userForWS.user_name    // Отображаемое имя
        });
        dispatch(setCurrentRoom(null));
      }
    };
  }, [roomId, isConnected, dispatch, userForWS, currentRoomId, isJoining]);

  if (!room || !roomId) {
    return (
      <div>
        <h2>Room not found</h2>
        <button onClick={() => navigate('/')}>Back to rooms</button>
      </div>
    );
  }


  return (
    <div className='room-container'>
      <DrawingCanvas />
      <Chat roomId={roomId} />
    </div>
  );
};