import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Clock, Plus, Pause } from 'lucide-react';
import { TimeEntry, Project, Task } from '../types';
import { formatDuration } from '../utils/timeUtils';
import { ProjectSelector } from './ProjectSelector';
import { useAuth } from '../contexts/AuthContext';
import { saveTimeEntry } from '../services/firebase';

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
  onTimeEntrySaved?: () => void;
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
  onTimeEntrySaved,
}) => {
  const { currentUser } = useAuth();
  const [time, setTime] = useState<string>('00:00:00');
  const [isPaused, setIsPaused] = useState(false);
  const lastTickRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  useEffect(() => {
    let interval: number | undefined;
    
    if (isTracking && currentEntry && !isPaused) {
      const updateTimer = () => {
        const now = Date.now();
        if (lastTickRef.current === 0) {
          lastTickRef.current = now;
        }

        const elapsed = now - lastTickRef.current;
        accumulatedTimeRef.current += elapsed;
        lastTickRef.current = now;

        const totalTime = accumulatedTimeRef.current + 
          (currentEntry.startTime.getTime() - currentEntry.startTime.getTime());
        setTime(formatDuration(new Date(0), new Date(totalTime)));
      };
      
      updateTimer(); // Initial update
      interval = window.setInterval(updateTimer, 1000);
    } else if (!isTracking) {
      setTime('00:00:00');
      lastTickRef.current = 0;
      accumulatedTimeRef.current = 0;
      setIsPaused(false);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTracking, currentEntry, isPaused]);

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      lastTickRef.current = Date.now();
    }
  };

  const handleStopTracking = async () => {
    if (currentUser && currentEntry) {
      const endTime = new Date();
      const completedEntry = { ...currentEntry, endTime };
      
      try {
        await saveTimeEntry(currentUser.uid, completedEntry);
        onStopTracking();
        onTimeEntrySaved?.();
      } catch (error) {
        console.error('Error saving time entry:', error);
      }
    }
  };

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
          <span className={`text-8xl font-mono font-bold tracking-wider ${isPaused ? 'text-gray-400' : ''}`}>
            {time}
          </span>
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
            onClick={isTracking ? handleStopTracking : onStartTracking}
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

          {isTracking && (
            <button
              onClick={handlePauseResume}
              className={`px-8 py-4 rounded-full text-lg flex items-center space-x-3 ${
                isPaused
                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                  : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
              }`}
            >
              {isPaused ? (
                <>
                  <Play className="w-8 h-8" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-8 h-8" />
                  <span>Pause</span>
                </>
              )}
            </button>
          )}

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