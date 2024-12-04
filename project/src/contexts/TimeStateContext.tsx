import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { TimeState } from '../types';
import { TimeStateAction, timeStateReducer, getInitialState } from '../reducers/timeStateReducer';
import { saveTimeState, loadTimeState, deleteClient, deleteProject, deleteTask } from '../services/firebase';
import { useAuth } from './AuthContext';

interface TimeStateContextType {
  state: TimeState;
  dispatch: React.Dispatch<TimeStateAction>;
}

const TimeStateContext = createContext<TimeStateContextType | undefined>(undefined);

export const TimeStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [state, dispatch] = useReducer(timeStateReducer, getInitialState());

  useEffect(() => {
    if (currentUser) {
      loadTimeState(currentUser.uid)
        .then((loadedState) => {
          dispatch({ type: 'SET_STATE', payload: loadedState });
        })
        .catch((error) => {
          console.error('Error loading time state:', error);
        });
    }
  }, [currentUser]);

  useEffect(() => {
    const handleStateChange = async () => {
      if (!currentUser) return;

      try {
        await saveTimeState(currentUser.uid, state);
      } catch (error) {
        console.error('Error saving time state:', error);
      }
    };

    handleStateChange();
  }, [state, currentUser]);

  const enhancedDispatch = async (action: TimeStateAction) => {
    if (!currentUser) return;

    switch (action.type) {
      case 'DELETE_CLIENT':
        try {
          await deleteClient(currentUser.uid, action.payload);
        } catch (error) {
          console.error('Error deleting client:', error);
          return;
        }
        break;

      case 'DELETE_PROJECT':
        try {
          await deleteProject(currentUser.uid, action.payload);
        } catch (error) {
          console.error('Error deleting project:', error);
          return;
        }
        break;

      case 'DELETE_TASK':
        try {
          await deleteTask(currentUser.uid, action.payload.projectId, action.payload.taskId);
        } catch (error) {
          console.error('Error deleting task:', error);
          return;
        }
        break;
    }

    dispatch(action);
  };

  return (
    <TimeStateContext.Provider value={{ state, dispatch: enhancedDispatch }}>
      {children}
    </TimeStateContext.Provider>
  );
};

export const useTimeState = () => {
  const context = useContext(TimeStateContext);
  if (!context) {
    throw new Error('useTimeState must be used within a TimeStateProvider');
  }
  return context;
};