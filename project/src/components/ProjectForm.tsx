import React, { useState } from 'react';
import { Project } from '../types';

interface ProjectFormProps {
  onSubmit: (project: Omit<Project, 'id' | 'tasks'>) => void;
  initialData?: Project;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [color, setColor] = useState(initialData?.color || '#3B82F6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({ 
      name: name.trim(), 
      color,
      clientId: initialData?.clientId || ''
    });
    
    setName('');
    setColor('#3B82F6');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Project Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700">
          Project Color
        </label>
        <div className="mt-1 flex items-center space-x-3">
          <input
            type="color"
            id="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <div 
            className="w-10 h-10 rounded-full border-2 border-gray-200"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {initialData ? 'Update Project' : 'Add Project'}
      </button>
    </form>
  );
};