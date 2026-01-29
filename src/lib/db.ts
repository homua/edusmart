
import { doc, deleteDoc, writeBatch, type Firestore } from 'firebase/firestore';

const COLLECTIONS = {
  USERS: 'users',
  CLASSES: 'classes',
  ASSIGNMENTS: 'assignments',
};

    