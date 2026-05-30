// src/components/DrawingCanvas/PalleteItem.tsx
import React from "react";
import { useDispatch, useSelector } from 'react-redux';
import { 
  setBrushColor, 
  setBrushSize, 
  setEraserMode, 
  clearCanvas, 
  undoStroke, 
  redoStroke 
} from '../../store/slices/drawing.slice';
import type { RootState } from '../../store';
import type { PalleteItemData } from "./Pallete";
import deleteIcon from '../../assets/delete-icon.svg';

interface PalleteItemProps {
  data: PalleteItemData;
}

export const PalleteItem: React.FC<PalleteItemProps> = ({ data }) => {
  const dispatch = useDispatch();
  const brush = useSelector((state: RootState) => state.drawing.brush);
  const eraserMode = useSelector((state: RootState) => state.drawing.eraserMode);
  const history = useSelector((state: RootState) => state.drawing.history);
  
  const currentColor = brush.color;
  const currentSize = brush.size;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const handleColorClick = (color: string) => {
    dispatch(setBrushColor(color));
    if (eraserMode) dispatch(setEraserMode(false));
  };

  const handleSizeClick = (size: number) => {
    dispatch(setBrushSize(size));
    if (eraserMode) dispatch(setEraserMode(false));
  };

  const handleEraserClick = () => {
    dispatch(setEraserMode(!eraserMode));
    if (!eraserMode) {
      dispatch(setBrushColor('#f0f0f0'));
    } else {
      dispatch(setBrushColor('#000000'));
    }
  };

  const renderColorItem = (color: string) => (
    <div
      className={`pallete-item pallete-item--color ${currentColor === color && !eraserMode ? 'active' : ''}`}
      style={{ backgroundColor: color, border: color === '#ffffff' ? '1px solid #ddd' : 'none' }}
      title={`Цвет: ${color}`}
      onClick={() => handleColorClick(color)}
    >
      {currentColor === color && !eraserMode && <div className="active-indicator">✓</div>}
    </div>
  );

  const renderSizeItem = (size: number) => (
    <div
      className={`pallete-item pallete-item--size ${Math.abs(currentSize - size) < 0.02 && !eraserMode ? 'active' : ''}`}
      title={`Размер: ${Math.round(size * 100)}%`}
      onClick={() => handleSizeClick(size)}
    >
      <div
        className="size-circle"
        style={{
          backgroundColor: currentColor,
          width: `${size * 28}px`,
          height: `${size * 28}px`,
          borderRadius: '50%',
          boxShadow: `0 0 ${size * 10}px ${currentColor}40`
        }}
      />
      {Math.abs(currentSize - size) < 0.02 && !eraserMode && <div className="active-indicator">✓</div>}
    </div>
  );

  const renderEraserItem = () => (
    <div
      className={`pallete-item pallete-item--eraser ${eraserMode ? 'active' : ''}`}
      title="Ластик"
      onClick={handleEraserClick}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M14.06 9.02 15.98 7.1 19.92 11.04 18 13 15.06 10.06 14.06 11.06zM3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
      </svg>
      {eraserMode && <div className="active-indicator">✓</div>}
    </div>
  );

  const renderClearItem = () => (
    <div 
      className="pallete-item pallete-item--clear" 
      title="Очистить всё" 
      onClick={() => dispatch(clearCanvas())}
    >
      <img src={deleteIcon} className="delete-icon" alt="Очистить" />
    </div>
  );

  const renderUndoItem = () => (
    <div
      className={`pallete-item pallete-item--undo ${!canUndo ? 'disabled' : ''}`}
      title="Отменить (Ctrl+Z)"
      onClick={() => canUndo && dispatch(undoStroke())}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
      </svg>
    </div>
  );

  const renderRedoItem = () => (
    <div
      className={`pallete-item pallete-item--redo ${!canRedo ? 'disabled' : ''}`}
      title="Повторить (Ctrl+Y)"
      onClick={() => canRedo && dispatch(redoStroke())}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 2.03-9.96 5.5l2.37.78c1.05-3.19 4.05-5.5 7.59-5.5 1.96 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />
      </svg>
    </div>
  );

  switch (data.type) {
    case 'color':
      return renderColorItem(data.color!);
    case 'size':
      return renderSizeItem(data.size!);
    case 'eraser':
      return renderEraserItem();
    case 'clear':
      return renderClearItem();
    case 'undo':
      return renderUndoItem();
    case 'redo':
      return renderRedoItem();
    default:
      return <div>Unknown type: {data.type}</div>;
  }
};