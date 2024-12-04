import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Project, Task } from '../types';
import { Modal } from './Modal';
import { ProjectForm } from './ProjectForm';
import { TaskForm } from './TaskForm';
import { useTimeState } from '../contexts/TimeStateContext';

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject: Project | null;
  selectedTask: Task | null;
  onSelectProject: (project: Project) => void;
  onSelectTask: (task: Task) => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProject,
  selectedTask,
  onSelectProject,
  onSelectTask,
}) => {
  const { dispatch } = useTimeState();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  const handleAddProject = (project: Omit<Project, 'id' | 'tasks'>) => {
    dispatch({ type: 'ADD_PROJECT', payload: project });
    setIsNewProjectModalOpen(false);
  };

  const handleAddTask = (task: Omit<Task, 'id'>) => {
    dispatch({ type: 'ADD_TASK', payload: task });
    setIsNewTaskModalOpen(false);
  };

  return (
    <div className="flex items-center justify-center space-x-4 w-full max-w-xl">
      <div className="relative w-1/2">
        <div className="flex items-center space-x-2">
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const project = projects.find(p => p.id === e.target.value);
              if (project) {
                onSelectProject(project);
                if (project.tasks.length > 0) {
                  onSelectTask(project.tasks[0]);
                }
              }
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg py-2 pl-10"
          >
            <option value="">Select Project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
            title="Add New Project"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        {selectedProject && (
          <div 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
            style={{ backgroundColor: selectedProject.color }}
          />
        )}
      </div>

      {selectedProject && (
        <div className="relative w-1/2">
          <div className="flex items-center space-x-2">
            <select
              value={selectedTask?.id || ''}
              onChange={(e) => {
                const task = selectedProject.tasks.find(t => t.id === e.target.value);
                if (task) {
                  onSelectTask(task);
                }
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg py-2"
            >
              <option value="">Select Task</option>
              {selectedProject.tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
              title="Add New Task"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title="Add New Project"
      >
        <ProjectForm onSubmit={handleAddProject} />
      </Modal>

      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title="Add New Task"
      >
        {selectedProject && (
          <TaskForm
            projectId={selectedProject.id}
            onSubmit={handleAddTask}
          />
        )}
      </Modal>
    </div>
  );
};