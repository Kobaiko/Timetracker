import { useState, useEffect, useCallback, useRef } from 'react';
import { PomodoroState, savePomodoroState, loadPomodoroState } from '../utils/pomodoroStorage';

export const usePomodoroTimer = (
  initialDuration: number,
  onComplete?: () => void
) => {
  const [timeRemaining, setTimeRemaining] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number>();

  useEffect(() => {
    setTimeRemaining(initialDuration);
  }, [initialDuration]);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    const startTime = Date.now();
    const initialRemaining = timeRemaining;

    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, initialRemaining - elapsed);
      
      setTimeRemaining(remaining);

      if (remaining === 0) {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
        }
        setIsRunning(false);
        if (onComplete) {
          onComplete();
        }
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [timeRemaining, onComplete]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    const startTime = Date.now();
    const initialRemaining = timeRemaining;

    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, initialRemaining - elapsed);
      
      setTimeRemaining(remaining);

      if (remaining === 0) {
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
        }
        setIsRunning(false);
        if (onComplete) {
          onComplete();
        }
      }
    }, 100);
  }, [timeRemaining, onComplete]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(initialDuration);
  }, [initialDuration]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeRemaining,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    stop
  };
};