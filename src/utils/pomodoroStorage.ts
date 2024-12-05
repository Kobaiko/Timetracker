export interface PomodoroState {
  mode: 'work' | 'break' | 'longBreak';
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  sessionsCompleted: number;
  settings: {
    workTime: number;
    breakTime: number;
    longBreakTime: number;
  };
}

const STORAGE_KEY = 'pomodoroState';

export const savePomodoroState = (state: PomodoroState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      lastUpdated: Date.now()
    }));
  } catch (error) {
    console.error('Error saving pomodoro state:', error);
  }
};

export const loadPomodoroState = (): PomodoroState | null => {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) return null;

    const state = JSON.parse(savedState);
    const elapsed = Date.now() - state.lastUpdated;

    if (state.isRunning && !state.isPaused) {
      state.timeRemaining = Math.max(0, state.timeRemaining - elapsed);
    }

    return state;
  } catch (error) {
    console.error('Error loading pomodoro state:', error);
    return null;
  }
};

export const clearPomodoroState = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};