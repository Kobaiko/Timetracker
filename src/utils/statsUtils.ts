import { TimeEntry, Project, Client } from '../types';
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

export const generateReportRows = (
  entries: TimeEntry[],
  projects: Project[],
  reportTitle?: string
): string[] => {
  const totalDuration = entries.reduce((total, entry) => {
    if (!entry.endTime) return total;
    return total + (entry.endTime.getTime() - entry.startTime.getTime());
  }, 0);

  const csvRows = [
    `Time Report - ${reportTitle || 'All Clients'}`,
    `Total Time: ${formatDuration(new Date(0), new Date(totalDuration))}`,
    '',
    'Detailed Entries:',
    ['Date', 'Project', 'Task', 'Description', 'Start Time', 'End Time', 'Duration'].join(',')
  ];

  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    if (!entry.endTime) return acc;
    const date = formatDate(entry.startTime);
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  // Add entries sorted by date
  Object.entries(entriesByDate)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .forEach(([date, dateEntries]) => {
      dateEntries.forEach(entry => {
        const project = projects.find(p => p.id === entry.projectId);
        const task = project?.tasks.find(t => t.id === entry.taskId);
        if (entry.endTime && project && task) {
          csvRows.push([
            formatDate(entry.startTime),
            project.name,
            task.name,
            entry.description,
            formatTime(entry.startTime),
            formatTime(entry.endTime),
            formatDuration(entry.startTime, entry.endTime)
          ].join(','));
        }
      });
    });

  return csvRows;
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
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
  a.download = `${filename.toLowerCase().replace(/\s+/g, '-')}-time-report.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};