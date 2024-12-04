import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useTimeState } from '../contexts/TimeStateContext';
import { useAuth } from '../contexts/AuthContext';
import { DashboardStats } from '../components/DashboardStats';
import { TimeDistributionChart } from '../components/TimeDistributionChart';
import { TaskReport } from '../components/TaskReport';
import { DateRangePicker } from '../components/DateRangePicker';
import { downloadReport } from '../utils/reportUtils';
import { loadTimeEntriesForRange } from '../services/firebase';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { state } = useTimeState();
  const { currentUser } = useAuth();
  const { projects, clients, selectedClientId } = state;
  const [viewMode, setViewMode] = useState<'clients' | 'projects'>('clients');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [startDate, setStartDate] = useState(startOfDay(subDays(new Date(), 7)));
  const [endDate, setEndDate] = useState(endOfDay(new Date()));
  const [entries, setEntries] = useState(state.entries);

  useEffect(() => {
    const loadEntries = async () => {
      if (!currentUser) return;
      try {
        const loadedEntries = await loadTimeEntriesForRange(
          currentUser.uid,
          startDate,
          endDate
        );
        setEntries(loadedEntries);
      } catch (error) {
        console.error('Error loading entries:', error);
      }
    };

    loadEntries();
  }, [currentUser, startDate, endDate]);

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const clientProjects = selectedClientId
    ? projects.filter(p => p.clientId === selectedClientId)
    : projects;

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleDownloadReport = () => {
    if (viewMode === 'clients') {
      downloadReport(entries, projects, 'All Clients');
    } else if (selectedClient) {
      downloadReport(
        entries.filter(e => {
          const project = clientProjects.find(p => p.id === e.projectId);
          return !!project;
        }),
        clientProjects,
        selectedClient.name
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          {viewMode === 'projects' && selectedClient && (
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedClient.color }}
              />
              <span className="text-lg text-gray-600">{selectedClient.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'clients' | 'projects')}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="clients">Clients Overview</option>
            <option value="projects">Projects Overview</option>
          </select>
          <button
            onClick={handleDownloadReport}
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

      {viewMode === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Task Report</h2>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Project</option>
              {clientProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          {selectedProject && (
            <TaskReport
              project={selectedProject}
              entries={entries.filter(e => e.projectId === selectedProject.id)}
            />
          )}
        </div>
      )}
    </div>
  );
};