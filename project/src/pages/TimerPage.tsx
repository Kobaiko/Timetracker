import React, { useState } from 'react';
import { useTimeState } from '../contexts/TimeStateContext';
import { useAuth } from '../contexts/AuthContext';
import { Timer } from '../components/Timer';
import { ProjectList } from '../components/ProjectList';
import { TimeEntryList } from '../components/TimeEntryList';
import { Modal } from '../components/Modal';
import { ManualTimeEntry } from '../components/ManualTimeEntry';
import { Project, Task } from '../types';
import { saveTimeEntry } from '../services/firebase';

export const TimerPage: React.FC = () => {
  const { state, dispatch } = useTimeState();
  const { currentUser } = useAuth();
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const clientProjects = state.projects.filter(
    p => p.clientId === state.selectedClientId
  );

  const handleStartTracking = () => {
    if (!selectedProject || !selectedTask) return;

    dispatch({
      type: 'START_TRACKING',
      payload: {
        taskId: selectedTask.id,
        projectId: selectedProject.id,
        description: selectedTask.name,
        startTime: new Date(),
      },
    });
  };

  const handleStopTracking = () => {
    dispatch({
      type: 'STOP_TRACKING',
      payload: new Date(),
    });
  };

  const handleManualEntry = async (entry: {
    taskId: string;
    projectId: string;
    description: string;
    startTime: Date;
    endTime: Date;
  }) => {
    if (!currentUser) return;

    try {
      const newEntry = {
        ...entry,
        id: crypto.randomUUID()
      };

      await saveTimeEntry(currentUser.uid, newEntry);
      dispatch({
        type: 'ADD_MANUAL_ENTRY',
        payload: entry,
      });
      setIsManualEntryOpen(false);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving manual entry:', error);
    }
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    if (project.tasks.length > 0) {
      setSelectedTask(project.tasks[0]);
    } else {
      setSelectedTask(null);
    }
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
  };

  const handleTimeEntrySaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-8">
      <Timer
        isTracking={state.isTracking}
        currentEntry={state.currentEntry}
        onStartTracking={handleStartTracking}
        onStopTracking={handleStopTracking}
        selectedProject={selectedProject}
        selectedTask={selectedTask}
        onOpenManualEntry={() => setIsManualEntryOpen(true)}
        projects={clientProjects}
        onSelectProject={handleSelectProject}
        onSelectTask={handleSelectTask}
        onTimeEntrySaved={handleTimeEntrySaved}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProjectList
          projects={clientProjects}
          selectedProject={selectedProject}
          selectedTask={selectedTask}
          onSelectProject={handleSelectProject}
          onSelectTask={handleSelectTask}
        />

        <TimeEntryList
          key={refreshKey}
          entries={state.entries}
          projects={clientProjects}
        />
      </div>

      <Modal
        isOpen={isManualEntryOpen}
        onClose={() => setIsManualEntryOpen(false)}
        title="Add Manual Time Entry"
      >
        <ManualTimeEntry
          projects={clientProjects}
          onSubmit={handleManualEntry}
        />
      </Modal>
    </div>
  );
};