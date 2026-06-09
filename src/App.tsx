import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import webSocketService from './services/websocket.service';
import { MainLayout } from './layouts/MainLayout';
import { RoomsList } from './components/RoomsList/RoomsList';
import { RoomDetail } from './components/RoomDetail';
import { About } from './components/About/About';

function App() {
  useEffect(() => {
    webSocketService.connect();
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  return (
    <>
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