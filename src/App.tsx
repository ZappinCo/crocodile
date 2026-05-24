// src/App.tsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { useAppSelector } from './store';
import webSocketService from './services/websocketService';
import { selectIsUserSet } from './features/userSlice';
import { MainLayout } from './layouts/MainLayout';
import { RoomsList } from './components/RoomsList';
import { RoomDetail } from './components/RoomDetail';
import { UserModal } from './components/UserModal';


function App() {
  useEffect(() => {
    webSocketService.connect();

    return () => {
      webSocketService.disconnect();
    };
  }, []);

  const isUserSet = useAppSelector(selectIsUserSet);
  const [isModalOpen, setIsModalOpen] = useState(!isUserSet);

  const handleCloseModal = () => {
    if (isUserSet) {
      setIsModalOpen(false);
    }
  };

  // Если пользователь не авторизован - показываем только модальное окно
  if (!isUserSet) {
    return <UserModal isOpen={isModalOpen} onClose={handleCloseModal} />;
  }

  // Если пользователь авторизован - показываем основное приложение с WebSocket
  return (
    <>
      <UserModal isOpen={isModalOpen} onClose={handleCloseModal} />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<RoomsList />} />
          <Route path="/room/:roomId" element={<RoomDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;