export const downloadReport = (entries: TimeEntry[], projects: Project[], reportName: string) => {
  const rows = entries.map(entry => {
    const project = projects.find(p => p.id === entry.projectId);
    return {
      Date: format(new Date(entry.startTime), 'dd-MM-yyyy'),
      'Start Time': format(new Date(entry.startTime), 'HH:mm:ss'),
      'End Time': format(new Date(entry.endTime), 'HH:mm:ss'),
      Duration: formatDuration(intervalToDuration({
        start: new Date(entry.startTime),
        end: new Date(entry.endTime)
      })),
      Project: project?.name || 'Unknown Project',
      Description: entry.description
    };
  });

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${reportName}_${format(new Date(), 'dd-MM-yyyy')}.csv`;
  link.click();
};