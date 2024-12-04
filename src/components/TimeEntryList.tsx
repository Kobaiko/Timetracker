import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Trash2 } from 'lucide-react';
import { format, startOfDay, endOfDay, isValid } from 'date-fns';
import { TimeEntry, Project } from '../types';
import { formatTime, formatDuration, formatTimeRange } from '../utils/timeUtils';
import { useAuth } from '../contexts/AuthContext';
import { loadTimeEntriesForRange, deleteTimeEntry } from '../services/firebase';
import { AlertDialog } from './AlertDialog';

interface TimeEntryListProps {
  entries: TimeEntry[];
  projects: Project[];
}

export const TimeEntryList: React.FC<TimeEntryListProps> = ({ entries: initialEntries, projects }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);
  const [entryToDelete, setEntryToDelete] = useState<TimeEntry | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadEntries = async () => {
      if (!currentUser || !isValid(selectedDate)) return;

      const startOfSelected = startOfDay(selectedDate);
      const endOfSelected = endOfDay(selectedDate);

      try {
        const loadedEntries = await loadTimeEntriesForRange(
          currentUser.uid,
          startOfSelected,
          endOfSelected
        );
        setEntries(loadedEntries);
      } catch (error) {
        console.error('Error loading entries:', error);
      }
    };

    loadEntries();
  }, [selectedDate, currentUser, initialEntries]);

  const getProjectById = (id: string) => {
    return projects.find((p) => p.id === id);
  };

  const handleDeleteEntry = async () => {
    if (!currentUser || !entryToDelete) return;

    try {
      await deleteTimeEntry(currentUser.uid, entryToDelete.id);
      setEntries(entries => entries.filter(e => e.id !== entryToDelete.id));
      setEntryToDelete(null);
    } catch (error) {
      console.error('Error deleting time entry:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Time Entries
        </h2>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No entries for this date
          </div>
        ) : (
          entries.map((entry) => {
            const project = getProjectById(entry.projectId);
            const task = project?.tasks.find(t => t.id === entry.taskId);
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 group"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project?.color }}
                  />
                  <div>
                    <div className="font-medium">
                      {project?.name} - {task?.name}
                    </div>
                    <div className="text-sm text-gray-500">{entry.description}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-4 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {entry.endTime ? formatTimeRange(entry.startTime, entry.endTime) : 'Ongoing'}
                    </span>
                    <span className="font-mono">
                      {formatDuration(entry.startTime, entry.endTime)}
                    </span>
                  </div>
                  <button
                    onClick={() => setEntryToDelete(entry)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AlertDialog
        isOpen={!!entryToDelete}
        onClose={() => setEntryToDelete(null)}
        title="Delete Time Entry"
        description="Are you sure you want to delete this time entry? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteEntry}
      />
    </div>
  );
};