import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectUsername, clearUsername } from '../../store/slices/user.slice';
import { UserModal } from '../UserModal/UserModal';
import { UserMenu } from './UserMenu';
import { selectIsUserSet } from '../../store/slices/user.slice';
import logo from '../../assets/logo.svg';
import '../../styles/components/header.css';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const username = useAppSelector(selectUsername);
  const isConnected = useAppSelector(state => state.websocket.isConnected);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      dispatch(clearUsername());
      window.location.reload();
    }
  };

  const isUserSet = useAppSelector(selectIsUserSet);
  useEffect(() => {
    if (!isUserSet)
      handleOpenModal();
  }, [isUserSet])

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const getInitials = () => {
    return username ? username.charAt(0).toUpperCase() : '?';
  };

  return (
    <>
      <header className="app-header">
        <div className="header-container">
          <div className="header-logo" onClick={() => navigate('/')}>
            <img src={logo} className="logo-icon" alt="Crocodile Logo" />
            <div className="logo-text">
              <span className="logo-title">Крокодил</span>
              <span className="logo-subtitle">Рисуй и угадывай</span>
            </div>
          </div>


          <div className="header-right">
            <div className="connection-status" title={isConnected ? 'Подключено' : 'Отключено'}>
              <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
              <span className="status-text">{isConnected ? 'Online' : 'Offline'}</span>
            </div>

            <button
              className={`nav-btn ${location.pathname === '/about' ? 'active' : ''}`}
              onClick={() => navigate('/about')}
            >
              <span className="nav-icon">ℹ️</span>
              <span className="nav-text">О проекте</span>
            </button>

            <div className="user-section">
              <div className="user-info" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <div className="user-avatar" style={{ background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` }}>
                  {getInitials()}
                </div>
                <div className="user-details">
                  <div className="user-name">{username || 'Гость'}</div>
                </div>
                <div className="user-arrow">{isMenuOpen ? '▲' : '▼'}</div>
              </div>

              {isMenuOpen && (
                <UserMenu
                  onEditProfile={handleOpenModal}
                  onLogout={handleLogout}
                  onClose={() => setIsMenuOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <UserModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};