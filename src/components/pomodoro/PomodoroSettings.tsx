import React from 'react';
import { Settings } from 'lucide-react';
import { Modal } from '../Modal';

interface PomodoroSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    workTime: number;
    breakTime: number;
    longBreakTime: number;
  };
  onSave: (settings: {
    workTime: number;
    breakTime: number;
    longBreakTime: number;
  }) => void;
}

export const PomodoroSettings: React.FC<PomodoroSettingsProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = React.useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Timer Settings"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="workTime" className="block text-sm font-medium text-gray-700">
            Focus Time (minutes)
          </label>
          <input
            type="number"
            id="workTime"
            min="1"
            max="60"
            value={localSettings.workTime / (60 * 1000)}
            onChange={(e) => setLocalSettings(s => ({
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
            value={localSettings.breakTime / (60 * 1000)}
            onChange={(e) => setLocalSettings(s => ({
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
            value={localSettings.longBreakTime / (60 * 1000)}
            onChange={(e) => setLocalSettings(s => ({
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
  );
};