import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { PomodoroTimer } from '../components/pomodoro/PomodoroTimer';
import { PomodoroSettings } from '../components/pomodoro/PomodoroSettings';

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
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const handleTimerComplete = () => {
    playNotificationSound();
    setIsTimerRunning(false);
    
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

  const playNotificationSound = () => {
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play().catch(() => {
      // Ignore errors if audio can't play
    });
  };

  const handleModeChange = (newMode: TimerMode) => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
    }
    setMode(newMode);
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

  const handleTimerStateChange = (running: boolean) => {
    setIsTimerRunning(running);
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

          <PomodoroTimer
            key={mode} // Force new instance when mode changes
            duration={getTimeForMode(mode)}
            mode={mode}
            onComplete={handleTimerComplete}
            onStateChange={handleTimerStateChange}
          />

          <div className="text-center">
            <p className="text-gray-600">
              Sessions completed: {sessionsCompleted}
            </p>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-4 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <Settings className="w-8 h-8" />
          </button>
        </div>
      </div>

      <PomodoroSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />
    </div>
  );
};