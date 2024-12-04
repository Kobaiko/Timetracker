import React from 'react';
import { NavLink } from 'react-router-dom';
import { Clock, BarChart2, Timer, Plus, Trash2, LogOut } from 'lucide-react';
import { Client } from '../types';
import { ClientSelector } from './ClientSelector';
import { Modal } from './Modal';
import { ClientForm } from './ClientForm';
import { AlertDialog } from './AlertDialog';
import { useTimeState } from '../contexts/TimeStateContext';
import { useAuth } from '../contexts/AuthContext';

export const Navigation: React.FC = () => {
  const { state, dispatch } = useTimeState();
  const { logout } = useAuth();
  const [isNewClientModalOpen, setIsNewClientModalOpen] = React.useState(false);
  const [clientToDelete, setClientToDelete] = React.useState<Client | null>(null);

  const selectedClient = state.clients.find(c => c.id === state.selectedClientId);

  const handleSelectClient = (clientId: string) => {
    dispatch({ type: 'SELECT_CLIENT', payload: clientId });
  };

  const handleAddClient = (client: Omit<Client, 'id'>) => {
    dispatch({ type: 'ADD_CLIENT', payload: client });
    setIsNewClientModalOpen(false);
  };

  const handleDeleteClient = () => {
    if (clientToDelete) {
      dispatch({ type: 'DELETE_CLIENT', payload: clientToDelete.id });
      setClientToDelete(null);
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`
              }
            >
              <Clock className="w-4 h-4 mr-2" />
              Timer
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`
              }
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              Dashboard
            </NavLink>
            <NavLink
              to="/pomodoro"
              className={({ isActive }) =>
                `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`
              }
            >
              <Timer className="w-4 h-4 mr-2" />
              Pomodoro
            </NavLink>
          </div>

          <div className="flex items-center space-x-4">
            <ClientSelector
              clients={state.clients}
              selectedClientId={state.selectedClientId}
              onSelectClient={handleSelectClient}
            />
            {selectedClient && state.clients.length > 1 && (
              <button
                onClick={() => setClientToDelete(selectedClient)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Client
              </button>
            )}
            <button
              onClick={() => setIsNewClientModalOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-1" />
              New Client
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        title="Add New Client"
      >
        <ClientForm onSubmit={handleAddClient} />
      </Modal>

      <AlertDialog
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        title="Delete Client"
        description={`Are you sure you want to delete "${clientToDelete?.name}"? This will also delete all associated projects and time entries.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteClient}
      />
    </nav>
  );
};