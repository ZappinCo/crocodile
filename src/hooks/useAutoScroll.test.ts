import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAutoScroll } from './useAutoScroll';

describe('useAutoScroll', () => {
  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn();
  });

  it('initializes with autoScroll true', () => {
    const { result } = renderHook(() => useAutoScroll([]));
    expect(result.current.autoScroll).toBe(true);
    expect(result.current.isNearBottom).toBe(true);
    expect(result.current.containerRef.current).toBeNull();
  });

  it('scrolls to bottom when dependencies change and autoScroll is true', () => {
    const scrollToMock = vi.fn();
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    container.scrollTo = scrollToMock;

    const { result, rerender } = renderHook(
      ({ deps }) => useAutoScroll(deps),
      { initialProps: { deps: [0] } }
    );

    act(() => {
      result.current.containerRef.current = container;
    });

    rerender({ deps: [1] });

    expect(scrollToMock).toHaveBeenCalledWith({
      top: 1000,
      behavior: 'smooth',
    });
  });

  it('does not scroll when autoScroll is false', () => {
    const scrollToMock = vi.fn();
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 900, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });
    container.scrollTo = scrollToMock;

    const { result, rerender } = renderHook(
      ({ deps }) => useAutoScroll(deps),
      { initialProps: { deps: [0] } }
    );

    act(() => {
      result.current.containerRef.current = container;
    });

    expect(result.current.autoScroll).toBe(true);

    act(() => {
      result.current.handleScroll();
    });
    Object.defineProperty(container, 'scrollTop', { value: 100, configurable: true });
    act(() => {
      result.current.handleScroll();
    });
    expect(result.current.autoScroll).toBe(false);

    scrollToMock.mockClear();
    rerender({ deps: [1] });
    expect(scrollToMock).not.toHaveBeenCalled();
  });

  it('updates autoScroll based on scroll position', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 900, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 200, configurable: true });

    const { result } = renderHook(() => useAutoScroll([]));

    act(() => {
      result.current.containerRef.current = container;
    });

    act(() => {
      result.current.handleScroll();
    });
    expect(result.current.autoScroll).toBe(true);

    Object.defineProperty(container, 'scrollTop', { value: 100, configurable: true });
    act(() => {
      result.current.handleScroll();
    });
    expect(result.current.autoScroll).toBe(false);
  });

  it('forceScrollToBottom scrolls and sets autoScroll to true', () => {
    const scrollToMock = vi.fn();
    const container = document.createElement('div');
    container.scrollTo = scrollToMock;
    Object.defineProperty(container, 'scrollHeight', { value: 1000, configurable: true });

    const { result } = renderHook(() => useAutoScroll([]));

    act(() => {
      result.current.containerRef.current = container;
    });

    act(() => {
      result.current.forceScrollToBottom();
    });

    expect(scrollToMock).toHaveBeenCalledWith({
      top: 1000,
      behavior: 'smooth',
    });
    expect(result.current.autoScroll).toBe(true);
  });

});