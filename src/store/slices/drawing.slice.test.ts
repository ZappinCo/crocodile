import { describe, it, expect } from 'vitest';
import drawingReducer, {
  setBrushColor,
  setBrushSize,
  setStrokes,
  addStroke,
  clearCanvas,
  updateCanvasSize,
  loadStrokes,
  resetDrawingState,
  sendStroke,
  selectBrush,
  selectStrokes,
  selectIsCanvasEmpty,
} from './drawing.slice';
import type { AddStrokePayload, Stroke } from './drawing.slice';

describe('drawing slice', () => {
  const initialState = {
    brush: {
      color: '#000000',
      size: 0.2,
      brushType: 'round',
    },
    eraserMode: false,
    strokes: [],
    canvasSize: {
      width: 800,
      height: 600,
    },
    history: {
      past: [],
      future: [],
    },
  };

  it('should return initial state', () => {
    expect(drawingReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('reducers', () => {
    it('setBrushColor should update brush color and disable eraser mode', () => {
      let state = drawingReducer(initialState, setBrushColor('#FF0000'));
      expect(state.brush.color).toBe('#FF0000');
      expect(state.eraserMode).toBe(false);

      const stateWithEraser = { ...initialState, eraserMode: true };
      state = drawingReducer(stateWithEraser, setBrushColor('#00FF00'));
      expect(state.brush.color).toBe('#00FF00');
      expect(state.eraserMode).toBe(false);
    });

    it('setBrushSize should clamp size between 0.01 and 1', () => {
      let state = drawingReducer(initialState, setBrushSize(0.5));
      expect(state.brush.size).toBe(0.5);

      state = drawingReducer(initialState, setBrushSize(2));
      expect(state.brush.size).toBe(1);

      state = drawingReducer(initialState, setBrushSize(-0.5));
      expect(state.brush.size).toBe(0.01);
    });

    it('addStroke should add a new stroke and update history', () => {
      const strokePayload: AddStrokePayload = {
        points: [{ x: 10, y: 20 }, { x: 30, y: 40 }],
        brush: { color: '#FF0000', size: 0.3, brushType: 'round' },
      };
      let state = drawingReducer(initialState, addStroke(strokePayload));
      expect(state.strokes).toHaveLength(1);
      expect(state.strokes[0].points).toEqual(strokePayload.points);
      expect(state.strokes[0].brush.color).toBe('#FF0000');
      expect(state.strokes[0].brush.size).toBe(0.3);
      expect(state.history.past).toHaveLength(1);
      expect(state.history.future).toHaveLength(0);

      const secondStroke: AddStrokePayload = { points: [{ x: 50, y: 60 }] };
      state = drawingReducer(state, addStroke(secondStroke));
      expect(state.strokes).toHaveLength(2);
      expect(state.history.past).toHaveLength(2);
    });

    it('setStrokes should replace all strokes and reset history', () => {
      const newStrokes: Stroke[] = [
        { id: 1, points: [{ x: 1, y: 2 }], brush: { color: '#000', size: 0.2, brushType: 'round' } },
      ];
      const state = drawingReducer(initialState, setStrokes(newStrokes));
      expect(state.strokes).toEqual(newStrokes);
      expect(state.history.past).toEqual([]);
      expect(state.history.future).toEqual([]);
    });

    it('clearCanvas should save current strokes to history and clear strokes', () => {
      let state = drawingReducer(initialState, addStroke({ points: [{ x: 1, y: 2 }] }));
      expect(state.strokes).toHaveLength(1);
      expect(state.history.past).toHaveLength(1);
      state = drawingReducer(state, clearCanvas());
      expect(state.strokes).toHaveLength(0);
      expect(state.history.past).toHaveLength(2);
      expect(state.history.future).toHaveLength(0);
    });

    it('updateCanvasSize should set canvas size', () => {
      const state = drawingReducer(initialState, updateCanvasSize({ width: 1024, height: 768 }));
      expect(state.canvasSize).toEqual({ width: 1024, height: 768 });
    });

    it('loadStrokes should replace strokes and reset history', () => {
      const newStrokes: Stroke[] = [
        { id: 99, points: [{ x: 100, y: 200 }], brush: { color: '#FFF', size: 0.1, brushType: 'round' } },
      ];
      const state = drawingReducer(initialState, loadStrokes(newStrokes));
      expect(state.strokes).toEqual(newStrokes);
      expect(state.history.past).toEqual([]);
      expect(state.history.future).toEqual([]);
    });

    it('resetDrawingState should restore initial state', () => {
      let state = drawingReducer(initialState, setBrushColor('#FF00FF'));
      state = drawingReducer(state, addStroke({ points: [{ x: 10, y: 20 }] }));
      state = drawingReducer(state, resetDrawingState());
      expect(state).toEqual(initialState);
    });
  });

  describe('action creators', () => {
    it('sendStroke should create correct action with meta', () => {
      const payload: AddStrokePayload = { points: [{ x: 1, y: 2 }] };
      const action = sendStroke(payload);
      expect(action).toEqual({
        type: 'drawing/sendStroke',
        payload,
        meta: { webSocket: true, event: 'send_stroke' },
      });
    });
  });

  describe('selectors', () => {
    const state = {
      drawing: {
        brush: { color: '#123456', size: 0.7, brushType: 'round' },
        eraserMode: false,
        strokes: [{ id: 1, points: [], brush: { color: '#000', size: 0.2, brushType: 'round' } }],
        canvasSize: { width: 1024, height: 768 },
        history: { past: [], future: [] },
      },
    };

    it('selectBrush', () => {
      expect(selectBrush(state)).toEqual(state.drawing.brush);
    });

    it('selectStrokes', () => {
      expect(selectStrokes(state)).toEqual(state.drawing.strokes);
    });

    it('selectIsCanvasEmpty should be false when there are strokes', () => {
      expect(selectIsCanvasEmpty(state)).toBe(false);
      const emptyState = { drawing: { ...state.drawing, strokes: [] } };
      expect(selectIsCanvasEmpty(emptyState)).toBe(true);
    });
  });
});