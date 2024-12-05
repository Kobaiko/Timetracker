const timers = new Map<string, {
  startTime: number;
  duration: number;
  isPaused: boolean;
  pausedAt: number;
  remaining: number;
}>();

self.onmessage = (e: MessageEvent) => {
  const { type, key, duration } = e.data;

  switch (type) {
    case 'START':
      timers.set(key, {
        startTime: Date.now(),
        duration,
        isPaused: false,
        pausedAt: 0,
        remaining: duration
      });
      tick(key);
      break;

    case 'PAUSE':
      const pauseTimer = timers.get(key);
      if (pauseTimer && !pauseTimer.isPaused) {
        pauseTimer.isPaused = true;
        pauseTimer.pausedAt = Date.now();
        pauseTimer.remaining = getRemainingTime(key);
      }
      break;

    case 'RESUME':
      const resumeTimer = timers.get(key);
      if (resumeTimer && resumeTimer.isPaused) {
        resumeTimer.startTime = Date.now() - (resumeTimer.duration - resumeTimer.remaining);
        resumeTimer.isPaused = false;
        resumeTimer.pausedAt = 0;
        tick(key);
      }
      break;

    case 'STOP':
      timers.delete(key);
      break;
  }
};

function getRemainingTime(key: string): number {
  const timer = timers.get(key);
  if (!timer) return 0;
  
  if (timer.isPaused) {
    return timer.remaining;
  }

  const elapsed = Date.now() - timer.startTime;
  return Math.max(0, timer.duration - elapsed);
}

function tick(key: string) {
  const timer = timers.get(key);
  if (!timer || timer.isPaused) return;

  const remaining = getRemainingTime(key);
  self.postMessage({ key, remaining });

  if (remaining > 0) {
    setTimeout(() => tick(key), 100);
  } else {
    timers.delete(key);
    self.postMessage({ key, remaining: 0, completed: true });
  }
}