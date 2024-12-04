import { 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  query, 
  where,
  deleteDoc,
  writeBatch,
  Timestamp,
  orderBy,
  startAt,
  endAt
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Client, Project, TimeEntry, TimeState, Task } from '../types';

const COLLECTIONS = {
  USERS: 'users',
  TIME_ENTRIES: 'timeEntries',
  CLIENTS: 'clients',
  PROJECTS: 'projects',
  TASKS: 'tasks'
} as const;

// Time Entries
export const saveTimeEntry = async (userId: string, entry: TimeEntry): Promise<void> => {
  const entryRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}/${entry.id}`);
  await setDoc(entryRef, {
    ...entry,
    startTime: Timestamp.fromDate(entry.startTime),
    endTime: entry.endTime ? Timestamp.fromDate(entry.endTime) : null
  });
};

export const deleteTimeEntry = async (userId: string, entryId: string): Promise<void> => {
  const entryRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}/${entryId}`);
  await deleteDoc(entryRef);
};

export const loadTimeEntriesForRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<TimeEntry[]> => {
  const entriesRef = collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}`);
  const q = query(
    entriesRef,
    orderBy('startTime'),
    startAt(Timestamp.fromDate(startDate)),
    endAt(Timestamp.fromDate(endDate))
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      startTime: data.startTime.toDate(),
      endTime: data.endTime?.toDate() || null
    } as TimeEntry;
  });
};

// Clients
export const saveClient = async (userId: string, client: Client): Promise<void> => {
  const clientRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.CLIENTS}/${client.id}`);
  await setDoc(clientRef, client);
};

export const deleteClient = async (userId: string, clientId: string): Promise<void> => {
  const batch = writeBatch(db);
  
  // Delete client
  const clientRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.CLIENTS}/${clientId}`);
  batch.delete(clientRef);

  // Delete associated projects
  const projectsRef = collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}`);
  const projectsQuery = query(projectsRef, where('clientId', '==', clientId));
  const projectsSnapshot = await getDocs(projectsQuery);
  
  projectsSnapshot.docs.forEach(projectDoc => {
    batch.delete(projectDoc.ref);
  });

  await batch.commit();
};

// Projects
export const saveProject = async (userId: string, project: Project): Promise<void> => {
  const projectRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${project.id}`);
  await setDoc(projectRef, project);
};

export const deleteProject = async (userId: string, projectId: string): Promise<void> => {
  const batch = writeBatch(db);
  
  // Delete project
  const projectRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${projectId}`);
  batch.delete(projectRef);

  // Delete associated tasks
  const tasksRef = collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TASKS}`);
  const tasksQuery = query(tasksRef, where('projectId', '==', projectId));
  const tasksSnapshot = await getDocs(tasksQuery);
  
  tasksSnapshot.docs.forEach(taskDoc => {
    batch.delete(taskDoc.ref);
  });

  await batch.commit();
};

// Tasks
export const saveTask = async (userId: string, task: Task): Promise<void> => {
  const taskRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TASKS}/${task.id}`);
  await setDoc(taskRef, task);
};

export const deleteTask = async (userId: string, projectId: string, taskId: string): Promise<void> => {
  const taskRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TASKS}/${taskId}`);
  await deleteDoc(taskRef);
};

// State Management
export const saveTimeState = async (userId: string, state: TimeState): Promise<void> => {
  const batch = writeBatch(db);

  // Save clients
  for (const client of state.clients) {
    const clientRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.CLIENTS}/${client.id}`);
    batch.set(clientRef, client);
  }

  // Save projects
  for (const project of state.projects) {
    const projectRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${project.id}`);
    batch.set(projectRef, project);
  }

  // Save tasks
  for (const project of state.projects) {
    for (const task of project.tasks) {
      const taskRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TASKS}/${task.id}`);
      batch.set(taskRef, task);
    }
  }

  await batch.commit();
};

export const loadTimeState = async (userId: string): Promise<TimeState> => {
  // Load clients
  const clientsRef = collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.CLIENTS}`);
  const clientsSnapshot = await getDocs(clientsRef);
  const clients = clientsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Client);

  // Load projects
  const projectsRef = collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}`);
  const projectsSnapshot = await getDocs(projectsRef);
  const projects = projectsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Project);

  // Load tasks
  const tasksRef = collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TASKS}`);
  const tasksSnapshot = await getDocs(tasksRef);
  const tasks = tasksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Task);

  // Associate tasks with projects
  const projectsWithTasks = projects.map(project => ({
    ...project,
    tasks: tasks.filter(task => task.projectId === project.id)
  }));

  // Load today's entries
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  const entries = await loadTimeEntriesForRange(userId, startOfToday, endOfToday);

  return {
    isTracking: false,
    currentEntry: null,
    entries,
    projects: projectsWithTasks,
    clients,
    selectedClientId: clients[0]?.id
  };
};