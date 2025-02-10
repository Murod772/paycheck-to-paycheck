import { 
  getFirestore, 
  collection, 
  doc,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentData,
  QueryConstraint,
  Timestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();

interface BaseDocument extends DocumentData {
  id: string;
}

export class DatabaseService {
  /**
   * Create a new document in a collection
   */
  static async create<T extends BaseDocument>(
    collectionName: string,
    data: Omit<T, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        throw new Error('User must be authenticated to perform this action');
      }

      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, {
        ...data,
        userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * Get a document by ID
   */
  static async getById<T extends BaseDocument>(
    collectionName: string,
    docId: string
  ): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  /**
   * Get documents with optional query constraints
   */
  static async query<T extends BaseDocument>(
    collectionName: string,
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        throw new Error('User must be authenticated to perform this action');
      }

      // Always add userId constraint for security
      const userConstraint = where('userId', '==', userId);
      const q = query(
        collection(db, collectionName),
        userConstraint,
        ...constraints
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<T, 'id'>),
      }) as T);
    } catch (error) {
      console.error('Error querying documents:', error);
      throw error;
    }
  }

  /**
   * Get all documents in a collection
   */
  static async getAll<T extends BaseDocument>(
    collectionName: string
  ): Promise<T[]> {
    try {
      const collectionRef = collection(db, collectionName);
      const querySnapshot = await getDocs(collectionRef);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<T, 'id'>),
      }) as T);
    } catch (error) {
      console.error('Error getting all documents:', error);
      throw error;
    }
  }

  /**
   * Update a document
   */
  static async update<T extends BaseDocument>(
    collectionName: string,
    docId: string,
    data: Partial<Omit<T, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ) {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        throw new Error('User must be authenticated to perform this action');
      }

      // Verify document belongs to user before updating
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }
      
      if (docSnap.data().userId !== userId) {
        throw new Error('Not authorized to update this document');
      }

      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });

      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  static async delete(
    collectionName: string,
    docId: string
  ) {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        throw new Error('User must be authenticated to perform this action');
      }

      // Verify document belongs to user before deleting
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }
      
      if (docSnap.data().userId !== userId) {
        throw new Error('Not authorized to delete this document');
      }

      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
}
