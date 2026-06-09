import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Pallete } from './Pallete';
import drawingReducer from '../../store/slices/drawing.slice';

vi.mock('./PalleteItem', () => ({
  PalleteItem: ({ data }: { data: any }) => (
    <div data-testid={`pallete-item-${data.type}`}>
      {data.type === 'color' ? `Color: ${data.color}` : data.type}
    </div>
  ),
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      drawing: drawingReducer,
    },
    preloadedState: {
      drawing: {
        brush: { color: '#000000', size: 0.2, brushType: 'round' },
        eraserMode: false,
        strokes: [],
        canvasSize: { width: 800, height: 600 },
        history: { past: [], future: [] },
      },
    },
  });
};

describe('Pallete', () => {
  it('renders all items', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <Pallete />
      </Provider>
    );

    const allItems = screen.getAllByTestId(/pallete-item-/);
    expect(allItems).toHaveLength(16);

    const colorItems = screen.getAllByTestId('pallete-item-color');
    expect(colorItems).toHaveLength(10);

    const sizeItems = screen.getAllByTestId('pallete-item-size');
    expect(sizeItems).toHaveLength(5);

    const clearItems = screen.getAllByTestId('pallete-item-clear');
    expect(clearItems).toHaveLength(1);
  });

  it('applies correct CSS classes', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <Pallete />
      </Provider>
    );
    const palleteDiv = container.firstChild;
    expect(palleteDiv).toHaveClass('pallete-container');
    expect(palleteDiv).toHaveClass('animate-fade-in-down');
  });

  it('renders without Redux errors when store has default drawing state', () => {
    const store = createTestStore();
    expect(() =>
      render(
        <Provider store={store}>
          <Pallete />
        </Provider>
      )
    ).not.toThrow();
  });
});