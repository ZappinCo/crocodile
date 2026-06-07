import React, { useEffect, useRef } from 'react';

interface UserMenuProps {
  onEditProfile: () => void;
  onLogout: () => void;
  onClose: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onEditProfile, onLogout, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="user-menu animate-fade-in-down" ref={menuRef}>
      <div className="menu-item" onClick={onEditProfile}>
        <span className="menu-icon">✏️</span>
        Сменить имя
      </div>
      <div className="menu-divider" />
      <div className="menu-item logout" onClick={onLogout}>
        <span className="menu-icon">🚪</span>
        Выйти
      </div>
    </div>
  );
};