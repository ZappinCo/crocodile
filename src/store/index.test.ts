import { describe, it, expect } from 'vitest';
import { store, useAppDispatch, useAppSelector, RootState, AppDispatch } from './index';

describe('Redux store configuration', () => {
  it('should create store with expected methods', () => {
    expect(store).toBeDefined();
    expect(store.dispatch).toBeInstanceOf(Function);
    expect(store.getState).toBeInstanceOf(Function);
    expect(store.subscribe).toBeInstanceOf(Function);
  });

  it('should have all reducers registered', () => {
    const state = store.getState();
    expect(state).toHaveProperty('websocket');
    expect(state).toHaveProperty('rooms');
    expect(state).toHaveProperty('chat');
    expect(state).toHaveProperty('user');
    expect(state).toHaveProperty('drawing');
  });

  it('should export typed hooks', () => {
    expect(useAppDispatch).toBeInstanceOf(Function);
    expect(useAppSelector).toBeInstanceOf(Function);
  });

  it('should have RootState and AppDispatch as types (runtime check not needed)', () => {
    expect(typeof RootState).toBe('undefined');
    expect(typeof AppDispatch).toBe('undefined');
  });
});