import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { useAppSelector } from './store';
import webSocketService from './services/websocket.service';
import { selectIsUserSet } from './store/slices/user.slice';
import { MainLayout } from './layouts/MainLayout';
import { RoomsList } from './components/RoomsList/RoomsList';
import { RoomDetail } from './components/RoomDetail';
import { UserModal } from './components/UserModal/UserModal';
import { About } from './components/About/About';

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

  if (!isUserSet) {
    return <UserModal isOpen={isModalOpen} onClose={handleCloseModal} />;
  }

  return (
    <>
      <UserModal isOpen={isModalOpen} onClose={handleCloseModal} />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<RoomsList />} />
          <Route path="/about" element={<About />} />
          <Route path="/room/:roomId" element={<RoomDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;