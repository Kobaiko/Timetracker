import { useState, useEffect, useCallback, useRef } from 'react';

interface TimerState {
  startTime: number;
  elapsed: number;
  isPaused: boolean;
  pausedAt: number | null;
}

const STORAGE_KEY = 'timer_state_';

export const useTimer = (
  key: string,
  onComplete?: () => void,
  duration?: number,
  isCountdown: boolean = false
) => {
  const [timeRemaining, setTimeRemaining] = useState(duration || 0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<TimerState | null>(null);
  const intervalRef = useRef<number>();

  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY + key);
    if (savedState) {
      const state: TimerState = JSON.parse(savedState);
      if (!state.isPaused) {
        const now = Date.now();
        const elapsed = now - state.startTime;
        if (isCountdown && duration) {
          const remaining = Math.max(0, duration - elapsed);
          setTimeRemaining(remaining);
          if (remaining > 0) {
            timerRef.current = state;
            setIsRunning(true);
            startTicking();
          }
        } else {
          setTimeRemaining(elapsed);
          timerRef.current = state;
          setIsRunning(true);
          startTicking();
        }
      } else {
        setTimeRemaining(state.elapsed);
        setIsPaused(true);
        setIsRunning(true);
        timerRef.current = state;
      }
    } else if (duration) {
      setTimeRemaining(duration);
    }
  }, [key, duration, isCountdown]);

  const startTicking = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    intervalRef.current = window.setInterval(() => {
      if (!timerRef.current || timerRef.current.isPaused) return;

      const now = Date.now();
      const elapsed = now - timerRef.current.startTime;

      if (isCountdown && duration) {
        const remaining = Math.max(0, duration - elapsed);
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          if (onComplete) onComplete();
          stop();
        }
      } else {
        setTimeRemaining(elapsed);
      }
    }, 100);
  }, [duration, isCountdown, onComplete]);

  const saveState = useCallback((state: TimerState) => {
    localStorage.setItem(STORAGE_KEY + key, JSON.stringify(state));
  }, [key]);

  const start = useCallback(() => {
    const now = Date.now();
    const state: TimerState = {
      startTime: now,
      elapsed: 0,
      isPaused: false,
      pausedAt: null
    };
    
    timerRef.current = state;
    setIsRunning(true);
    setIsPaused(false);
    setTimeRemaining(isCountdown ? (duration || 0) : 0);
    saveState(state);
    startTicking();
  }, [duration, isCountdown, saveState, startTicking]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    
    localStorage.removeItem(STORAGE_KEY + key);
    timerRef.current = null;
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(isCountdown ? (duration || 0) : 0);
  }, [key, duration, isCountdown]);

  const pause = useCallback(() => {
    if (!timerRef.current) return;

    const now = Date.now();
    const state: TimerState = {
      ...timerRef.current,
      isPaused: true,
      pausedAt: now,
      elapsed: timeRemaining
    };
    
    timerRef.current = state;
    setIsPaused(true);
    saveState(state);
  }, [timeRemaining, saveState]);

  const resume = useCallback(() => {
    if (!timerRef.current || !timerRef.current.pausedAt) return;

    const now = Date.now();
    const state: TimerState = {
      startTime: now - (isCountdown ? (duration || 0) - timeRemaining : timeRemaining),
      elapsed: timeRemaining,
      isPaused: false,
      pausedAt: null
    };
    
    timerRef.current = state;
    setIsPaused(false);
    saveState(state);
    startTicking();
  }, [duration, timeRemaining, isCountdown, saveState, startTicking]);

  // Cleanup on unmount
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
    stop,
    pause,
    resume
  };
};