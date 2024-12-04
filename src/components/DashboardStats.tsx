import React from 'react';
import { TimeEntry, Project, Client } from '../types';
import { formatDuration } from '../utils/timeUtils';
import { calculateTimeDistribution } from '../utils/statsUtils';

interface DashboardStatsProps {
  entries: TimeEntry[];
  projects: Project[];
  clients: Client[];
  selectedClientId?: string;
  viewMode: 'clients' | 'projects';
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  entries,
  projects,
  clients,
  selectedClientId,
  viewMode,
}) => {
  const timeData = calculateTimeDistribution(entries, projects, clients, selectedClientId, viewMode);
  const totalDuration = entries.reduce((total, entry) => {
    if (!entry.endTime) return total;
    return total + (entry.endTime.getTime() - entry.startTime.getTime());
  }, 0);

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Total Time Tracked</h2>
      <p className="text-4xl font-bold text-blue-600 mb-6">
        {formatDuration(new Date(0), new Date(totalDuration))}
      </p>
      <div className="space-y-4">
        {timeData.map((item) => (
          <div key={item.name} className="flex items-center space-x-3">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 flex justify-between items-center">
              <span className="text-gray-700">{item.name}</span>
              <span className="text-gray-600 font-mono">{item.formattedDuration}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};