// src/components/PalleteItem.tsx
import React from "react";
import { useDispatch, useSelector } from 'react-redux';
import {
  setBrushColor,
  setBrushSize,
  setEraserMode,
  clearCanvas,
  undoStroke,
  redoStroke
} from '../features/drawingSlice'
import type { RootState } from '../store';
import type { PalleteItemData } from "./Pallete";
import deleteIcon from '../assets/delete-icon.svg'

interface DrawingState {
  brush: {
    color: string;
    size: number;
  };
  eraserMode: boolean;
  history: {
    past: unknown[];
    future: unknown[];
  };
}

interface PalleteItemProps {
  data: PalleteItemData;
}

const PalleteItem: React.FC<PalleteItemProps> = ({ data }) => {
  const dispatch = useDispatch();

  const drawingState = useSelector((state: RootState) => {
    const drawing = state.drawing as DrawingState | undefined;
    return {
      brush: drawing?.brush || { color: '#000000', size: 0.2 },
      eraserMode: !!drawing?.eraserMode,
      history: drawing?.history || { past: [], future: [] }
    };
  });

  const { brush, eraserMode, history } = drawingState;
  const currentColor = brush.color;
  const currentSize = brush.size;
  const canUndo = Array.isArray(history.past) && history.past.length > 0;
  const canRedo = Array.isArray(history.future) && history.future.length > 0;

  const createColorItem = (color: string) => (
    <div
      className={`pallete-item pallete-item--color ${currentColor === color ? 'active' : ''}`}
      style={{ backgroundColor: color }}
      title={`Цвет: ${color}`}
      onClick={() => dispatch(setBrushColor(color))}
    >
      {currentColor === color && <div className="active-indicator">✓</div>}
    </div>
  );

  const createSizeItem = (size: number) => (
    <div
      className={`pallete-item pallete-item--size ${Math.abs(currentSize - size) < 0.02 ? 'active' : ''}`}
      title={`Размер: ${Math.round(size * 100)}%`}
      onClick={() => dispatch(setBrushSize(size))}
    >
      <div
        className="size-circle"
        style={{
          backgroundColor: currentColor,
          width: `${size * 28}px`,
          height: `${size * 28}px`,
          borderRadius: `${size * 28}px`,
          boxShadow: `0 0 ${size * 10}px ${currentColor}40`
        }}
      />


    </div>
  );

  const createEraserItem = () => (
    <div
      className={`pallete-item pallete-item--eraser ${eraserMode ? 'active' : ''}`}
      title="Ластик"
      onClick={() => dispatch(setEraserMode(!eraserMode))}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M14.06 9.02 15.98 7.1 19.92 11.04 18 13 15.06 10.06 14.06 11.06zM3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
      </svg>
      {eraserMode && <div className="active-indicator">✓</div>}
    </div>
  );

  const createClearItem = () => (
    <div className="pallete-item pallete-item--clear" title="Очистить" onClick={() => dispatch(clearCanvas())}>
      <img src={deleteIcon} className="delete-icon" />
    </div>
  );

  const createUndoItem = () => (
    <div
      className={`pallete-item pallete-item--undo ${!canUndo ? 'disabled' : ''}`}
      title="Undo (Ctrl+Z)"
      onClick={() => canUndo && dispatch(undoStroke())}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
      </svg>
    </div>
  );

  const createRedoItem = () => (
    <div
      className={`pallete-item pallete-item--redo ${!canRedo ? 'disabled' : ''}`}
      title="Redo (Ctrl+Y)"
      onClick={() => canRedo && dispatch(redoStroke())}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
        <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 2.03-9.96 5.5l2.37.78c1.05-3.19 4.05-5.5 7.59-5.5 1.96 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />
      </svg>
    </div>
  );

  const renderItem = (): React.ReactElement => {
    switch (data.type) {
      case 'color':
        return createColorItem(data.color!);
      case 'size':
        return createSizeItem(data.size!);
      case 'eraser':
        return createEraserItem();
      case 'clear':
        return createClearItem();
      case 'undo':
        return createUndoItem();
      case 'redo':
        return createRedoItem();
      default:
        return <div>Unknown type: {data.type}</div>;
    }
  };

  return renderItem();
};

PalleteItem.displayName = 'PalleteItem';
export default PalleteItem;