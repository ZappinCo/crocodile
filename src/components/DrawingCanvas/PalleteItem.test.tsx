import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { PalleteItem } from './PalleteItem';
import drawingReducer, {
  setBrushColor,
  setBrushSize,
  clearCanvas,
} from '../../store/slices/drawing.slice';
import type { PalleteItemData } from './Pallete';

vi.mock('../../assets/delete-icon.svg', () => ({
  default: 'delete-icon.svg',
}));

describe('PalleteItem', () => {
  const createStore = () =>
    configureStore({
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

  it('renders color item correctly', () => {
    const store = createStore();
    const colorData: PalleteItemData = { type: 'color', color: '#FF0000' };
    render(
      <Provider store={store}>
        <PalleteItem data={colorData} />
      </Provider>
    );
    const item = screen.getByTitle(`Цвет: #FF0000`);
    expect(item).toBeInTheDocument();
    expect(item).toHaveStyle(`background-color: #FF0000`);
  });

  it('dispatches setBrushColor on color click', () => {
    const store = createStore();
    const dispatchSpy = vi.spyOn(store, 'dispatch');
    const colorData: PalleteItemData = { type: 'color', color: '#00FF00' };
    render(
      <Provider store={store}>
        <PalleteItem data={colorData} />
      </Provider>
    );
    const item = screen.getByTitle(`Цвет: #00FF00`);
    fireEvent.click(item);
    expect(dispatchSpy).toHaveBeenCalledWith(setBrushColor('#00FF00'));
  });

  it('renders size item correctly', () => {
    const store = createStore();
    const sizeData: PalleteItemData = { type: 'size', size: 0.3 };
    render(
      <Provider store={store}>
        <PalleteItem data={sizeData} />
      </Provider>
    );
    const item = screen.getByTitle(`Размер: 30%`);
    expect(item).toBeInTheDocument();
    const circle = item.querySelector('.size-circle');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveStyle('width: 8.4px');
  });

  it('dispatches setBrushSize on size click', () => {
    const store = createStore();
    const dispatchSpy = vi.spyOn(store, 'dispatch');
    const sizeData: PalleteItemData = { type: 'size', size: 0.5 };
    render(
      <Provider store={store}>
        <PalleteItem data={sizeData} />
      </Provider>
    );
    const item = screen.getByTitle(`Размер: 50%`);
    fireEvent.click(item);
    expect(dispatchSpy).toHaveBeenCalledWith(setBrushSize(0.5));
  });

  it('renders clear item correctly', () => {
    const store = createStore();
    const clearData: PalleteItemData = { type: 'clear' };
    render(
      <Provider store={store}>
        <PalleteItem data={clearData} />
      </Provider>
    );
    const item = screen.getByTitle('Очистить всё');
    expect(item).toBeInTheDocument();
    expect(item.querySelector('img')).toBeInTheDocument();
  });

  it('dispatches clearCanvas on clear click', () => {
    const store = createStore();
    const dispatchSpy = vi.spyOn(store, 'dispatch');
    const clearData: PalleteItemData = { type: 'clear' };
    render(
      <Provider store={store}>
        <PalleteItem data={clearData} />
      </Provider>
    );
    const item = screen.getByTitle('Очистить всё');
    fireEvent.click(item);
    expect(dispatchSpy).toHaveBeenCalledWith(clearCanvas());
  });

  it('applies active class for current color', () => {
    const store = configureStore({
      reducer: { drawing: drawingReducer },
      preloadedState: {
        drawing: {
          brush: { color: '#0000FF', size: 0.2, brushType: 'round' },
          eraserMode: false,
          strokes: [],
          canvasSize: { width: 800, height: 600 },
          history: { past: [], future: [] },
        },
      },
    });
    const colorData: PalleteItemData = { type: 'color', color: '#0000FF' };
    render(
      <Provider store={store}>
        <PalleteItem data={colorData} />
      </Provider>
    );
    const item = screen.getByTitle(`Цвет: #0000FF`);
    expect(item).toHaveClass('true');
  });

  it('applies active class for current size', () => {
    const store = configureStore({
      reducer: { drawing: drawingReducer },
      preloadedState: {
        drawing: {
          brush: { color: '#000000', size: 0.3, brushType: 'round' },
          eraserMode: false,
          strokes: [],
          canvasSize: { width: 800, height: 600 },
          history: { past: [], future: [] },
        },
      },
    });
    const sizeData: PalleteItemData = { type: 'size', size: 0.3 };
    render(
      <Provider store={store}>
        <PalleteItem data={sizeData} />
      </Provider>
    );
    const item = screen.getByTitle(`Размер: 30%`);
    expect(item).toHaveClass('true');
  });
});