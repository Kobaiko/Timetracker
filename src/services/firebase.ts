import { 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  getDoc,
  query, 
  where,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Client, Project, TimeEntry, TimeState, Task } from '../types';

const COLLECTIONS = {
  USERS: 'users',
  CLIENTS: 'clients',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  TIME_ENTRIES: 'timeEntries',
  SETTINGS: 'settings'
} as const;

const convertTimestamps = (data: any) => {
  const result = { ...data };
  Object.keys(result).forEach(key => {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate();
    }
  });
  return result;
};

export const saveTimeState = async (userId: string, state: TimeState) => {
  try {
    // Create user document if it doesn't exist
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    const batch = writeBatch(db);

    // Save clients
    for (const client of state.clients) {
      const clientRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.CLIENTS}/${client.id}`);
      batch.set(clientRef, {
        ...client,
        updatedAt: serverTimestamp()
      });
    }

    // Save projects and their tasks
    for (const project of state.projects) {
      const { tasks, ...projectData } = project;
      const projectRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${project.id}`);
      
      batch.set(projectRef, {
        ...projectData,
        updatedAt: serverTimestamp()
      });

      // Save tasks
      for (const task of tasks) {
        const taskRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${project.id}/${COLLECTIONS.TASKS}/${task.id}`);
        batch.set(taskRef, {
          ...task,
          updatedAt: serverTimestamp()
        });
      }
    }

    // Save time entries
    for (const entry of state.entries) {
      const entryRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}/${entry.id}`);
      batch.set(entryRef, {
        ...entry,
        startTime: Timestamp.fromDate(entry.startTime),
        endTime: entry.endTime ? Timestamp.fromDate(entry.endTime) : null,
        updatedAt: serverTimestamp()
      });
    }

    // Save current entry if exists
    const currentEntryRef = doc(db, `${COLLECTIONS.USERS}/${userId}/currentEntry/entry`);
    if (state.currentEntry) {
      batch.set(currentEntryRef, {
        ...state.currentEntry,
        startTime: Timestamp.fromDate(state.currentEntry.startTime),
        endTime: state.currentEntry.endTime ? Timestamp.fromDate(state.currentEntry.endTime) : null,
        updatedAt: serverTimestamp()
      });
    } else {
      batch.delete(currentEntryRef);
    }

    // Save settings
    const settingsRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.SETTINGS}/preferences`);
    batch.set(settingsRef, {
      selectedClientId: state.selectedClientId,
      updatedAt: serverTimestamp()
    });

    await batch.commit();
  } catch (error) {
    console.error('Error saving time state:', error);
    throw error;
  }
};

export const loadTimeState = async (userId: string): Promise<TimeState> => {
  try {
    // Check if user document exists
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return getInitialState();
    }

    // Load clients
    const clientsSnapshot = await getDocs(
      collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.CLIENTS}`)
    );
    const clients: Client[] = clientsSnapshot.docs.map(doc => ({
      ...convertTimestamps(doc.data()),
      id: doc.id
    })) as Client[];

    // Load projects with their tasks
    const projectsSnapshot = await getDocs(
      collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}`)
    );
    
    const projects: Project[] = await Promise.all(
      projectsSnapshot.docs.map(async (projectDoc) => {
        const projectData = convertTimestamps(projectDoc.data());
        
        const tasksSnapshot = await getDocs(
          collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${projectDoc.id}/${COLLECTIONS.TASKS}`)
        );
        
        const tasks = tasksSnapshot.docs.map(taskDoc => ({
          ...convertTimestamps(taskDoc.data()),
          id: taskDoc.id
        })) as Task[];
        
        return {
          ...projectData,
          id: projectDoc.id,
          tasks
        } as Project;
      })
    );

    // Load time entries
    const entriesSnapshot = await getDocs(
      collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}`)
    );
    const entries: TimeEntry[] = entriesSnapshot.docs.map(doc => ({
      ...convertTimestamps(doc.data()),
      id: doc.id
    })) as TimeEntry[];

    // Load current entry
    const currentEntryRef = doc(db, `${COLLECTIONS.USERS}/${userId}/currentEntry/entry`);
    const currentEntryDoc = await getDoc(currentEntryRef);
    const currentEntry = currentEntryDoc.exists() ? convertTimestamps(currentEntryDoc.data()) as TimeEntry : null;

    // Load settings
    const settingsRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.SETTINGS}/preferences`);
    const settingsDoc = await getDoc(settingsRef);
    const settings = settingsDoc.exists() ? settingsDoc.data() : null;

    // If no data exists yet, return initial state
    if (clients.length === 0) {
      return getInitialState();
    }

    return {
      clients,
      projects,
      entries,
      currentEntry,
      isTracking: !!currentEntry,
      selectedClientId: settings?.selectedClientId || clients[0]?.id
    };
  } catch (error) {
    console.error('Error loading time state:', error);
    throw error;
  }
};

const getInitialState = (): TimeState => {
  const defaultClient: Client = {
    id: 'default',
    name: 'Default Client',
    color: '#3B82F6'
  };

  const defaultProject: Project = {
    id: 'default-project',
    clientId: defaultClient.id,
    name: 'General',
    color: '#3B82F6',
    tasks: [{
      id: 'default-task',
      projectId: defaultClient.id,
      name: 'General Task',
      description: 'Default task for general work'
    }]
  };

  return {
    isTracking: false,
    currentEntry: null,
    entries: [],
    projects: [defaultProject],
    clients: [defaultClient],
    selectedClientId: defaultClient.id
  };
};