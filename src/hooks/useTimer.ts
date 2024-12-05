import { useState, useEffect, useCallback } from 'react';
import { timerManager } from '../utils/timerManager';

export const useTimer = (
  key: string,
  onComplete?: () => void,
  duration?: number,
  isCountdown: boolean = false
) => {
  const [state, setState] = useState(() => {
    if (duration) {
      timerManager.initialize(key, duration);
    }
    return timerManager.getState(key);
  });

  useEffect(() => {
    const updateState = () => {
      setState(timerManager.getState(key));
    };

    const interval = setInterval(updateState, 100);
    window.addEventListener('storage', updateState);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', updateState);
      timerManager.cleanup(key);
    };
  }, [key]);

  useEffect(() => {
    if (duration) {
      timerManager.initialize(key, duration);
      setState(timerManager.getState(key));
    }
  }, [key, duration]);

  const start = useCallback(() => {
    if (!duration) return;
    timerManager.start(key, duration, onComplete);
    setState(timerManager.getState(key));
  }, [key, duration, onComplete]);

  const stop = useCallback(() => {
    timerManager.stop(key);
    setState(timerManager.getState(key));
  }, [key]);

  const pause = useCallback(() => {
    timerManager.pause(key);
    setState(timerManager.getState(key));
  }, [key]);

  const resume = useCallback(() => {
    timerManager.resume(key);
    setState(timerManager.getState(key));
  }, [key]);

  return {
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    timeElapsed: state.elapsed,
    start,
    stop,
    pause,
    resume
  };
};