// src/components/Header.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store';
import { selectUsername, selectUserStats, clearUsername } from '../features/userSlice';
import { UserModal } from './UserModal';
import './Header.css';
import logo from '../assets/logo.svg'

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const username = useAppSelector(selectUsername);
  const userStats = useAppSelector(selectUserStats);
  const isConnected = useAppSelector(state => state.websocket.isConnected);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      dispatch(clearUsername());
      window.location.reload();
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <header className="app-header">
        <div className="header-container">
          {/* Логотип */}
          <div className="header-logo" onClick={() => navigate('/')}>
            <img src={logo} className="logo-icon"/>
            <div className="logo-text">
              <span className="logo-title">Crocodile</span>
              <span className="logo-subtitle">Рисуй с друзьями</span>
            </div>
          </div>


          <div className="header-right">
            <div className="connection-status" title={isConnected ? 'Подключено' : 'Отключено'}>
              <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
              <span className="status-text">{isConnected ? 'Online' : 'Offline'}</span>
            </div>

            <div className="user-section">
              <div className="user-info" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <div className="user-avatar">
                  {username ? username.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="user-details">
                  <div className="user-name">{username || 'Гость'}</div>
                  <div className="user-status">
                    {userStats.isValid ? 'Активен' : 'Требуется внимание'}
                  </div>
                </div>
                <div className="user-arrow">{isMenuOpen ? '▲' : '▼'}</div>
              </div>

              {isMenuOpen && (
                <div className="user-menu">
                  <div className="menu-item" onClick={handleOpenModal}>
                    <span className="menu-icon">✏️</span>
                    Сменить имя
                  </div>
                  <div className="menu-item logout" onClick={handleLogout}>
                    <span className="menu-icon">🚪</span>
                    Выйти
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <UserModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};