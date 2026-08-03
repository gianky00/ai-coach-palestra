import { useCallback, useEffect, useRef } from 'react';

/** Evita tap accidentali sulla lista mentre lo scroll è attivo. */
export const useScrollGestureGuard = (idleDelayMs = 60) => {
  const isScrollingRef = useRef(false);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markScrolling = useCallback(() => {
    isScrollingRef.current = true;
    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
  }, []);

  const markScrollIdle = useCallback(
    (delayMs = idleDelayMs) => {
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
      if (delayMs <= 0) {
        isScrollingRef.current = false;
        return;
      }
      scrollEndTimerRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        scrollEndTimerRef.current = null;
      }, delayMs);
    },
    [idleDelayMs],
  );

  useEffect(
    () => () => {
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    },
    [],
  );

  return { isScrollingRef, markScrolling, markScrollIdle };
};
