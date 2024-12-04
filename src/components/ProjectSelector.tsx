import React from 'react';
import { Project, Task } from '../types';

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
  return (
    <div className="flex items-center justify-center space-x-4 w-full max-w-xl">
      <div className="relative w-1/2">
        <select
          value={selectedProject?.id || ''}
          onChange={(e) => {
            const project = projects.find(p => p.id === e.target.value);
            if (project) {
              onSelectProject(project);
              // Reset task selection when project changes
              onSelectTask(project.tasks[0]);
            }
          }}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg py-2 pl-10"
        >
          <option value="">Select Project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id} className="flex items-center">
              {project.name}
            </option>
          ))}
        </select>
        {selectedProject && (
          <div 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
            style={{ backgroundColor: selectedProject.color }}
          />
        )}
      </div>

      {selectedProject && (
        <select
          value={selectedTask?.id || ''}
          onChange={(e) => {
            const task = selectedProject.tasks.find(t => t.id === e.target.value);
            if (task) {
              onSelectTask(task);
            }
          }}
          className="block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg py-2"
        >
          <option value="">Select Task</option>
          {selectedProject.tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};