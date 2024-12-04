import React, { useState } from 'react';
import { Folder, ChevronDown, ChevronRight, Plus, Trash2, PlusCircle } from 'lucide-react';
import { Project, Task } from '../types';
import { Modal } from './Modal';
import { ProjectForm } from './ProjectForm';
import { TaskForm } from './TaskForm';

interface ProjectListProps {
  projects: Project[];
  selectedProject: Project | null;
  selectedTask: Task | null;
  onSelectProject: (project: Project) => void;
  onSelectTask: (task: Task) => void;
  onDeleteProject: (projectId: string) => void;
  onAddProject: (project: Omit<Project, 'id' | 'tasks'>) => void;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onDeleteTask: (projectId: string, taskId: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  selectedProject,
  selectedTask,
  onSelectProject,
  onSelectTask,
  onDeleteProject,
  onAddProject,
  onAddTask,
  onDeleteTask,
}) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [selectedProjectForTask, setSelectedProjectForTask] = useState<Project | null>(null);

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleAddTask = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProjectForTask(project);
      setIsNewTaskModalOpen(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <Folder className="w-5 h-5 mr-2 text-blue-600" />
            Projects
          </h2>
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
        <div className="space-y-2">
          {projects.map((project) => (
            <div key={project.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    onSelectProject(project);
                    toggleProject(project.id);
                  }}
                  className={`flex-1 text-left px-4 py-2 rounded-lg transition-colors flex items-center justify-between ${
                    selectedProject?.id === project.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: project.color }}
                    />
                    <span>{project.name}</span>
                  </div>
                  {expandedProjects.has(project.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => onDeleteProject(project.id)}
                  className="ml-2 p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {expandedProjects.has(project.id) && (
                <div className="ml-8 space-y-1">
                  {project.tasks.map((task) => (
                    <div key={task.id} className="flex items-center">
                      <button
                        onClick={() => onSelectTask(task)}
                        className={`flex-1 text-left px-4 py-2 rounded-lg transition-colors ${
                          selectedTask?.id === task.id
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {task.name}
                      </button>
                      <button
                        onClick={() => onDeleteTask(project.id, task.id)}
                        className="ml-2 p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddTask(project.id)}
                    className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Task</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title="Add New Project"
      >
        <ProjectForm
          onSubmit={(project) => {
            onAddProject(project);
            setIsNewProjectModalOpen(false);
          }}
        />
      </Modal>

      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title={`Add Task to ${selectedProjectForTask?.name}`}
      >
        {selectedProjectForTask && (
          <TaskForm
            projectId={selectedProjectForTask.id}
            onSubmit={(task) => {
              onAddTask(task);
              setIsNewTaskModalOpen(false);
              setSelectedProjectForTask(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};