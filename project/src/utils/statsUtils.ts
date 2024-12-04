import { TimeEntry, Project, Client, Task } from '../types';
import { formatDuration } from './timeUtils';

interface TimeData {
  name: string;
  value: number;
  formattedDuration: string;
  color: string;
}

export const calculateTimeDistribution = (
  entries: TimeEntry[],
  projects: Project[],
  clients: Client[],
  selectedClientId?: string,
  viewMode: 'clients' | 'projects' = 'clients'
): TimeData[] => {
  if (viewMode === 'clients') {
    return calculateClientDistribution(entries, projects, clients);
  }
  return calculateProjectDistribution(entries, projects, selectedClientId);
};

const calculateClientDistribution = (
  entries: TimeEntry[],
  projects: Project[],
  clients: Client[]
): TimeData[] => {
  const clientDurations = new Map<string, number>();
  
  entries.forEach((entry) => {
    if (!entry.endTime) return;
    const project = projects.find(p => p.id === entry.projectId);
    if (!project) return;
    
    const duration = entry.endTime.getTime() - entry.startTime.getTime();
    const current = clientDurations.get(project.clientId) || 0;
    clientDurations.set(project.clientId, current + duration);
  });

  return Array.from(clientDurations.entries())
    .map(([clientId, duration]) => {
      const client = clients.find(c => c.id === clientId);
      if (!client) return null;
      return {
        name: client.name,
        value: duration,
        formattedDuration: formatDuration(new Date(0), new Date(duration)),
        color: client.color
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};

const calculateProjectDistribution = (
  entries: TimeEntry[],
  projects: Project[],
  clientId?: string
): TimeData[] => {
  const projectDurations = new Map<string, number>();
  const filteredProjects = clientId 
    ? projects.filter(p => p.clientId === clientId)
    : projects;
  
  entries.forEach((entry) => {
    if (!entry.endTime) return;
    const project = filteredProjects.find(p => p.id === entry.projectId);
    if (!project) return;
    
    const duration = entry.endTime.getTime() - entry.startTime.getTime();
    const current = projectDurations.get(entry.projectId) || 0;
    projectDurations.set(entry.projectId, current + duration);
  });

  return Array.from(projectDurations.entries())
    .map(([projectId, duration]) => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return null;
      return {
        name: project.name,
        value: duration,
        formattedDuration: formatDuration(new Date(0), new Date(duration)),
        color: project.color
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};

export const generateTaskReport = (
  project: Project,
  entries: TimeEntry[]
): string[] => {
  const taskDurations = new Map<string, number>();
  
  // Calculate duration for each task
  entries.forEach((entry) => {
    if (!entry.endTime) return;
    const duration = entry.endTime.getTime() - entry.startTime.getTime();
    const current = taskDurations.get(entry.taskId) || 0;
    taskDurations.set(entry.taskId, current + duration);
  });

  const totalDuration = Array.from(taskDurations.values()).reduce((sum, duration) => sum + duration, 0);

  const csvRows = [
    `Task Report - ${project.name}`,
    `Total Time: ${formatDuration(new Date(0), new Date(totalDuration))}`,
    '',
    'Tasks Overview:',
    ['Task Name', 'Description', 'Total Time', 'Percentage'].join(','),
    ''
  ];

  // Add task summary
  project.tasks.forEach(task => {
    const duration = taskDurations.get(task.id) || 0;
    const percentage = totalDuration ? ((duration / totalDuration) * 100).toFixed(1) : '0';
    csvRows.push([
      task.name,
      task.description || '',
      formatDuration(new Date(0), new Date(duration)),
      `${percentage}%`
    ].join(','));
  });

  csvRows.push('');
  csvRows.push('Detailed Time Entries:');
  csvRows.push(['Date', 'Task', 'Description', 'Start Time', 'End Time', 'Duration'].join(','));

  // Group entries by task
  project.tasks.forEach(task => {
    const taskEntries = entries.filter(entry => entry.taskId === task.id && entry.endTime);
    if (taskEntries.length > 0) {
      csvRows.push(`${task.name}:`);
      taskEntries
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
        .forEach(entry => {
          if (entry.endTime) {
            csvRows.push([
              formatDate(entry.startTime),
              task.name,
              entry.description,
              formatTime(entry.startTime),
              formatTime(entry.endTime),
              formatDuration(entry.startTime, entry.endTime)
            ].join(','));
          }
        });
      csvRows.push('');
    }
  });

  csvRows.push(`Report generated on: ${new Date().toLocaleString()}`);
  return csvRows;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString();
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const downloadCsv = (rows: string[], filename: string): void => {
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename.toLowerCase().replace(/\s+/g, '-')}-report.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};