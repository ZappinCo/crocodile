import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from './event-emitter.service';

describe('EventEmitter', () => {
  it('should register and emit events', () => {
    const emitter = new EventEmitter();
    const mockHandler = vi.fn();

    emitter.on('test', mockHandler);
    emitter.emit('test', 'hello', 123);

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith('hello', 123);
  });

  it('should allow multiple handlers for same event', () => {
    const emitter = new EventEmitter();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    emitter.on('test', handler1);
    emitter.on('test', handler2);
    emitter.emit('test', 'data');

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should not call handler after off', () => {
    const emitter = new EventEmitter();
    const mockHandler = vi.fn();

    const off = emitter.on('test', mockHandler);
    emitter.emit('test');
    expect(mockHandler).toHaveBeenCalledTimes(1);

    off();
    emitter.emit('test');
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('should remove all listeners for specific event', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();

    emitter.on('test', handler);
    emitter.removeAllListeners('test');
    emitter.emit('test');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should remove all listeners for all events', () => {
    const emitter = new EventEmitter();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    emitter.on('event1', handler1);
    emitter.on('event2', handler2);
    emitter.removeAllListeners();
    emitter.emit('event1');
    emitter.emit('event2');
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });

  it('should not crash when emitting event with no handlers', () => {
    const emitter = new EventEmitter();
    expect(() => emitter.emit('nonexistent')).not.toThrow();
  });

  it('should handle errors in handlers gracefully', () => {
    const emitter = new EventEmitter();
    const errorHandler = vi.fn(() => {
      throw new Error('Handler error');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    emitter.on('test', errorHandler);
    expect(() => emitter.emit('test')).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should return unsubscribe function from on', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();

    const unsubscribe = emitter.on('test', handler);
    emitter.emit('test');
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    emitter.emit('test');
    expect(handler).toHaveBeenCalledTimes(1);
  });
});