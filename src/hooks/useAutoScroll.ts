import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAutoScrollOptions {
  threshold?: number;
  behavior?: ScrollBehavior;
}

export const useAutoScroll = <T extends HTMLElement>(
  dependencies: any[],
  options: UseAutoScrollOptions = {}
) => {
  const { threshold = 100, behavior = 'smooth' } = options;
  const containerRef = useRef<T>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const checkIfNearBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return false;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNear = scrollHeight - scrollTop - clientHeight < threshold;
    setIsNearBottom(isNear);
    return isNear;
  }, [threshold]);

  const scrollToBottom = useCallback((scrollBehavior: ScrollBehavior = behavior) => {
    const container = containerRef.current;
    if (container && autoScroll) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: scrollBehavior
      });
    }
  }, [autoScroll, behavior]);

  const handleScroll = useCallback(() => {
    const isNear = checkIfNearBottom();
    setAutoScroll(isNear);
  }, [checkIfNearBottom]);

  const forceScrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
      setAutoScroll(true);
    }
  }, []);

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [dependencies]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return {
    containerRef,
    autoScroll,
    isNearBottom,
    scrollToBottom,
    forceScrollToBottom,
    handleScroll,
  };
};