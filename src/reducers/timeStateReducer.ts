import { v4 as uuidv4 } from 'uuid';
import { TimeState, Client, Project, Task, TimeEntry } from '../types';

export type TimeStateAction =
  | { type: 'SET_STATE'; payload: TimeState }
  | { type: 'ADD_CLIENT'; payload: Omit<Client, 'id'> }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'SELECT_CLIENT'; payload: string }
  | { type: 'ADD_PROJECT'; payload: Omit<Project, 'id' | 'tasks'> }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id'> }
  | { type: 'DELETE_TASK'; payload: { projectId: string; taskId: string } }
  | { type: 'START_TRACKING'; payload: Omit<TimeEntry, 'id'> }
  | { type: 'STOP_TRACKING'; payload: Date }
  | { type: 'ADD_MANUAL_ENTRY'; payload: Omit<TimeEntry, 'id'> };

export const getInitialState = (): TimeState => ({
  isTracking: false,
  currentEntry: null,
  entries: [],
  projects: [],
  clients: [],
  selectedClientId: undefined
});

export const timeStateReducer = (state: TimeState, action: TimeStateAction): TimeState => {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;

    case 'ADD_CLIENT': {
      const newClient = { ...action.payload, id: uuidv4() };
      return {
        ...state,
        clients: [...state.clients, newClient],
        selectedClientId: state.selectedClientId || newClient.id
      };
    }

    case 'DELETE_CLIENT': {
      const newClients = state.clients.filter(c => c.id !== action.payload);
      const newProjects = state.projects.filter(p => p.clientId !== action.payload);
      const newEntries = state.entries.filter(e => {
        const project = newProjects.find(p => p.id === e.projectId);
        return !!project;
      });

      return {
        ...state,
        clients: newClients,
        projects: newProjects,
        entries: newEntries,
        selectedClientId: action.payload === state.selectedClientId
          ? newClients[0]?.id
          : state.selectedClientId,
        currentEntry: state.currentEntry && !newProjects.find(p => p.id === state.currentEntry?.projectId)
          ? null
          : state.currentEntry,
        isTracking: state.currentEntry && !newProjects.find(p => p.id === state.currentEntry?.projectId)
          ? false
          : state.isTracking
      };
    }

    case 'SELECT_CLIENT':
      return {
        ...state,
        selectedClientId: action.payload
      };

    case 'ADD_PROJECT': {
      const newProject: Project = {
        ...action.payload,
        id: uuidv4(),
        tasks: [],
        clientId: state.selectedClientId || state.clients[0]?.id
      };
      return {
        ...state,
        projects: [...state.projects, newProject]
      };
    }

    case 'DELETE_PROJECT': {
      const newProjects = state.projects.filter(p => p.id !== action.payload);
      const newEntries = state.entries.filter(e => e.projectId !== action.payload);
      return {
        ...state,
        projects: newProjects,
        entries: newEntries,
        currentEntry: state.currentEntry?.projectId === action.payload ? null : state.currentEntry,
        isTracking: state.currentEntry?.projectId === action.payload ? false : state.isTracking
      };
    }

    case 'ADD_TASK': {
      const projectIndex = state.projects.findIndex(p => p.id === action.payload.projectId);
      if (projectIndex === -1) return state;

      const newTask: Task = {
        ...action.payload,
        id: uuidv4()
      };

      const updatedProjects = [...state.projects];
      updatedProjects[projectIndex] = {
        ...updatedProjects[projectIndex],
        tasks: [...updatedProjects[projectIndex].tasks, newTask]
      };

      return {
        ...state,
        projects: updatedProjects
      };
    }

    case 'DELETE_TASK': {
      const projectIndex = state.projects.findIndex(p => p.id === action.payload.projectId);
      if (projectIndex === -1) return state;

      const updatedProjects = [...state.projects];
      updatedProjects[projectIndex] = {
        ...updatedProjects[projectIndex],
        tasks: updatedProjects[projectIndex].tasks.filter(t => t.id !== action.payload.taskId)
      };

      const newEntries = state.entries.filter(e => e.taskId !== action.payload.taskId);

      return {
        ...state,
        projects: updatedProjects,
        entries: newEntries,
        currentEntry: state.currentEntry?.taskId === action.payload.taskId ? null : state.currentEntry,
        isTracking: state.currentEntry?.taskId === action.payload.taskId ? false : state.isTracking
      };
    }

    case 'START_TRACKING': {
      const newEntry: TimeEntry = {
        ...action.payload,
        id: uuidv4()
      };
      return {
        ...state,
        isTracking: true,
        currentEntry: newEntry
      };
    }

    case 'STOP_TRACKING': {
      if (!state.currentEntry) return state;
      const completedEntry: TimeEntry = {
        ...state.currentEntry,
        endTime: action.payload
      };
      return {
        ...state,
        isTracking: false,
        currentEntry: null,
        entries: [...state.entries, completedEntry]
      };
    }

    case 'ADD_MANUAL_ENTRY': {
      const newEntry: TimeEntry = {
        ...action.payload,
        id: uuidv4()
      };
      return {
        ...state,
        entries: [...state.entries, newEntry]
      };
    }

    default:
      return state;
  }
};