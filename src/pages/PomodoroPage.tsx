import React, { useState } from 'react';
import { Play, Square, RotateCcw, Settings } from 'lucide-react';
import { Modal } from '../components/Modal';
import { useTimer } from '../hooks/useTimer';

const DEFAULT_WORK_TIME = 25 * 60 * 1000; // 25 minutes in milliseconds
const DEFAULT_BREAK_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
const DEFAULT_LONG_BREAK_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
const SESSIONS_BEFORE_LONG_BREAK = 4;

type TimerMode = 'work' | 'break' | 'longBreak';

const modeLabels: Record<TimerMode, string> = {
  work: 'Focus Time',
  break: 'Short Break',
  longBreak: 'Long Break'
};

export const PomodoroPage: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>('work');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    workTime: DEFAULT_WORK_TIME,
    breakTime: DEFAULT_BREAK_TIME,
    longBreakTime: DEFAULT_LONG_BREAK_TIME,
  });

  const handleTimerComplete = () => {
    playNotificationSound();
    
    if (mode === 'work') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      
      if (newSessionsCompleted % SESSIONS_BEFORE_LONG_BREAK === 0) {
        setMode('longBreak');
      } else {
        setMode('break');
      }
    } else {
      setMode('work');
    }
  };

  const { 
    isRunning, 
    isPaused,
    timeElapsed,
    start,
    stop,
    pause,
    resume
  } = useTimer(
    `pomodoro_${mode}`, 
    handleTimerComplete,
    getTimeForMode(mode),
    true
  );

  const playNotificationSound = () => {
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play().catch(() => {
      // Ignore errors if audio can't play
    });
  };

  const toggleTimer = () => {
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

  const resetTimer = () => {
    stop();
  };

  const handleModeChange = (newMode: TimerMode) => {
    stop();
    setMode(newMode);
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    const total = getTimeForMode(mode);
    return ((total - timeElapsed) / total) * 100;
  };

  const getTimeForMode = (selectedMode: TimerMode): number => {
    switch (selectedMode) {
      case 'work':
        return settings.workTime;
      case 'break':
        return settings.breakTime;
      case 'longBreak':
        return settings.longBreakTime;
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <div className="flex flex-col items-center space-y-6">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            {(Object.keys(modeLabels) as TimerMode[]).map((timerMode) => (
              <button
                key={timerMode}
                onClick={() => handleModeChange(timerMode)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  mode === timerMode
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {modeLabels[timerMode]}
              </button>
            ))}
          </div>

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
              <span className="text-6xl font-mono font-bold">{formatTime(timeElapsed)}</span>
              <span className="text-lg font-medium text-gray-600 capitalize mt-2">
                {modeLabels[mode]}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTimer}
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
                {isPaused ? <Play className="w-8 h-8" /> : <Square className="w-8 h-8" />}
              </button>
            )}
            <button
              onClick={resetTimer}
              className="p-4 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <RotateCcw className="w-8 h-8" />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-4 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <Settings className="w-8 h-8" />
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-600">
              Sessions completed: {sessionsCompleted}
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Timer Settings"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsSettingsOpen(false);
            stop();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="workTime" className="block text-sm font-medium text-gray-700">
              Focus Time (minutes)
            </label>
            <input
              type="number"
              id="workTime"
              min="1"
              max="60"
              value={settings.workTime / (60 * 1000)}
              onChange={(e) => setSettings(s => ({
                ...s,
                workTime: parseInt(e.target.value) * 60 * 1000
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="breakTime" className="block text-sm font-medium text-gray-700">
              Short Break (minutes)
            </label>
            <input
              type="number"
              id="breakTime"
              min="1"
              max="30"
              value={settings.breakTime / (60 * 1000)}
              onChange={(e) => setSettings(s => ({
                ...s,
                breakTime: parseInt(e.target.value) * 60 * 1000
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="longBreakTime" className="block text-sm font-medium text-gray-700">
              Long Break (minutes)
            </label>
            <input
              type="number"
              id="longBreakTime"
              min="1"
              max="60"
              value={settings.longBreakTime / (60 * 1000)}
              onChange={(e) => setSettings(s => ({
                ...s,
                longBreakTime: parseInt(e.target.value) * 60 * 1000
              }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Settings
          </button>
        </form>
      </Modal>
    </div>
  );
};