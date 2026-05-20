import { useEffect, useState } from 'react';

export const useTimer = (initialValue: number = 0) => {
  const [timer, setTimer] = useState(initialValue);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            setTimerActive(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timer]);

  const startTimer = (seconds: number) => {
    setTimer(seconds);
    setTimerActive(true);
  };

  const stopTimer = () => {
    setTimerActive(false);
  };

  const resetTimer = (seconds?: number) => {
    setTimerActive(false);
    if (seconds !== undefined) setTimer(seconds);
  };

  return {
    timer,
    setTimer,
    timerActive,
    setTimerActive,
    startTimer,
    stopTimer,
    resetTimer,
  };
};
