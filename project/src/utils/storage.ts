import { TimeState } from '../types';

const STORAGE_KEY = 'timeTracker';

const parseDate = (dateStr: string | undefined): Date | undefined => {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date;
};

export const loadTimeState = (): TimeState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    
    // Ensure clients array exists
    const clients = Array.isArray(parsed.clients) ? parsed.clients : [];
    
    // Ensure projects array exists
    const projects = Array.isArray(parsed.projects) ? parsed.projects : [];
    
    // Parse time entries
    const entries = Array.isArray(parsed.entries) ? parsed.entries.map((entry: any) => ({
      ...entry,
      startTime: new Date(entry.startTime),
      endTime: parseDate(entry.endTime),
    })) : [];

    // Parse current entry if exists
    const currentEntry = parsed.currentEntry ? {
      ...parsed.currentEntry,
      startTime: new Date(parsed.currentEntry.startTime),
      endTime: parseDate(parsed.currentEntry.endTime),
    } : null;

    return {
      isTracking: Boolean(parsed.isTracking),
      currentEntry,
      entries,
      projects,
      clients,
      selectedClientId: parsed.selectedClientId || clients[0]?.id,
    };
  } catch (error) {
    console.error('Error loading time state:', error);
    return null;
  }
};

export const saveTimeState = (state: TimeState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      // Ensure selectedClientId is always set
      selectedClientId: state.selectedClientId || state.clients[0]?.id,
    }));
  } catch (error) {
    console.error('Error saving time state:', error);
  }
};