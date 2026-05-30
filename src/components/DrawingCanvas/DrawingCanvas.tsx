// src/components/DrawingCanvas/DrawingCanvas.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { addStroke, clearCanvas } from '../../store/slices/drawing.slice';
import { selectBrush, selectEraserMode } from '../../store/slices/drawing.slice';
import { selectCurrentRoom } from '../../store/slices/rooms.slice';
import { selectUser } from '../../store/slices/user.slice';
import { Pallete } from './Pallete';
import '../../styles/components/drawing-canvas.css';

export const DrawingCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ points: { x: number; y: number }[] }>({ points: [] });

  const brush = useAppSelector(selectBrush);
  const eraserMode = useAppSelector(selectEraserMode);
  const dispatch = useAppDispatch();

  const room = useAppSelector(selectCurrentRoom);
  const user = useAppSelector(selectUser);
  const [isLeader, setIsLeader] = useState(false);


  useEffect(() => {
    setIsLeader(room?.leader_id === user.id);
  }, [room?.leader_id, user.id])

  // Инициализация canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);
        contextRef.current = ctx;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getCanvasCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasCoordinates(e);
    setIsDrawing(true);
    setCurrentStroke({ points: [{ x, y }] });

    const ctx = contextRef.current;
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = brush.size * 50;
      ctx.strokeStyle = eraserMode ? '#f0f0f0' : brush.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [getCanvasCoordinates, brush, eraserMode]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const { x, y } = getCanvasCoordinates(e);
    const ctx = contextRef.current;

    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);

      setCurrentStroke(prev => ({
        points: [...prev.points, { x, y }]
      }));
    }
  }, [isDrawing, getCanvasCoordinates]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;

    if (currentStroke.points.length > 1) {
      dispatch(addStroke({
        relative: currentStroke.points,
        brush: {
          color: eraserMode ? '#f0f0f0' : brush.color,
          size: brush.size,
          brushType: 'round',
          eraser: eraserMode
        }
      }));
    }

    setIsDrawing(false);
    setCurrentStroke({ points: [] });
  }, [isDrawing, currentStroke, eraserMode, brush, dispatch]);

  const handleClearCanvas = () => {
    if (window.confirm('Очистить весь рисунок?')) {
      const ctx = contextRef.current;
      const canvas = canvasRef.current;
      if (ctx && canvas) {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        dispatch(clearCanvas());
      }
    }
  };

  const drawingProps = isLeader ? {
    onMouseDown: startDrawing,
    onMouseMove: draw,
    onMouseUp: stopDrawing,
    onMouseLeave: stopDrawing,
    onTouchStart: startDrawing,
    onTouchMove: draw,
    onTouchEnd: stopDrawing,
    onTouchCancel: stopDrawing,
  } : {};

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        style={{
          cursor: isDrawing ? 'grabbing' : 'crosshair',
          touchAction: 'none'
        }}
        {...drawingProps}
      />
      {isLeader && <Pallete />}
    </div>
  );
};