import React, { useEffect } from 'react';
import { Play, Square, Clock, Plus, Pause } from 'lucide-react';
import { TimeEntry, Project, Task } from '../types';
import { formatDuration } from '../utils/timeUtils';
import { ProjectSelector } from './ProjectSelector';
import { useAuth } from '../contexts/AuthContext';
import { saveTimeEntry } from '../services/firebase';
import { useTimer } from '../hooks/useTimer';

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
  
  const { 
    isRunning, 
    isPaused, 
    timeElapsed,
    start: startTimer,
    stop: stopTimer,
    pause: pauseTimer,
    resume: resumeTimer
  } = useTimer('time_tracker');

  useEffect(() => {
    return () => {
      if (isRunning) {
        stopTimer();
      }
    };
  }, [isRunning, stopTimer]);

  const handleStartTracking = () => {
    if (!selectedTask) return;
    startTimer();
    onStartTracking();
  };

  const handleStopTracking = async () => {
    if (!currentUser || !currentEntry) return;
    
    stopTimer();
    const endTime = new Date();
    const completedEntry = { ...currentEntry, endTime };
    
    try {
      await saveTimeEntry(currentUser.uid, completedEntry);
      onStopTracking();
      onTimeEntrySaved?.();
    } catch (error) {
      console.error('Error saving time entry:', error);
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resumeTimer();
    } else {
      pauseTimer();
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
            {formatDuration(new Date(0), new Date(timeElapsed))}
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
            onClick={isRunning ? handleStopTracking : handleStartTracking}
            disabled={!selectedTask}
            className={`px-8 py-4 rounded-full text-lg flex items-center space-x-3 ${
              !selectedTask
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isRunning
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
          >
            {isRunning ? (
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

          {isRunning && (
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