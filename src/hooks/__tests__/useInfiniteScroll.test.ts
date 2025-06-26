import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useInfiniteScroll } from '../useInfiniteScroll';

describe('useInfiniteScroll', () => {
  let callback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    callback = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call callback when scrolling near bottom', () => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    });

    renderHook(() => useInfiniteScroll(callback));

    Object.defineProperty(window, 'scrollY', { value: 150 });
    window.dispatchEvent(new Event('scroll'));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not call callback when not near bottom', () => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: 2000,
    });

    renderHook(() => useInfiniteScroll(callback));

    window.dispatchEvent(new Event('scroll'));

    expect(callback).not.toHaveBeenCalled();
  });

  it('should respect custom threshold', () => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    });

    renderHook(() => useInfiniteScroll(callback, 300));

    Object.defineProperty(window, 'scrollY', { value: 0 });
    window.dispatchEvent(new Event('scroll'));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should remove event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useInfiniteScroll(callback));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    );
  });
});
