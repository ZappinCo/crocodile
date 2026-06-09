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
  points: Point[];
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
  points: Point[];
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
    },

    setBrushSize: (state, action: PayloadAction<number>) => {
      state.brush.size = Math.max(0.01, Math.min(1, action.payload));
    },

    addStroke: (state, action: PayloadAction<AddStrokePayload>) => {
      const stroke: Stroke = {
        id: Date.now() + Math.random(),
        points: action.payload.points || [],
        brush: {
          color: action.payload.brush?.color ?? state.brush.color,
          size: action.payload.brush?.size ?? state.brush.size,
          brushType: action.payload.brush?.brushType ?? 'round',
          eraser: action.payload.brush?.eraser !== undefined
            ? action.payload.brush.eraser
            : state.eraserMode
        }
      };

      state.history.past.push(JSON.stringify(state.strokes));
      state.history.future = [];

      state.strokes.push(stroke);
    },

    setStrokes: (state, action: PayloadAction<Stroke[]>)=>{
        console.log("setStrokes",action.payload)
        state.strokes = action.payload;
    },

    clearCanvas: (state) => {
      state.history.past.push(JSON.stringify(state.strokes));
      state.strokes = [];
      state.history.future = [];
    },

    updateCanvasSize: (state, action: PayloadAction<UpdateCanvasSizePayload>) => {
      state.canvasSize = action.payload;
    },

    loadStrokes: (state, action: PayloadAction<Stroke[]>) => {
      state.strokes = action.payload;
      state.history = { past: [], future: [] };
    },

    resetDrawingState: () => initialState,
  },
});

export const {
  setBrushColor,
  setBrushSize,
  setStrokes,
  addStroke,
  clearCanvas,
  updateCanvasSize,
  loadStrokes,
  resetDrawingState
} = drawingSlice.actions;


export const sendStroke = (payload:AddStrokePayload) => ({
  type: 'drawing/sendStroke',
  payload: payload,
  meta: { webSocket: true, event: 'send_stroke' }
});

export const selectBrush = (state: { drawing: DrawingState }) => state.drawing.brush;
export const selectBrushColor = (state: { drawing: DrawingState }) => state.drawing.brush.color;
export const selectBrushSize = (state: { drawing: DrawingState }) => state.drawing.brush.size;
export const selectStrokes = (state: { drawing: DrawingState }) => state.drawing.strokes;
export const selectCanvasSize = (state: { drawing: DrawingState }) => state.drawing.canvasSize;
export const selectHistory = (state: { drawing: DrawingState }) => state.drawing.history;
export const selectLastStroke = (state: { drawing: DrawingState }) => {
  const strokes = state.drawing.strokes;
  return strokes.length > 0 ? strokes[strokes.length - 1] : null;
};
export const selectCurrentTool = (state: { drawing: DrawingState }) => ({
  isEraser: state.drawing.eraserMode,
  brushColor: state.drawing.brush.color,
  brushSize: state.drawing.brush.size
});
export const selectIsCanvasEmpty = (state: { drawing: DrawingState }) => 
  state.drawing.strokes.length === 0;

export default drawingSlice.reducer;