import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { addStroke, clearCanvas, selectStrokes } from '../../store/slices/drawing.slice';
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

  const strokes = useAppSelector(selectStrokes);

  const room = useAppSelector(selectCurrentRoom);
  const user = useAppSelector(selectUser);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    setIsLeader(room?.leader_id === user.id);
  }, [room?.leader_id, user.id]);

  const absoluteToRelative = useCallback((absoluteX: number, absoluteY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    return {
      x: absoluteX / canvas.width,
      y: absoluteY / canvas.height
    };
  }, []);

  const relativeToAbsolute = useCallback((relativeX: number, relativeY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    return {
      x: relativeX * canvas.width,
      y: relativeY * canvas.height
    };
  }, []);

  const drawStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (strokes.length === 0) return;

    strokes.forEach(stroke => {
      if (!stroke.points || stroke.points.length === 0) return;
      const firstPoint = relativeToAbsolute(stroke.points[0].x, stroke.points[0].y);
      
      ctx.beginPath();
      ctx.moveTo(firstPoint.x, firstPoint.y);

      for (let i = 1; i < stroke.points.length; i++) {
        const point = relativeToAbsolute(stroke.points[i].x, stroke.points[i].y);
        ctx.lineTo(point.x, point.y);
      }

      ctx.strokeStyle = stroke.brush?.eraser ? '#f0f0f0' : (stroke.brush?.color || '#000000');
      ctx.lineWidth = Math.max(2, (stroke.brush?.size || 0.02) * 80);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });
  }, [strokes, relativeToAbsolute]);

  useEffect(() => {
    if (canvasRef.current && contextRef.current) {
      drawStrokes();
    }
  }, [strokes, drawStrokes]);

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
      
      drawStrokes();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawStrokes]);

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
    if (!isLeader) return;
    e.preventDefault();
    
    const { x, y } = getCanvasCoordinates(e);
    setIsDrawing(true);
    setCurrentStroke({ points: [{ x, y }] });

    const ctx = contextRef.current;
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = Math.max(2, brush.size * 80);
      ctx.strokeStyle = eraserMode ? '#f0f0f0' : brush.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [getCanvasCoordinates, brush, eraserMode, isLeader]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isLeader || !isDrawing) return;
    e.preventDefault();

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
  }, [isLeader, isDrawing, getCanvasCoordinates]);

  const stopDrawing = useCallback(() => {
    if (!isLeader || !isDrawing) return;

    if (currentStroke.points.length > 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const relativePoints = currentStroke.points.map(point => ({
        x: point.x / canvas.width,
        y: point.y / canvas.height
      }));
      
      const newStroke = {
        points: relativePoints,
        brush: {
          color: eraserMode ? '#f0f0f0' : brush.color,
          size: brush.size,
          brushType: 'round',
          eraser: eraserMode
        }
      };
      
      dispatch(addStroke(newStroke));
    }

    setIsDrawing(false);
    setCurrentStroke({ points: [] });
  }, [isLeader, isDrawing, currentStroke, eraserMode, brush, dispatch]);

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
          cursor: isLeader ? (isDrawing ? 'grabbing' : 'crosshair') : 'not-allowed',
          touchAction: 'none',
          opacity: isLeader ? 1 : 0.8,
        }}
        {...drawingProps}
      />
      {isLeader && <Pallete />}
      
      {!isLeader && (
        <div className="drawing-overlay">
          <p>🎨 Только ведущий может рисовать</p>
        </div>
      )}
    </div>
  );
};