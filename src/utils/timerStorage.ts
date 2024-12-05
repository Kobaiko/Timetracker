export const saveTimerState = (key: string, state: any) => {
  try {
    localStorage.setItem(`timer_${key}`, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving timer state:', error);
  }
};

export const loadTimerState = (key: string) => {
  try {
    const state = localStorage.getItem(`timer_${key}`);
    return state ? JSON.parse(state) : null;
  } catch (error) {
    console.error('Error loading timer state:', error);
    return null;
  }
};

export const clearTimerState = (key: string) => {
  try {
    localStorage.removeItem(`timer_${key}`);
  } catch (error) {
    console.error('Error clearing timer state:', error);
  }
};