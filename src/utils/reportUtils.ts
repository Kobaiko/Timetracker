import { format } from 'date-fns';
import { TimeEntry, Project, Client } from '../types';
import { formatDuration, formatTime } from './timeUtils';

export const generateReportRows = (
  entries: TimeEntry[],
  projects: Project[],
  clientName?: string
): string[] => {
  const totalDuration = entries.reduce((total, entry) => {
    if (!entry.endTime) return total;
    return total + (entry.endTime.getTime() - entry.startTime.getTime());
  }, 0);

  const csvRows = [
    `Time Report - ${clientName || 'All Clients'}`,
    `Total Time: ${formatDuration(new Date(0), new Date(totalDuration))}`,
    '',
  ];

  if (clientName) {
    // Projects Overview Report
    csvRows.push('Project Distribution:');
    csvRows.push(['Project', 'Total Time', 'Percentage'].join(','));

    const projectStats = projects.map(project => {
      const projectEntries = entries.filter(e => e.projectId === project.id);
      const duration = projectEntries.reduce((total, entry) => {
        if (!entry.endTime) return total;
        return total + (entry.endTime.getTime() - entry.startTime.getTime());
      }, 0);
      return {
        project,
        duration,
        percentage: totalDuration ? ((duration / totalDuration) * 100).toFixed(1) : '0'
      };
    }).sort((a, b) => b.duration - a.duration);

    projectStats.forEach(({ project, duration, percentage }) => {
      csvRows.push([
        project.name,
        formatDuration(new Date(0), new Date(duration)),
        `${percentage}%`
      ].join(','));
    });
  } else {
    // Clients Overview Report with Projects
    csvRows.push('Time Distribution by Client and Project:');
    csvRows.push(['Client', 'Project', 'Total Time', 'Percentage'].join(','));

    // First, calculate client totals
    const clientTotals = new Map<string, number>();
    entries.forEach(entry => {
      if (!entry.endTime) return;
      const project = projects.find(p => p.id === entry.projectId);
      if (!project) return;
      
      const duration = entry.endTime.getTime() - entry.startTime.getTime();
      const current = clientTotals.get(project.clientId) || 0;
      clientTotals.set(project.clientId, current + duration);
    });

    // Then, calculate project totals grouped by client
    const projectsByClient = projects.reduce((acc, project) => {
      if (!acc[project.clientId]) {
        acc[project.clientId] = [];
      }
      acc[project.clientId].push(project);
      return acc;
    }, {} as Record<string, Project[]>);

    // Sort clients by total duration
    Array.from(clientTotals.entries())
      .sort(([, a], [, b]) => b - a)
      .forEach(([clientId, clientTotal]) => {
        const clientProjects = projectsByClient[clientId] || [];
        
        // Calculate and sort projects within each client
        const projectStats = clientProjects.map(project => {
          const projectEntries = entries.filter(e => e.projectId === project.id);
          const duration = projectEntries.reduce((total, entry) => {
            if (!entry.endTime) return total;
            return total + (entry.endTime.getTime() - entry.startTime.getTime());
          }, 0);
          return {
            project,
            duration,
            percentage: totalDuration ? ((duration / totalDuration) * 100).toFixed(1) : '0'
          };
        }).sort((a, b) => b.duration - a.duration);

        // Add client total
        csvRows.push([
          `${clientProjects[0]?.name || 'Unknown Client'} (Total)`,
          '',
          formatDuration(new Date(0), new Date(clientTotal)),
          `${totalDuration ? ((clientTotal / totalDuration) * 100).toFixed(1) : '0'}%`
        ].join(','));

        // Add individual projects
        projectStats.forEach(({ project, duration, percentage }) => {
          csvRows.push([
            '',  // Indent project under client
            project.name,
            formatDuration(new Date(0), new Date(duration)),
            `${percentage}%`
          ].join(','));
        });

        // Add a blank line between clients
        csvRows.push('');
      });
  }

  csvRows.push('');
  csvRows.push('Detailed Time Entries:');
  csvRows.push(['Date', 'Client', 'Project', 'Task', 'Description', 'Start Time', 'End Time', 'Duration'].join(','));

  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    if (!entry.endTime) return acc;
    const date = format(entry.startTime, 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  // Add entries sorted by date
  Object.entries(entriesByDate)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .forEach(([date, dateEntries]) => {
      dateEntries
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
        .forEach(entry => {
          if (!entry.endTime) return;
          const project = projects.find(p => p.id === entry.projectId);
          const task = project?.tasks.find(t => t.id === entry.taskId);
          if (project && task) {
            csvRows.push([
              format(entry.startTime, 'yyyy-MM-dd'),
              project.name.split(' - ')[0], // Client name
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

  csvRows.push('');
  csvRows.push(`Report generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);

  return csvRows;
};

export const downloadReport = (
  entries: TimeEntry[],
  projects: Project[],
  clientName?: string
): void => {
  const rows = generateReportRows(entries, projects, clientName);
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(clientName || 'all-clients').toLowerCase().replace(/\s+/g, '-')}-time-report.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};