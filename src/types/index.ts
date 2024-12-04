export interface Task {
  id: string;
  projectId: string;
  name: string;
  description?: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  projectId: string;
  description: string;
  startTime: Date;
  endTime?: Date;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  color: string;
  tasks: Task[];
}

export interface Client {
  id: string;
  name: string;
  color: string;
}

export interface TimeState {
  isTracking: boolean;
  currentEntry: TimeEntry | null;
  entries: TimeEntry[];
  projects: Project[];
  clients: Client[];
  selectedClientId?: string;
}