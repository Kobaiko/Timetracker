import { 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  query, 
  where,
  deleteDoc,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Client, Project, TimeEntry, TimeState, Task } from '../types';
import { v4 as uuidv4 } from 'uuid';

const COLLECTIONS = {
  USERS: 'users',
  CLIENTS: 'clients',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  TIME_ENTRIES: 'timeEntries'
} as const;

export const loadTimeState = async (userId: string): Promise<TimeState> => {
  try {
    // Load clients
    const clientsSnapshot = await getDocs(collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.CLIENTS}`));
    const clients = clientsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Client[];

    // Load projects and their tasks
    const projectsSnapshot = await getDocs(collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}`));
    const projects = await Promise.all(projectsSnapshot.docs.map(async doc => {
      const projectData = doc.data();
      const tasksSnapshot = await getDocs(collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${doc.id}/${COLLECTIONS.TASKS}`));
      const tasks = tasksSnapshot.docs.map(taskDoc => ({ ...taskDoc.data(), id: taskDoc.id })) as Task[];
      return { ...projectData, id: doc.id, tasks } as Project;
    }));

    // Load time entries
    const entriesSnapshot = await getDocs(collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}`));
    const entries = entriesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        startTime: data.startTime.toDate(),
        endTime: data.endTime?.toDate()
      } as TimeEntry;
    });

    // If no clients exist, create default data
    if (clients.length === 0) {
      const defaultClient: Client = {
        id: uuidv4(),
        name: 'Default Client',
        color: '#3B82F6'
      };

      const defaultProject: Project = {
        id: uuidv4(),
        clientId: defaultClient.id,
        name: 'General',
        color: '#3B82F6',
        tasks: [{
          id: uuidv4(),
          projectId: defaultClient.id,
          name: 'General Task',
          description: 'Default task for general work'
        }]
      };

      await setDoc(doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.CLIENTS}/${defaultClient.id}`), defaultClient);
      await setDoc(doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${defaultProject.id}`), defaultProject);
      await setDoc(
        doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${defaultProject.id}/${COLLECTIONS.TASKS}/${defaultProject.tasks[0].id}`),
        defaultProject.tasks[0]
      );

      return {
        clients: [defaultClient],
        projects: [defaultProject],
        entries: [],
        isTracking: false,
        currentEntry: null,
        selectedClientId: defaultClient.id
      };
    }

    return {
      clients,
      projects,
      entries,
      isTracking: false,
      currentEntry: null,
      selectedClientId: clients[0]?.id
    };
  } catch (error) {
    console.error('Error loading time state:', error);
    throw error;
  }
};

export const saveTimeState = async (userId: string, state: TimeState): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Save clients
    for (const client of state.clients) {
      const clientRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.CLIENTS}/${client.id}`);
      batch.set(clientRef, client);
    }

    // Save projects and their tasks
    for (const project of state.projects) {
      const projectRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${project.id}`);
      const { tasks, ...projectData } = project;
      batch.set(projectRef, projectData);

      // Save tasks
      for (const task of tasks) {
        const taskRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${project.id}/${COLLECTIONS.TASKS}/${task.id}`);
        batch.set(taskRef, task);
      }
    }

    // Save time entries
    for (const entry of state.entries) {
      const entryRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}/${entry.id}`);
      batch.set(entryRef, {
        ...entry,
        startTime: Timestamp.fromDate(entry.startTime),
        endTime: entry.endTime ? Timestamp.fromDate(entry.endTime) : null
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error saving time state:', error);
    throw error;
  }
};

export const deleteClient = async (userId: string, clientId: string) => {
  const batch = writeBatch(db);

  // Delete client document
  const clientRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.CLIENTS}/${clientId}`);
  batch.delete(clientRef);

  // Get and delete all projects for this client
  const projectsSnapshot = await getDocs(
    query(collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}`), 
    where('clientId', '==', clientId))
  );

  for (const projectDoc of projectsSnapshot.docs) {
    // Delete all tasks for this project
    const tasksSnapshot = await getDocs(
      collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${projectDoc.id}/${COLLECTIONS.TASKS}`)
    );
    
    tasksSnapshot.docs.forEach(taskDoc => {
      const taskRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${projectDoc.id}/${COLLECTIONS.TASKS}/${taskDoc.id}`);
      batch.delete(taskRef);
    });

    // Delete the project
    const projectRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${projectDoc.id}`);
    batch.delete(projectRef);

    // Delete all time entries for this project
    const entriesSnapshot = await getDocs(
      query(collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}`),
      where('projectId', '==', projectDoc.id))
    );

    entriesSnapshot.docs.forEach(entryDoc => {
      const entryRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}/${entryDoc.id}`);
      batch.delete(entryRef);
    });
  }

  await batch.commit();
};

export const deleteProject = async (userId: string, projectId: string) => {
  const batch = writeBatch(db);

  // Delete project document
  const projectRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${projectId}`);
  batch.delete(projectRef);

  // Delete all tasks for this project
  const tasksSnapshot = await getDocs(
    collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${projectId}/${COLLECTIONS.TASKS}`)
  );
  
  tasksSnapshot.docs.forEach(taskDoc => {
    const taskRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${projectId}/${COLLECTIONS.TASKS}/${taskDoc.id}`);
    batch.delete(taskRef);
  });

  // Delete all time entries for this project
  const entriesSnapshot = await getDocs(
    query(collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}`),
    where('projectId', '==', projectId))
  );

  entriesSnapshot.docs.forEach(entryDoc => {
    const entryRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}/${entryDoc.id}`);
    batch.delete(entryRef);
  });

  await batch.commit();
};

export const deleteTask = async (userId: string, projectId: string, taskId: string) => {
  const batch = writeBatch(db);

  // Delete task document
  const taskRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PROJECTS}/${projectId}/${COLLECTIONS.TASKS}/${taskId}`);
  batch.delete(taskRef);

  // Delete all time entries for this task
  const entriesSnapshot = await getDocs(
    query(collection(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}`),
    where('taskId', '==', taskId))
  );

  entriesSnapshot.docs.forEach(entryDoc => {
    const entryRef = doc(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.TIME_ENTRIES}/${entryDoc.id}`);
    batch.delete(entryRef);
  });

  await batch.commit();
};