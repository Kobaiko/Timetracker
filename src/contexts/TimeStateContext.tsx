import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { TimeState } from '../types';
import { TimeStateAction, timeStateReducer, getInitialState } from '../reducers/timeStateReducer';
import { saveTimeState, loadTimeState } from '../services/firebase';
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
    if (currentUser) {
      saveTimeState(currentUser.uid, state).catch((error) => {
        console.error('Error saving time state:', error);
      });
    }
  }, [state, currentUser]);

  return (
    <TimeStateContext.Provider value={{ state, dispatch }}>
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