import React from 'react';
import { Clock, Calendar } from 'lucide-react';
import { TimeEntry, Project } from '../types';
import { formatTime, formatDuration } from '../utils/timeUtils';

interface TimeEntryListProps {
  entries: TimeEntry[];
  projects: Project[];
}

export const TimeEntryList: React.FC<TimeEntryListProps> = ({ entries, projects }) => {
  const getProjectById = (id: string) => {
    return projects.find((p) => p.id === id);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2 text-blue-600" />
        Today's Entries
      </h2>
      <div className="space-y-4">
        {entries.map((entry) => {
          const project = getProjectById(entry.projectId);
          return (
            <div
              key={entry.id}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
            >
              <div className="flex items-center space-x-4">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project?.color }}
                />
                <div>
                  <div className="font-medium">{project?.name}</div>
                  <div className="text-sm text-gray-500">{entry.description}</div>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {formatTime(entry.startTime)} -{' '}
                  {entry.endTime ? formatTime(entry.endTime) : 'Ongoing'}
                </span>
                <span className="font-mono">
                  {formatDuration(entry.startTime, entry.endTime)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};