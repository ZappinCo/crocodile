// src/store/slices/drawing.slice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface Point {
  x: number;
  y: number;
}

export interface Brush {
  color: string;
  size: number;
  brushType: string;
  eraser?: boolean;
}

export interface Stroke {
  id: number;
  relative: Point[];
  brush: Brush;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface DrawingState {
  brush: Brush;
  eraserMode: boolean;
  strokes: Stroke[];
  canvasSize: CanvasSize;
  history: {
    past: string[];
    future: string[];
  };
}

export interface AddStrokePayload {
  relative: Point[];
  brush?: Partial<Brush> & { eraser?: boolean };
}

export interface UpdateCanvasSizePayload {
  width: number;
  height: number;
}

const initialState: DrawingState = {
  brush: {
    color: '#000000',
    size: 0.2,
    brushType: 'round'
  },
  eraserMode: false,
  strokes: [],
  canvasSize: {
    width: 800,
    height: 600
  },
  history: {
    past: [],
    future: []
  }
};

const drawingSlice = createSlice({
  name: 'drawing',
  initialState,
  reducers: {
    setBrushColor: (state, action: PayloadAction<string>) => {
      state.brush.color = action.payload;
      if (state.eraserMode) {
        state.eraserMode = false;
      }
      console.log('🎨 Brush color changed to:', action.payload);
    },

    setBrushSize: (state, action: PayloadAction<number>) => {
      state.brush.size = Math.max(0.01, Math.min(1, action.payload));
      console.log('📏 Brush size changed to:', state.brush.size);
    },

    setEraserMode: (state, action: PayloadAction<boolean>) => {
      state.eraserMode = action.payload;
      console.log('🧽 Eraser mode:', action.payload ? 'ON' : 'OFF');
    },

    addStroke: (state, action: PayloadAction<AddStrokePayload>) => {
      const stroke: Stroke = {
        id: Date.now() + Math.random(),
        relative: action.payload.relative || [],
        brush: {
          color: action.payload.brush?.color ?? state.brush.color,
          size: action.payload.brush?.size ?? state.brush.size,
          brushType: action.payload.brush?.brushType ?? 'round',
          eraser: action.payload.brush?.eraser !== undefined
            ? action.payload.brush.eraser
            : state.eraserMode
        }
      };

      // Сохраняем текущее состояние в историю
      state.history.past.push(JSON.stringify(state.strokes));
      state.history.future = [];

      // Добавляем новый штрих
      state.strokes.push(stroke);
      console.log('✏️ Stroke added, total strokes:', state.strokes.length);
    },

    clearCanvas: (state) => {
      state.history.past.push(JSON.stringify(state.strokes));
      state.strokes = [];
      state.history.future = [];
      console.log('🗑️ Canvas cleared');
    },

    undoStroke: (state) => {
      if (state.history.past.length === 0) return;
      
      state.history.future.push(JSON.stringify(state.strokes));
      const previousStrokes = state.history.past.pop();
      if (previousStrokes) {
        state.strokes = JSON.parse(previousStrokes);
        console.log('↩️ Undo performed');
      }
    },

    redoStroke: (state) => {
      if (state.history.future.length === 0) return;
      
      state.history.past.push(JSON.stringify(state.strokes));
      const nextStrokes = state.history.future.pop();
      if (nextStrokes) {
        state.strokes = JSON.parse(nextStrokes);
        console.log('↪️ Redo performed');
      }
    },

    updateCanvasSize: (state, action: PayloadAction<UpdateCanvasSizePayload>) => {
      state.canvasSize = action.payload;
      console.log('📐 Canvas size updated:', action.payload);
    },

    loadStrokes: (state, action: PayloadAction<Stroke[]>) => {
      state.strokes = action.payload;
      state.history = { past: [], future: [] };
      console.log('📂 Loaded', action.payload.length, 'strokes');
    },

    resetDrawingState: () => initialState,
  },
});

export const {
  setBrushColor,
  setBrushSize,
  setEraserMode,
  addStroke,
  clearCanvas,
  undoStroke,
  redoStroke,
  updateCanvasSize,
  loadStrokes,
  resetDrawingState
} = drawingSlice.actions;

// Селекторы
export const selectBrush = (state: { drawing: DrawingState }) => state.drawing.brush;
export const selectBrushColor = (state: { drawing: DrawingState }) => state.drawing.brush.color;
export const selectBrushSize = (state: { drawing: DrawingState }) => state.drawing.brush.size;
export const selectEraserMode = (state: { drawing: DrawingState }) => state.drawing.eraserMode;
export const selectStrokes = (state: { drawing: DrawingState }) => state.drawing.strokes;
export const selectCanvasSize = (state: { drawing: DrawingState }) => state.drawing.canvasSize;
export const selectHistory = (state: { drawing: DrawingState }) => state.drawing.history;
export const selectCanUndo = (state: { drawing: DrawingState }) => state.drawing.history.past.length > 0;
export const selectCanRedo = (state: { drawing: DrawingState }) => state.drawing.history.future.length > 0;
export const selectLastStroke = (state: { drawing: DrawingState }) => {
  const strokes = state.drawing.strokes;
  return strokes.length > 0 ? strokes[strokes.length - 1] : null;
};
export const selectStrokesCount = (state: { drawing: DrawingState }) => state.drawing.strokes.length;
export const selectCurrentTool = (state: { drawing: DrawingState }) => ({
  isEraser: state.drawing.eraserMode,
  brushColor: state.drawing.brush.color,
  brushSize: state.drawing.brush.size
});
export const selectIsCanvasEmpty = (state: { drawing: DrawingState }) => 
  state.drawing.strokes.length === 0;

export default drawingSlice.reducer;