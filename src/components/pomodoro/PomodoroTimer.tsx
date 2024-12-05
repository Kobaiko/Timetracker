import React from 'react';
import { Play, Square, Pause } from 'lucide-react';
import { usePomodoroTimer } from '../../hooks/usePomodoroTimer';
import { formatTime } from '../../utils/timeUtils';

interface PomodoroTimerProps {
  duration: number;
  mode: string;
  onComplete: () => void;
  onStateChange: (isRunning: boolean) => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  duration,
  mode,
  onComplete,
  onStateChange,
}) => {
  const {
    timeRemaining,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    stop
  } = usePomodoroTimer(duration, onComplete);

  React.useEffect(() => {
    onStateChange(isRunning);
  }, [isRunning, onStateChange]);

  const handleStartStop = () => {
    if (!isRunning) {
      start();
    } else {
      stop();
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  const getProgressPercentage = (): number => {
    return (timeRemaining / duration) * 100;
  };

  return (
    <div className="relative w-64 h-64">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="128"
          cy="128"
          r="120"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="8"
        />
        <circle
          cx="128"
          cy="128"
          r="120"
          fill="none"
          stroke={mode === 'work' ? '#3B82F6' : '#10B981'}
          strokeWidth="8"
          strokeDasharray={2 * Math.PI * 120}
          strokeDashoffset={2 * Math.PI * 120 * (1 - getProgressPercentage() / 100)}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-mono font-bold">
          {formatTime(timeRemaining)}
        </span>
      </div>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
        <button
          onClick={handleStartStop}
          className={`p-4 rounded-full ${
            isRunning
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-green-100 text-green-600 hover:bg-green-200'
          }`}
        >
          {isRunning ? <Square className="w-8 h-8" /> : <Play className="w-8 h-8" />}
        </button>
        {isRunning && (
          <button
            onClick={handlePauseResume}
            className={`p-4 rounded-full ${
              isPaused
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
            }`}
          >
            {isPaused ? <Play className="w-8 h-8" /> : <Pause className="w-8 h-8" />}
          </button>
        )}
      </div>
    </div>
  );
};