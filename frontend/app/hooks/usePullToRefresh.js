'use client';
import { useState, useRef, useCallback } from 'react';

const PULL_THRESHOLD = 70;
const MAX_PULL = 110;
const RESISTANCE = 0.4;

export function usePullToRefresh(onRefresh, { disabled = false } = {}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);

  const startYRef = useRef(null);
  const isPullingRef = useRef(false);

  const handleTouchStart = useCallback((e) => {
    if (disabled || isRefreshing) return;
    if (window.scrollY > 2) return; // only at top of page
    startYRef.current = e.touches[0].clientY;
    isPullingRef.current = false;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (disabled || isRefreshing || startYRef.current === null) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta <= 0) {
      isPullingRef.current = false;
      setPullDistance(0);
      setIsTriggered(false);
      return;
    }
    isPullingRef.current = true;
    const pulled = Math.min(delta * RESISTANCE, MAX_PULL);
    setPullDistance(pulled);
    setIsTriggered(pulled >= PULL_THRESHOLD);
    if (delta > 5) e.preventDefault();
  }, [disabled, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current || disabled) {
      startYRef.current = null;
      return;
    }
    startYRef.current = null;
    isPullingRef.current = false;

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(0);
      setIsTriggered(false);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setPullDistance(0);
      setIsTriggered(false);
    }
  }, [pullDistance, onRefresh, disabled]);

  return {
    pullDistance,
    isRefreshing,
    isTriggered,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}