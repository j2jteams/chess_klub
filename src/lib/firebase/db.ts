import { 
  collection, 
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  QueryConstraint,
  addDoc,
  DocumentReference,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { CollectionName } from './collections';

/**
 * Generic type for Firestore data
 */
export type FirestoreData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Options for fetch operations
 */
export interface FetchOptions {
  limit?: number;
  startAfter?: QueryDocumentSnapshot<DocumentData>;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
}

function removeUndefined(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = removeUndefined(value);
      }
      return acc;
    }, {} as Record<string, unknown>);
  }
  return obj;
}

export async function createDocument<T extends { id: string }>(
  collectionName: CollectionName | string,
  data: FirestoreData<T>
): Promise<T> {
  console.log('🔥 createDocument called');
  console.log('📂 Collection name:', collectionName);
  console.log('📋 Raw data:', data);
  
  if (!db) {
    console.error('❌ Firebase not initialized');
    throw new Error('Firebase not initialized');
  }
  
  const collectionRef = collection(db, collectionName);
  console.log('📁 Collection ref created:', collectionRef.path);

  // Clean undefined values and add timestamps
  const cleanedData = removeUndefined(data) as Record<string, unknown>;
  console.log('🧹 Cleaned data:', cleanedData);
  
  const dataWithTimestamps = {
    ...cleanedData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  console.log('⏰ Data with timestamps prepared');

  try {
    console.log('💾 Adding document to Firestore...');
    const docRef = await addDoc(collectionRef, dataWithTimestamps);
    console.log('✅ Document added with ID:', docRef.id);

    // Update the document with its ID
    console.log('🔄 Updating document with ID...');
    await updateDoc(docRef, { id: docRef.id });
    console.log('✅ Document updated with ID');

    const result = {
      id: docRef.id,
      ...cleanedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as unknown as T;
    
    console.log('📤 Returning result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error in createDocument:', error);
    throw error;
  }
}


/**
 * Create a new document with a specific ID
 */
export async function createDocumentWithId<T extends { id: string }>(
  collectionName: CollectionName | string,
  id: string,
  data: FirestoreData<T>
): Promise<T> {
  if (!db) throw new Error('Firebase not initialized');
  
  const docRef = doc(db, collectionName, id);
  
  // Remove undefined values (Firestore doesn't allow undefined)
  const cleanedData = removeUndefined(data) as Record<string, unknown>;
  
  // Add timestamps
  const dataWithTimestamps = {
    ...cleanedData,
    id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  await setDoc(docRef, dataWithTimestamps);
  
  return {
    id,
    ...cleanedData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as unknown as T;
}

/**
 * Get a document by ID
 */
export async function getDocument<T extends { id: string }>(
  collectionName: CollectionName | string,
  id: string
): Promise<T | null> {
  if (!db) throw new Error('Firebase not initialized');
  
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return { ...docSnap.data(), id: docSnap.id } as T;
}

/**
 * Update a document by ID
 */
export async function updateDocument<T extends { id: string }>(
  collectionName: CollectionName | string,
  id: string,
  data: Partial<FirestoreData<T>>
): Promise<void> {
  if (!db) throw new Error('Firebase not initialized');
  
  const docRef = doc(db, collectionName, id);
  
  // Add updated timestamp
  const dataWithTimestamp = {
    ...data,
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(docRef, dataWithTimestamp);
}

/**
 * Delete a document by ID
 */
export async function deleteDocument(
  collectionName: CollectionName | string,
  id: string
): Promise<void> {
  if (!db) throw new Error('Firebase not initialized');
  
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
}

/**
 * Query documents with filters
 */
export async function queryDocuments<T extends { id: string }>(
  collectionName: CollectionName | string,
  constraints: QueryConstraint[] = [],
  options: FetchOptions = {}
): Promise<{
  documents: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
}> {
  if (!db) throw new Error('Firebase not initialized');
  
  const collectionRef = collection(db, collectionName);
  
  // Build query with constraints and options
  const queryConstraints = [...constraints];
  
  // Add ordering if specified
  if (options.orderByField) {
    queryConstraints.push(
      orderBy(
        options.orderByField, 
        options.orderDirection || 'asc'
      )
    );
  }
  
  // Add pagination if specified
  if (options.startAfter) {
    queryConstraints.push(startAfter(options.startAfter));
  }
  
  // Add limit if specified
  if (options.limit) {
    queryConstraints.push(limit(options.limit));
  }
  
  try {
    const q = query(collectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    const documents: T[] = [];
    let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
    
    querySnapshot.forEach((doc) => {
      documents.push({ ...doc.data(), id: doc.id } as T);
      lastDoc = doc;
    });
    
    return { documents, lastDoc };
  } catch (error: any) {
    // Enhanced error logging for Firestore permission errors
    console.error('Firestore query error:', {
      collection: collectionName,
      constraints: queryConstraints.length,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorStack: error?.stack
    });
    throw error;
  }
}

/**
 * Converts a timestamp to an ISO string date
 */
export function convertTimestampToDate(timestamp: Timestamp): string {
  return timestamp.toDate().toISOString();
}

/**
 * Helper to format Firestore date fields
 */
export function formatDates<T extends Record<string, unknown>>(data: T): T {
  const formatted = { ...data } as Record<string, unknown>;
  
  for (const [key, value] of Object.entries(formatted)) {
    if (value instanceof Timestamp) {
      formatted[key] = convertTimestampToDate(value);
    } else if (typeof value === 'object' && value !== null) {
      formatted[key] = formatDates(value as Record<string, unknown>);
    }
  }
  
  return formatted as T;
}

/**
 * Generic document reference getter
 */
export function getDocRef<T extends CollectionName>(
  collectionName: T | string,
  id: string
): DocumentReference<any> {
  if (!db) throw new Error('Firebase not initialized');
  
  return doc(db, collectionName, id);
}

/**
 * Generic collection reference getter
 */
export function getCollectionRef<T extends CollectionName>(
  collectionName: T | string
) {
  if (!db) throw new Error('Firebase not initialized');
  
  return collection(db, collectionName);
}