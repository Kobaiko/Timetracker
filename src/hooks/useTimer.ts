import { useState, useEffect, useRef, useCallback } from 'react';

interface TimerState {
  startTime: number;
  pausedTime: number;
  isPaused: boolean;
  totalElapsed: number;
  duration?: number;
  isCountdown?: boolean;
}

export const useTimer = (
  key: string, 
  onComplete?: () => void,
  duration?: number,
  isCountdown: boolean = false
) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const intervalRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    localStorage.removeItem(`timer_${key}`);
  }, [key]);

  // Initialize broadcast channel for cross-tab communication
  useEffect(() => {
    channelRef.current = new BroadcastChannel(`timer_${key}`);
    
    channelRef.current.onmessage = (event) => {
      const { type, state } = event.data;
      
      switch (type) {
        case 'UPDATE':
          setTimeElapsed(state.timeElapsed);
          setIsRunning(state.isRunning);
          setIsPaused(state.isPaused);
          break;
        case 'STOP':
          cleanup();
          setIsRunning(false);
          setIsPaused(false);
          setTimeElapsed(0);
          break;
      }
    };

    return () => {
      channelRef.current?.close();
    };
  }, [key, cleanup]);

  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem(`timer_${key}`);
    if (savedState) {
      const state: TimerState = JSON.parse(savedState);
      const now = Date.now();
      
      if (!state.isPaused) {
        const elapsed = state.totalElapsed + (now - state.startTime);
        if (isCountdown && duration && elapsed >= duration) {
          cleanup();
          if (onComplete) onComplete();
        } else {
          setTimeElapsed(elapsed);
          setIsRunning(true);
          startTimeRef.current = now - elapsed;
        }
      } else {
        setTimeElapsed(state.totalElapsed);
        setIsRunning(true);
        setIsPaused(true);
        startTimeRef.current = state.startTime;
      }
    }
  }, [key, duration, isCountdown, onComplete, cleanup]);

  // Timer logic
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      
      if (isCountdown && duration && elapsed >= duration) {
        cleanup();
        setTimeElapsed(duration);
        setIsRunning(false);
        if (onComplete) onComplete();
        return;
      }

      setTimeElapsed(elapsed);

      // Save state
      const state: TimerState = {
        startTime: startTimeRef.current,
        pausedTime: isPaused ? now : 0,
        isPaused,
        totalElapsed: elapsed,
        duration,
        isCountdown
      };
      localStorage.setItem(`timer_${key}`, JSON.stringify(state));

      // Broadcast state
      channelRef.current?.postMessage({
        type: 'UPDATE',
        state: {
          timeElapsed: elapsed,
          isRunning: true,
          isPaused: false
        }
      });
    };

    intervalRef.current = window.setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, key, duration, isCountdown, onComplete, cleanup]);

  const start = useCallback(() => {
    cleanup();
    const now = Date.now();
    startTimeRef.current = now;
    
    const state: TimerState = {
      startTime: now,
      pausedTime: 0,
      isPaused: false,
      totalElapsed: 0,
      duration,
      isCountdown
    };
    localStorage.setItem(`timer_${key}`, JSON.stringify(state));
    
    setIsRunning(true);
    setIsPaused(false);
    setTimeElapsed(0);
  }, [key, duration, isCountdown, cleanup]);

  const stop = useCallback(() => {
    cleanup();
    channelRef.current?.postMessage({ type: 'STOP' });
    setIsRunning(false);
    setIsPaused(false);
    setTimeElapsed(0);
  }, [cleanup]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    const state: TimerState = {
      startTime: startTimeRef.current,
      pausedTime: Date.now(),
      isPaused: true,
      totalElapsed: timeElapsed,
      duration,
      isCountdown
    };
    localStorage.setItem(`timer_${key}`, JSON.stringify(state));
    setIsPaused(true);
  }, [key, timeElapsed, duration, isCountdown]);

  const resume = useCallback(() => {
    const now = Date.now();
    startTimeRef.current = now - timeElapsed;
    
    const state: TimerState = {
      startTime: startTimeRef.current,
      pausedTime: 0,
      isPaused: false,
      totalElapsed: timeElapsed,
      duration,
      isCountdown
    };
    localStorage.setItem(`timer_${key}`, JSON.stringify(state));
    setIsPaused(false);
  }, [key, timeElapsed, duration, isCountdown]);

  const getTime = useCallback(() => {
    if (!isCountdown || !duration) return timeElapsed;
    return Math.max(0, duration - timeElapsed);
  }, [isCountdown, duration, timeElapsed]);

  return {
    isRunning,
    isPaused,
    timeElapsed: getTime(),
    start,
    stop,
    pause,
    resume
  };
};