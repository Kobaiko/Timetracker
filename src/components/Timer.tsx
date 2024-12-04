import React from 'react';
import { Play, Square, Clock, Plus } from 'lucide-react';
import { TimeEntry, Project, Task } from '../types';
import { formatDuration } from '../utils/timeUtils';
import { ProjectSelector } from './ProjectSelector';

interface TimerProps {
  isTracking: boolean;
  currentEntry: TimeEntry | null;
  onStartTracking: () => void;
  onStopTracking: () => void;
  selectedProject: Project | null;
  selectedTask: Task | null;
  onOpenManualEntry: () => void;
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onSelectTask: (task: Task) => void;
}

export const Timer: React.FC<TimerProps> = ({
  isTracking,
  currentEntry,
  onStartTracking,
  onStopTracking,
  selectedProject,
  selectedTask,
  onOpenManualEntry,
  projects,
  onSelectProject,
  onSelectTask,
}) => {
  const [time, setTime] = React.useState<string>('00:00:00');

  React.useEffect(() => {
    let interval: number | undefined;
    
    if (isTracking && currentEntry) {
      const updateTimer = () => {
        setTime(formatDuration(currentEntry.startTime));
      };
      
      updateTimer(); // Initial update
      interval = window.setInterval(updateTimer, 1000);
    } else {
      setTime('00:00:00');
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTracking, currentEntry]);

  return (
    <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="w-full flex items-center justify-center space-x-4">
          <ProjectSelector
            projects={projects}
            selectedProject={selectedProject}
            selectedTask={selectedTask}
            onSelectProject={onSelectProject}
            onSelectTask={onSelectTask}
          />
        </div>
        
        <div className="flex items-center justify-center space-x-6">
          <Clock className="w-16 h-16 text-blue-600" />
          <span className="text-8xl font-mono font-bold tracking-wider">{time}</span>
        </div>

        {selectedTask && (
          <div className="text-center text-gray-600">
            <p className="font-medium">{selectedProject?.name} - {selectedTask.name}</p>
            {selectedTask.description && (
              <p className="text-sm mt-1">{selectedTask.description}</p>
            )}
          </div>
        )}

        <div className="flex items-center space-x-4">
          <button
            onClick={isTracking ? onStopTracking : onStartTracking}
            disabled={!selectedTask}
            className={`px-8 py-4 rounded-full text-lg flex items-center space-x-3 ${
              !selectedTask
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isTracking
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
          >
            {isTracking ? (
              <>
                <Square className="w-8 h-8" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="w-8 h-8" />
                <span>Start</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenManualEntry}
            className="px-8 py-4 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center space-x-3 text-lg"
          >
            <Plus className="w-8 h-8" />
            <span>Manual Entry</span>
          </button>
        </div>
      </div>
    </div>
  );
};