class TimerManager {
  private static instance: TimerManager;
  private timers: Map<string, TimerState>;
  private intervals: Map<string, number>;
  private callbacks: Map<string, () => void>;
  private durations: Map<string, number>;

  private constructor() {
    this.timers = new Map();
    this.intervals = new Map();
    this.callbacks = new Map();
    this.durations = new Map();
    this.loadState();
  }

  static getInstance(): TimerManager {
    if (!TimerManager.instance) {
      TimerManager.instance = new TimerManager();
    }
    return TimerManager.instance;
  }

  private loadState() {
    try {
      const savedState = localStorage.getItem('timerManager');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        Object.entries(parsed.timers).forEach(([key, state]) => {
          this.timers.set(key, state as TimerState);
        });
        Object.entries(parsed.durations).forEach(([key, duration]) => {
          this.durations.set(key, duration as number);
        });
      }
    } catch (error) {
      console.error('Error loading timer state:', error);
    }
  }

  private saveState() {
    try {
      const state = {
        timers: Object.fromEntries(this.timers),
        durations: Object.fromEntries(this.durations)
      };
      localStorage.setItem('timerManager', JSON.stringify(state));
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  }

  initialize(key: string, duration: number) {
    this.durations.set(key, duration);
    const state: TimerState = {
      startTime: null,
      pausedTime: null,
      elapsed: duration,
      isPaused: false,
      isRunning: false
    };
    this.timers.set(key, state);
    this.saveState();
  }

  start(key: string, duration: number, onComplete?: () => void) {
    this.clearInterval(key);
    this.durations.set(key, duration);
    if (onComplete) {
      this.callbacks.set(key, onComplete);
    }

    const state: TimerState = {
      startTime: Date.now(),
      pausedTime: null,
      elapsed: duration,
      isPaused: false,
      isRunning: true
    };

    this.timers.set(key, state);
    this.saveState();
    this.startInterval(key);
  }

  private startInterval(key: string) {
    const interval = window.setInterval(() => {
      const state = this.timers.get(key);
      const duration = this.durations.get(key);
      
      if (!state || !duration || !state.startTime || state.isPaused) return;

      const now = Date.now();
      const elapsed = now - state.startTime;
      const remaining = Math.max(0, duration - elapsed);

      if (remaining <= 0) {
        this.stop(key);
        const callback = this.callbacks.get(key);
        if (callback) callback();
        return;
      }

      this.timers.set(key, {
        ...state,
        elapsed: remaining
      });
      this.saveState();
    }, 100);

    this.intervals.set(key, interval);
  }

  private clearInterval(key: string) {
    const interval = this.intervals.get(key);
    if (interval) {
      window.clearInterval(interval);
      this.intervals.delete(key);
    }
  }

  stop(key: string) {
    this.clearInterval(key);
    const duration = this.durations.get(key) || 0;
    
    const state: TimerState = {
      startTime: null,
      pausedTime: null,
      elapsed: duration,
      isPaused: false,
      isRunning: false
    };

    this.timers.set(key, state);
    this.saveState();
  }

  pause(key: string) {
    const state = this.timers.get(key);
    if (!state || !state.isRunning) return;

    this.clearInterval(key);
    
    const now = Date.now();
    const elapsed = state.startTime ? now - state.startTime : 0;
    const duration = this.durations.get(key) || 0;
    const remaining = Math.max(0, duration - elapsed);

    const newState: TimerState = {
      ...state,
      pausedTime: now,
      elapsed: remaining,
      isPaused: true
    };

    this.timers.set(key, newState);
    this.saveState();
  }

  resume(key: string) {
    const state = this.timers.get(key);
    if (!state || !state.isPaused) return;

    const newState: TimerState = {
      ...state,
      startTime: Date.now() - (this.durations.get(key) || 0 - state.elapsed),
      pausedTime: null,
      isPaused: false
    };

    this.timers.set(key, newState);
    this.saveState();
    this.startInterval(key);
  }

  getState(key: string): TimerState {
    return (
      this.timers.get(key) || {
        startTime: null,
        pausedTime: null,
        elapsed: this.durations.get(key) || 0,
        isPaused: false,
        isRunning: false
      }
    );
  }

  cleanup(key: string) {
    this.clearInterval(key);
    this.timers.delete(key);
    this.callbacks.delete(key);
    this.durations.delete(key);
    this.saveState();
  }
}

interface TimerState {
  startTime: number | null;
  pausedTime: number | null;
  elapsed: number;
  isPaused: boolean;
  isRunning: boolean;
}

export const timerManager = TimerManager.getInstance();