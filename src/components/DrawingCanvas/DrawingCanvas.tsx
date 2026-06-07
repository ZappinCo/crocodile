import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { sendStroke, selectStrokes } from '../../store/slices/drawing.slice';
import { selectBrush } from '../../store/slices/drawing.slice';
import { selectCurrentRoom } from '../../store/slices/rooms.slice';
import { selectUser } from '../../store/slices/user.slice';
import { Pallete } from './Pallete';
import '../../styles/components/drawing-canvas.css';

export const DrawingCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const bufferRef = useRef<{ x: number; y: number }[]>([]);
  const lastSentTimeRef = useRef<number>(0);
  const throttleTimeoutRef = useRef<number | null>(null);

  const brush = useAppSelector(selectBrush);
  const dispatch = useAppDispatch();

  const strokes = useAppSelector(selectStrokes);

  const room = useAppSelector(selectCurrentRoom);
  const user = useAppSelector(selectUser);
  const isLeader = useMemo(() => room?.leader_id === user.id, [room?.leader_id, user.id]);


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
    ctx.fillStyle = '#ffffff';
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

      ctx.strokeStyle = stroke.brush?.eraser ? '#ffffff' : (stroke.brush?.color || '#000000');
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
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        contextRef.current = ctx;
      }

      drawStrokes();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [drawStrokes]);

  const flushBuffer = useCallback(() => {
    if (bufferRef.current.length === 0) return;

    const pointsToSend = [...bufferRef.current];
    bufferRef.current = [];
    const last = pointsToSend.at(-1);
    if (last)
      bufferRef.current.push(last);

    const relativePoints = pointsToSend.map(point => absoluteToRelative(point.x, point.y));
    const newStroke = {
      points: relativePoints,
      brush: {
        color: brush.color,
        size: brush.size,
        brushType: 'round',
      }
    };

    dispatch(sendStroke(newStroke));
    lastSentTimeRef.current = Date.now();
  }, [absoluteToRelative, brush, dispatch]);

  const scheduleFlush = useCallback(() => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }

    const now = Date.now();
    const timeSinceLastSend = now - lastSentTimeRef.current;

    if (timeSinceLastSend >= 50) {
      flushBuffer();
    } else {
      throttleTimeoutRef.current = setTimeout(() => {
        flushBuffer();
        throttleTimeoutRef.current = null;
      }, 50 - timeSinceLastSend);
    }
  }, [flushBuffer]);

  const addPointToBuffer = useCallback((x: number, y: number) => {
    bufferRef.current.push({ x, y });

    if (bufferRef.current.length >= 10) {
      scheduleFlush();
    }
  }, [scheduleFlush]);

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
    const { x, y } = getCanvasCoordinates(e);
    setIsDrawing(true);
    bufferRef.current = [{ x, y }];

    const ctx = contextRef.current;
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = Math.max(2, brush.size * 80);
      ctx.strokeStyle = brush.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [getCanvasCoordinates, brush]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const { x, y } = getCanvasCoordinates(e);
    const ctx = contextRef.current;

    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);

      addPointToBuffer(x, y);
    }
  }, [isDrawing, getCanvasCoordinates, addPointToBuffer]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;

    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
      throttleTimeoutRef.current = null;
    }

    flushBuffer();

    setIsDrawing(false);
    bufferRef.current = [];
  }, [isDrawing, flushBuffer]);

  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

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
        }}
        {...drawingProps}
      />
      {isLeader && <Pallete />}
    </div>
  );
};