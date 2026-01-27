import { doc, deleteDoc, type Firestore } from 'firebase/firestore';

const COLLECTIONS = {
  USERS: 'users',
  CLASSES: 'classes',
  ASSIGNMENTS: 'assignments',
};

export const deleteUser = async (db: Firestore, userId: string): Promise<void> => {
  if (!userId) throw new Error('User ID is required.');
  const docRef = doc(db, COLLECTIONS.USERS, userId);
  await deleteDoc(docRef);
};

export const deleteUsers = async (db: Firestore, userIds: string[]): Promise<void> => {
    if (!userIds || userIds.length === 0) return;
    const deletePromises = userIds.map(id => {
        const docRef = doc(db, COLLECTIONS.USERS, id);
        return deleteDoc(docRef);
    });
    await Promise.all(deletePromises);
};

export const deleteClass = async (db: Firestore, classId: string): Promise<void> => {
    if (!classId) throw new Error('Class ID is required.');
    const docRef = doc(db, COLLECTIONS.CLASSES, classId);
    await deleteDoc(docRef);
};

export const deleteAssignment = async (db: Firestore, assignmentId: string): Promise<void> => {
    if (!assignmentId) throw new Error('Assignment ID is required.');
    const docRef = doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId);
    await deleteDoc(docRef);
};
