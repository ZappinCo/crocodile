// src/components/DrawingCanvas.tsx
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addStroke,
  updateCanvasSize,
  setBrushColor,
  setBrushSize,
  clearCanvas,
  setEraserMode,
  undoStroke,
  redoStroke
} from '../features/drawingSlice';
import type { RootState } from '../store';
import Pallete from './Pallete';
// ========== ТИПЫ ==========

export interface Point {
  x: number;
  y: number;
}

export interface Brush {
  color: string;
  size: number;
  brushType?: string;
  eraser?: boolean;
}

export interface Stroke {
  id?: number;
  relative: Point[];
  brush: Brush;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface DrawingState {
  brush: Brush;
  strokes: Stroke[];
  canvasSize: CanvasSize;
  eraserMode: boolean;
  history: {
    past: string[];
    future: string[];
  };
}

export interface DrawingCanvasRef {
  clear: () => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  toggleEraser: () => void;
  undo: () => void;
  redo: () => void;
  exportPNG: () => string | undefined;
  getLineWidth: (brushSize: number, canvasWidth: number, canvasHeight: number) => number;
}

interface DrawingCanvasProps {
  backgroundColor?: string;
  className?: string;
  onDraw?: (point: Point) => void;
  width?: number;
  height?: number;
}

// ========== КОМПОНЕНТ ==========

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(({
  backgroundColor = '#ffffff',
  className = '',
  onDraw = () => { },
  width = 800,
  height = 600
}, ref) => {
  const dispatch = useDispatch();

  // Селекторы для получения состояния из Redux
  const brush = useSelector((state: RootState) => state.drawing.brush);
  const strokes = useSelector((state: RootState) => state.drawing.strokes);
  const eraserMode = useSelector((state: RootState) => state.drawing.eraserMode);
  const canvasSize = useSelector((state: RootState) => state.drawing.canvasSize);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const currentStrokeRef = useRef<Point[]>([]);
  const saveTimeoutRef = useRef<number | null>(null);

  // Обновляем размер канваса в Redux при изменении пропсов
  useEffect(() => {
    if (width !== canvasSize.width || height !== canvasSize.height) {
      dispatch(updateCanvasSize({ width, height }));
    }
  }, [width, height, canvasSize.width, canvasSize.height, dispatch]);

  // Функция расчета толщины линии
  const getLineWidth = useCallback((brushSize: number = 0.2, canvasWidth: number, canvasHeight: number): number => {
    const baseWidth = 20;
    const scale = Math.min(canvasWidth, canvasHeight) / 800;
    return Math.max(1, brushSize * baseWidth * scale);
  }, []);

  // Получение относительных координат (0-1)
  const getRelativeCoords = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y))
    };
  }, []);

  // Перерисовка всех штрихов
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    // Очищаем фон
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Рисуем все сохраненные штрихи
    strokes.forEach((stroke: Stroke) => {
      if (stroke.relative && stroke.relative.length > 0) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = stroke.brush?.color || '#000000';
        ctx.lineWidth = getLineWidth(stroke.brush?.size, canvas.width, canvas.height);
        ctx.globalCompositeOperation = stroke.brush?.eraser ? 'destination-out' : 'source-over';

        ctx.beginPath();
        stroke.relative.forEach((point, i) => {
          const x = point.x * canvas.width;
          const y = point.y * canvas.height;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
        ctx.restore();
      }
    });
  }, [strokes, backgroundColor, getLineWidth]);

  // Инициализация канваса
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = getLineWidth(brush.size, canvasSize.width, canvasSize.height);
    ctx.strokeStyle = brush.color;
    ctx.globalCompositeOperation = eraserMode ? 'destination-out' : 'source-over';

    contextRef.current = ctx;
    redrawCanvas();
  }, [canvasSize.width, canvasSize.height, brush.size, brush.color, eraserMode, redrawCanvas, getLineWidth]);

  // Перерисовка при изменении штрихов
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Сохранение текущего штриха в Redux
  const saveStroke = useCallback(() => {
    if (currentStrokeRef.current.length > 0) {
      dispatch(addStroke({
        relative: [...currentStrokeRef.current],
        brush: {
          color: brush.color,
          size: brush.size,
          brushType: brush.brushType || 'round',
          eraser: eraserMode
        }
      }));
    }
    currentStrokeRef.current = [];
  }, [brush.color, brush.size, brush.brushType, eraserMode, dispatch]);

  // Отложенное сохранение для оптимизации
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveStroke();
    }, 300);
  }, [saveStroke]);

  // Начало рисования
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getRelativeCoords(e);
    currentStrokeRef.current = [coords];
    setIsDrawing(true);

    const ctx = contextRef.current;
    if (ctx) {
      ctx.beginPath();
      const x = coords.x * canvasSize.width;
      const y = coords.y * canvasSize.height;
      ctx.moveTo(x, y);

      // Настройка кисти перед рисованием
      ctx.lineWidth = getLineWidth(brush.size, canvasSize.width, canvasSize.height);
      ctx.strokeStyle = brush.color;
      ctx.globalCompositeOperation = eraserMode ? 'destination-out' : 'source-over';
    }
  }, [getRelativeCoords, canvasSize.width, canvasSize.height, brush.size, brush.color, eraserMode, getLineWidth]);

  // Процесс рисования
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getRelativeCoords(e);
    currentStrokeRef.current.push(coords);

    const ctx = contextRef.current;
    if (ctx) {
      const x = coords.x * canvasSize.width;
      const y = coords.y * canvasSize.height;

      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);

      scheduleSave();
      onDraw(coords);
    }
  }, [isDrawing, getRelativeCoords, canvasSize.width, canvasSize.height, scheduleSave, onDraw]);

  // Завершение рисования
  const stopDrawing = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    saveStroke();
    setIsDrawing(false);
  }, [saveStroke]);

  // Очистка таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Экспорт методов через ref
  useImperativeHandle(ref, () => ({
    clear: () => {
      dispatch(clearCanvas());
    },
    setColor: (color: string) => {
      dispatch(setBrushColor(color));
    },
    setSize: (size: number) => {
      dispatch(setBrushSize(size));
    },
    toggleEraser: () => {
      dispatch(setEraserMode(!eraserMode));
    },
    undo: () => {
      dispatch(undoStroke());
    },
    redo: () => {
      dispatch(redoStroke());
    },
    exportPNG: () => {
      return canvasRef.current?.toDataURL('image/png');
    },
    getLineWidth: (brushSize: number, canvasWidth: number, canvasHeight: number) => {
      return getLineWidth(brushSize, canvasWidth, canvasHeight);
    }
  }), [dispatch, eraserMode, getLineWidth]);

  return (
    <div className='canvas-container'>
      <canvas
        ref={canvasRef}
        className={`drawing-canvas ${className}`}
        style={{
          cursor: isDrawing ? 'grabbing' : eraserMode ? 'cell' : 'crosshair',
          touchAction: 'none',
          border: '2px solid #ddd',
          borderRadius: '8px',
          backgroundColor,
          display: 'block',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          width: '100%',
          height: 'auto'
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
      />
      <Pallete />
    </div>
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;