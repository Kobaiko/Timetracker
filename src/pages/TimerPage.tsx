import React, { useState, useEffect } from 'react';
import { useTimeState } from '../contexts/TimeStateContext';
import { Timer } from '../components/Timer';
import { ProjectList } from '../components/ProjectList';
import { TimeEntryList } from '../components/TimeEntryList';
import { Modal } from '../components/Modal';
import { ManualTimeEntry } from '../components/ManualTimeEntry';
import { Project, Task } from '../types';

export const TimerPage: React.FC = () => {
  const { state, dispatch } = useTimeState();
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Clear data on component mount
  useEffect(() => {
    dispatch({ type: 'CLEAR_DATA' });
  }, []);

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

  const handleAddProject = (project: Omit<Project, 'id' | 'tasks'>) => {
    dispatch({
      type: 'ADD_PROJECT',
      payload: { project },
    });
  };

  const handleDeleteProject = (projectId: string) => {
    dispatch({
      type: 'DELETE_PROJECT',
      payload: projectId,
    });
    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
      setSelectedTask(null);
    }
  };

  const handleAddTask = (task: Omit<Task, 'id'>) => {
    dispatch({
      type: 'ADD_TASK',
      payload: task,
    });
  };

  const handleDeleteTask = (projectId: string, taskId: string) => {
    dispatch({
      type: 'DELETE_TASK',
      payload: { projectId, taskId },
    });
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  const handleManualEntry = (entry: {
    taskId: string;
    projectId: string;
    description: string;
    startTime: Date;
    endTime: Date;
  }) => {
    dispatch({
      type: 'ADD_MANUAL_ENTRY',
      payload: entry,
    });
    setIsManualEntryOpen(false);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setSelectedTask(null); // Reset task selection when project changes
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
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
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ProjectList
          projects={clientProjects}
          selectedProject={selectedProject}
          selectedTask={selectedTask}
          onSelectProject={handleSelectProject}
          onSelectTask={handleSelectTask}
          onDeleteProject={handleDeleteProject}
          onAddProject={handleAddProject}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
        />

        <TimeEntryList
          entries={state.entries.filter(e => {
            const project = clientProjects.find(p => p.id === e.projectId);
            return !!project;
          })}
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