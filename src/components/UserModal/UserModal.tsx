import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setUsername, selectUsername } from '../../store/slices/user.slice';
import '../../styles/components/user-modal.css';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const currentUsername = useAppSelector(selectUsername);
  
  const [username, setUsernameLocal] = useState(currentUsername);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUsernameLocal(currentUsername);
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, currentUsername]);

  const validateUsername = (name: string): string | null => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return 'Имя пользователя не может быть пустым';
    }
    
    if (trimmedName.length < 2) {
      return 'Имя пользователя должно содержать минимум 2 символа';
    }
    
    if (trimmedName.length > 20) {
      return 'Имя пользователя не может быть длиннее 20 символов';
    }
    
    if (!/^[a-zA-Zа-яА-Я0-9_]+$/.test(trimmedName)) {
      return 'Имя пользователя может содержать только буквы, цифры и подчеркивания';
    }
    
    return null;
  };

  const handleConfirm = () => {
    const validationError = validateUsername(username);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    const trimmedName = username.trim();
    dispatch(setUsername(trimmedName));
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Добро пожаловать!</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="input-group">
            <label htmlFor="username">Ваше имя:</label>
            <input
              ref={inputRef}
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsernameLocal(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Введите имя..."
              autoComplete="off"
              className={error ? 'error' : ''}
            />
            {error && <div className="error-message">{error}</div>}
          </div>
          
          <div className="modal-info">
            <p>ℹ️ Имя будет использоваться для идентификации в комнатах</p>
            <p>💡 Вы можете использовать латиницу, кириллицу, цифры и _</p>
            <p>✅ Допустимая длина: от 2 до 20 символов</p>
            <p>🎮 После входа вы сможете создавать и присоединяться к комнатам</p>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Отмена
          </button>
          <button className="btn-confirm" onClick={handleConfirm}>
            Начать игру
          </button>
        </div>
      </div>
    </div>
  );
};