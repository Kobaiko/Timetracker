import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Download } from 'lucide-react';
import { useTimeState } from '../contexts/TimeStateContext';
import { formatDuration } from '../utils/timeUtils';
import { DashboardStats } from '../components/DashboardStats';
import { TimeDistributionChart } from '../components/TimeDistributionChart';

export const Dashboard: React.FC = () => {
  const { state } = useTimeState();
  const { entries, projects, clients, selectedClientId } = state;
  const [viewMode, setViewMode] = useState<'clients' | 'projects'>('clients');

  const downloadReport = (clientId?: string) => {
    const client = clientId ? clients.find(c => c.id === clientId) : null;
    const filteredProjects = clientId 
      ? projects.filter(p => p.clientId === clientId)
      : projects;
    const filteredEntries = entries.filter(e => {
      const project = filteredProjects.find(p => p.id === e.projectId);
      return !!project;
    });
    
    const csvRows = generateReportRows(filteredEntries, filteredProjects, client?.name);
    downloadCsv(csvRows, client?.name || 'all-clients');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'clients' | 'projects')}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="clients">Clients Overview</option>
            <option value="projects">Projects Overview</option>
          </select>
          <button
            onClick={() => downloadReport(viewMode === 'projects' ? selectedClientId : undefined)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <DashboardStats
          entries={entries}
          projects={projects}
          clients={clients}
          selectedClientId={selectedClientId}
          viewMode={viewMode}
        />
        <TimeDistributionChart
          entries={entries}
          projects={projects}
          clients={clients}
          selectedClientId={selectedClientId}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};