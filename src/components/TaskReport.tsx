import React from 'react';
import { Clock, Download } from 'lucide-react';
import { Project, TimeEntry } from '../types';
import { formatDuration } from '../utils/timeUtils';
import { generateTaskReport, downloadCsv } from '../utils/statsUtils';

interface TaskReportProps {
  project: Project;
  entries: TimeEntry[];
}

export const TaskReport: React.FC<TaskReportProps> = ({ project, entries }) => {
  const getTaskDuration = (taskId: string): number => {
    return entries
      .filter(entry => entry.taskId === taskId && entry.endTime)
      .reduce((total, entry) => {
        if (!entry.endTime) return total;
        return total + (entry.endTime.getTime() - entry.startTime.getTime());
      }, 0);
  };

  const taskStats = project.tasks.map(task => ({
    task,
    duration: getTaskDuration(task.id),
  })).sort((a, b) => b.duration - a.duration);

  const totalDuration = taskStats.reduce((total, { duration }) => total + duration, 0);

  const handleDownloadReport = () => {
    const rows = generateTaskReport(project, entries);
    downloadCsv(rows, `${project.name}-tasks`);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <h3 className="text-xl font-semibold">{project.name}</h3>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-gray-600">
            Total: {formatDuration(new Date(0), new Date(totalDuration))}
          </div>
          <button
            onClick={handleDownloadReport}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {taskStats.map(({ task, duration }) => (
          <div key={task.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">{task.name}</div>
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                {formatDuration(new Date(0), new Date(duration))}
              </div>
            </div>
            {task.description && (
              <p className="text-sm text-gray-600">{task.description}</p>
            )}
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${totalDuration ? (duration / totalDuration) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};