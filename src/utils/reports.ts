export const downloadReport = (entries: TimeEntry[], projects: Project[], reportName: string) => {
  const rows = entries.map(entry => {
    const project = projects.find(p => p.id === entry.projectId);
    return {
      Date: format(new Date(entry.startTime), 'dd-MM-yyyy'),
      'Start Time': format(parseISO(entry.startTime), 'HH:mm:ss'),
      'End Time': format(parseISO(entry.endTime), 'HH:mm:ss'),
      Duration: intervalToDuration({
        start: parseISO(entry.startTime),
        end: parseISO(entry.endTime)
      }).hours + ':' + 
      String(intervalToDuration({
        start: parseISO(entry.startTime),
        end: parseISO(entry.endTime)
      }).minutes).padStart(2, '0'),
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