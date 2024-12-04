import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Client, Project, TimeEntry, TimeState, Task } from '../types';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  CLIENTS: 'clients',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  TIME_ENTRIES: 'timeEntries',
  SETTINGS: 'settings'
} as const;

// Helper function to convert Firestore timestamps to Date objects
const convertTimestamps = (data: any) => {
  const result = { ...data };
  Object.keys(result).forEach(key => {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate();
    }
  });
  return result;
};

// Client operations
export const saveClient = async (userId: string, client: Client) => {
  const clientRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.CLIENTS}/${client.id}`);
  await setDoc(clientRef, {
    ...client,
    updatedAt: serverTimestamp()
  });
};

export const deleteClient = async (userId: string, clientId: string) => {
  try {
    // Delete client
    await deleteDoc(doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.CLIENTS}/${clientId}`));

    // Delete associated projects
    const projectsSnapshot = await getDocs(
      query(
        collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}`),
        where('clientId', '==', clientId)
      )
    );
    
    // Delete projects and their tasks
    for (const projectDoc of projectsSnapshot.docs) {
      const projectId = projectDoc.id;
      
      // Delete tasks
      const tasksSnapshot = await getDocs(
        collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${projectId}/${COLLECTIONS.TASKS}`)
      );
      
      for (const taskDoc of tasksSnapshot.docs) {
        await deleteDoc(taskDoc.ref);
      }
      
      // Delete project
      await deleteDoc(projectDoc.ref);
    }

    // Delete associated time entries
    const entriesSnapshot = await getDocs(
      query(
        collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}`),
        where('clientId', '==', clientId)
      )
    );

    for (const entryDoc of entriesSnapshot.docs) {
      await deleteDoc(entryDoc.ref);
    }
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

// Project operations
export const saveProject = async (userId: string, project: Project) => {
  const projectRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${project.id}`);
  
  // Save project data without tasks
  const { tasks, ...projectData } = project;
  await setDoc(projectRef, {
    ...projectData,
    updatedAt: serverTimestamp()
  });

  // Save tasks
  for (const task of tasks) {
    await saveTask(userId, project.id, task);
  }
};

export const deleteProject = async (userId: string, projectId: string) => {
  // Delete project tasks
  const tasksSnapshot = await getDocs(
    collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${projectId}/${COLLECTIONS.TASKS}`)
  );
  
  for (const taskDoc of tasksSnapshot.docs) {
    await deleteDoc(taskDoc.ref);
  }

  // Delete project
  await deleteDoc(doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${projectId}`));

  // Delete associated time entries
  const entriesSnapshot = await getDocs(
    query(
      collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}`),
      where('projectId', '==', projectId)
    )
  );

  for (const entryDoc of entriesSnapshot.docs) {
    await deleteDoc(entryDoc.ref);
  }
};

// Task operations
export const saveTask = async (userId: string, projectId: string, task: Task) => {
  const taskRef = doc(
    db,
    `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${projectId}/${COLLECTIONS.TASKS}/${task.id}`
  );
  
  await setDoc(taskRef, {
    ...task,
    updatedAt: serverTimestamp()
  });
};

export const deleteTask = async (userId: string, projectId: string, taskId: string) => {
  // Delete task
  await deleteDoc(
    doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${projectId}/${COLLECTIONS.TASKS}/${taskId}`)
  );

  // Delete associated time entries
  const entriesSnapshot = await getDocs(
    query(
      collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}`),
      where('taskId', '==', taskId)
    )
  );

  for (const entryDoc of entriesSnapshot.docs) {
    await deleteDoc(entryDoc.ref);
  }
};

// Time entry operations
export const saveTimeEntry = async (userId: string, entry: TimeEntry) => {
  const entryRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}/${entry.id}`);
  await setDoc(entryRef, {
    ...entry,
    startTime: Timestamp.fromDate(entry.startTime),
    endTime: entry.endTime ? Timestamp.fromDate(entry.endTime) : null,
    updatedAt: serverTimestamp()
  });
};

export const saveCurrentEntry = async (userId: string, entry: TimeEntry | null) => {
  const currentEntryRef = doc(db, `${COLLECTIONS.USERS}/${userId}/currentEntry/entry`);
  
  if (entry) {
    await setDoc(currentEntryRef, {
      ...entry,
      startTime: Timestamp.fromDate(entry.startTime),
      endTime: entry.endTime ? Timestamp.fromDate(entry.endTime) : null,
      updatedAt: serverTimestamp()
    });
  } else {
    await deleteDoc(currentEntryRef);
  }
};

// Settings operations
export const saveSettings = async (userId: string, settings: { selectedClientId?: string }) => {
  const settingsRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.SETTINGS}/preferences`);
  await setDoc(settingsRef, {
    ...settings,
    updatedAt: serverTimestamp()
  });
};

// Load complete time state
export const loadTimeState = async (userId: string): Promise<TimeState> => {
  try {
    // Load clients
    const clientsSnapshot = await getDocs(
      collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.CLIENTS}`)
    );
    const clients: Client[] = clientsSnapshot.docs.map(doc => convertTimestamps(doc.data()) as Client);

    // Load projects with their tasks
    const projectsSnapshot = await getDocs(
      collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}`)
    );
    
    const projects: Project[] = await Promise.all(
      projectsSnapshot.docs.map(async (projectDoc) => {
        const projectData = convertTimestamps(projectDoc.data());
        
        // Load tasks for each project
        const tasksSnapshot = await getDocs(
          collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${projectDoc.id}/${COLLECTIONS.TASKS}`)
        );
        
        const tasks = tasksSnapshot.docs.map(taskDoc => 
          convertTimestamps(taskDoc.data()) as Task
        );
        
        return {
          ...projectData,
          tasks
        } as Project;
      })
    );

    // Load time entries
    const entriesSnapshot = await getDocs(
      collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}`)
    );
    const entries: TimeEntry[] = entriesSnapshot.docs.map(doc => {
      const data = convertTimestamps(doc.data());
      return data as TimeEntry;
    });

    // Load current entry
    const currentEntryDoc = await getDocs(
      collection(db, `${COLLECTIONS.USERS}/${userId}/currentEntry`)
    );
    const currentEntry = currentEntryDoc.docs[0]?.data();

    // Load settings
    const settingsDoc = await getDocs(
      collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.SETTINGS}`)
    );
    const settings = settingsDoc.docs[0]?.data();

    return {
      clients,
      projects,
      entries,
      currentEntry: currentEntry ? convertTimestamps(currentEntry) as TimeEntry : null,
      isTracking: !!currentEntry,
      selectedClientId: settings?.selectedClientId || clients[0]?.id
    };
  } catch (error) {
    console.error('Error loading time state:', error);
    throw error;
  }
};

// Save complete time state
export const saveTimeState = async (userId: string, state: TimeState) => {
  try {
    // Save clients
    for (const client of state.clients) {
      await saveClient(userId, client);
    }

    // Save projects and their tasks
    for (const project of state.projects) {
      await saveProject(userId, project);
    }

    // Save time entries
    for (const entry of state.entries) {
      await saveTimeEntry(userId, entry);
    }

    // Save current entry
    await saveCurrentEntry(userId, state.currentEntry);

    // Save settings
    await saveSettings(userId, {
      selectedClientId: state.selectedClientId
    });
  } catch (error) {
    console.error('Error saving time state:', error);
    throw error;
  }
};