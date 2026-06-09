import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { selectUserForWebSocket } from '../../store/slices/user.slice';
import { createRoom } from '../../store/slices/rooms.slice';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState(6);
  const [words, setWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const wordsInputRef = useRef<HTMLInputElement>(null);
  const userForWS = useAppSelector(selectUserForWebSocket);

  const resetForm = () => {
    setRoomName('');
    setDescription('');
    setCapacity(6);
    setWords([]);
    setNewWord('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleAddWord = () => {
    const word = newWord.trim().toLowerCase();
    if (!word) return;
    if (words.includes(word)) {
      alert('Такое слово уже есть');
      return;
    }
    if (word.length < 2) {
      alert('Слово должно содержать минимум 2 символа');
      return;
    }
    if (word.length > 20) {
      alert('Слово не может быть длиннее 20 символов');
      return;
    }
    setWords([...words, word]);
    setNewWord('');
    wordsInputRef.current?.focus();
  };

  const handleRemoveWord = (wordToRemove: string) => {
    setWords(words.filter(w => w !== wordToRemove));
  };

  const handleSubmit = () => {
    const trimmedName = roomName.trim();
    if (!trimmedName) {
      setError('Название комнаты не может быть пустым');
      return;
    }
    if (trimmedName.length < 3) {
      setError('Название должно содержать минимум 3 символа');
      return;
    }
    if (trimmedName.length > 30) {
      setError('Название не может быть длиннее 30 символов');
      return;
    }

    dispatch(createRoom({
      room_id: null,
      name: trimmedName,
      description: description.trim() || null,
      capacity,
      words: words.length > 0 ? words : undefined,
      creator_id: userForWS.user_id,
      creator_name: userForWS.user_name
    }));
    handleClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleWordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddWord();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Создать новую комнату</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="input-group">
            <label htmlFor="roomName">Название комнаты *</label>
            <input
              ref={inputRef}
              id="roomName"
              type="text"
              value={roomName}
              onChange={(e) => {
                setRoomName(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Например: Веселые крокодилы"
              autoComplete="off"
              className={error ? 'error' : ''}
            />
            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="input-group">
            <label htmlFor="description">Описание (необязательно)</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Краткое описание комнаты..."
            />
          </div>

          <div className="input-group">
            <label htmlFor="capacity">Максимум игроков</label>
            <select
              className="edit-field"
              id="capacity"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            >
              <option value={4}>4 игрока</option>
              <option value={6}>6 игроков</option>
              <option value={8}>8 игроков</option>
              <option value={10}>10 игроков</option>
            </select>
          </div>

          <div className="input-group">
            <label>Слова для угадывания (необязательно)</label>
            <div className="words-list">
              {words.length === 0 ? (
                <div className="words-empty">Список слов пуст. Будут использованы стандартные слова.</div>
              ) : (
                words.map((word, idx) => (
                  <span key={idx} className="word-tag">
                    {word}
                    <button
                      type="button"
                      className="remove-word-btn"
                      onClick={() => handleRemoveWord(word)}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="add-word-form">
              <input
                ref={wordsInputRef}
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={handleWordKeyDown}
                placeholder="Введите слово и нажмите Enter..."
                maxLength={20}
              />
              <button type="button" onClick={handleAddWord} className="add-word-btn">
                ➕ Добавить
              </button>
            </div>
            <small className="words-hint">
              💡 Если не добавить слова, будут использоваться стандартные. Ведущий будет загадывать слова случайным образом.
            </small>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={handleClose}>
            Отмена
          </button>
          <button className="btn-confirm" onClick={handleSubmit}>
            Создать
          </button>
        </div>
      </div>
    </div>
  );
};