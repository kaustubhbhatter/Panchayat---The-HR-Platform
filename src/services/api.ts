import { User, Team, Role, LeaveRequest, Holiday, AppSettings, DocumentItem, ReviewCycle, ReviewSubmission, AdminNote, GuptGupshupPost } from '../context/AppContext';
import { db, auth, firebaseConfig, storage } from '../firebase';
import { initializeApp } from 'firebase/app';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  getAuth
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Initialize a secondary app to create users without logging out the current admin
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

// Helper to handle Firestore errors
export const handleFirestoreError = (error: any, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  
  if (errInfo.error.includes('insufficient permissions')) {
    console.error('Firestore Permission Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }
  
  console.error(`Firestore Error (${operationType} on ${path}):`, error);
  throw new Error(error.message || 'An error occurred with the database.');
};

export const api = {
  login: async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      return { id: userDoc.id, ...userDoc.data() } as User;
    } catch (error: any) {
      throw new Error(error.message || 'Invalid email or password');
    }
  },

  resetPassword: async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send reset email');
    }
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, 'users');
    }
  },

  getTeams: async (): Promise<Team[]> => {
    try {
      const snapshot = await getDocs(collection(db, 'teams'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, 'teams');
    }
  },

  addUser: async (userData: Omit<User, 'id'> & { password?: string }): Promise<User> => {
    try {
      const { password, ...userProfile } = userData;
      
      let uid: string;
      if (password) {
        // Create user in Firebase Auth using the secondary app
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userProfile.email, password);
        uid = userCredential.user.uid;
        // Sign out the secondary app to clear its session
        await secondaryAuth.signOut();
      } else {
        // If no password is provided, we can't create an auth user easily without a backend.
        // For now, we'll throw an error because Firebase Auth requires a password.
        throw new Error("Password is required to create a new user.");
      }
      
      // Create document with the Auth UID
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, userProfile);
      
      return { id: uid, ...userProfile } as User;
    } catch (error) {
      return handleFirestoreError(error, OperationType.CREATE, 'users');
    }
  },

  updateUser: async (id: string, updates: Partial<User> & { password?: string }): Promise<User> => {
    try {
      const { password, ...profileUpdates } = updates;
      const userRef = doc(db, 'users', id);
      
      await updateDoc(userRef, profileUpdates);
      
      const updatedDoc = await getDoc(userRef);
      return { id: updatedDoc.id, ...updatedDoc.data() } as User;
    } catch (error) {
      return handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  },

  addTeam: async (team: Omit<Team, 'id'>): Promise<Team> => {
    try {
      const docRef = await addDoc(collection(db, 'teams'), team);
      return { id: docRef.id, ...team } as Team;
    } catch (error) {
      return handleFirestoreError(error, OperationType.CREATE, 'teams');
    }
  },

  updateTeam: async (id: string, updates: Partial<Team>): Promise<Team> => {
    try {
      const teamRef = doc(db, 'teams', id);
      await updateDoc(teamRef, updates);
      
      const updatedDoc = await getDoc(teamRef);
      return { id: updatedDoc.id, ...updatedDoc.data() } as Team;
    } catch (error) {
      return handleFirestoreError(error, OperationType.UPDATE, `teams/${id}`);
    }
  },

  getLeaves: async (): Promise<LeaveRequest[]> => {
    try {
      const snapshot = await getDocs(collection(db, 'leaves'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest));
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, 'leaves');
    }
  },

  addLeave: async (leave: Omit<LeaveRequest, 'id'>): Promise<LeaveRequest> => {
    try {
      const docRef = await addDoc(collection(db, 'leaves'), leave);
      return { id: docRef.id, ...leave } as LeaveRequest;
    } catch (error) {
      return handleFirestoreError(error, OperationType.CREATE, 'leaves');
    }
  },

  updateLeave: async (id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    try {
      const leaveRef = doc(db, 'leaves', id);
      await updateDoc(leaveRef, updates);
      
      const updatedDoc = await getDoc(leaveRef);
      return { id: updatedDoc.id, ...updatedDoc.data() } as LeaveRequest;
    } catch (error) {
      return handleFirestoreError(error, OperationType.UPDATE, `leaves/${id}`);
    }
  },

  getHolidays: async (): Promise<Holiday[]> => {
    try {
      const snapshot = await getDocs(collection(db, 'holidays'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Holiday));
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, 'holidays');
    }
  },

  addHoliday: async (holiday: Omit<Holiday, 'id'>): Promise<Holiday> => {
    try {
      const docRef = await addDoc(collection(db, 'holidays'), holiday);
      return { id: docRef.id, ...holiday } as Holiday;
    } catch (error) {
      return handleFirestoreError(error, OperationType.CREATE, 'holidays');
    }
  },

  deleteHoliday: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'holidays', id));
    } catch (error) {
      return handleFirestoreError(error, OperationType.DELETE, `holidays/${id}`);
    }
  },

  getSettings: async (): Promise<AppSettings> => {
    try {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
      }
      
      // Default settings if none exist
      const defaultSettings = { defaultLeaveQuota: 20 };
      await setDoc(docRef, defaultSettings);
      return defaultSettings;
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, 'settings/global');
    }
  },

  updateSettings: async (settings: AppSettings): Promise<AppSettings> => {
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      return settings;
    } catch (error) {
      return handleFirestoreError(error, OperationType.WRITE, 'settings/global');
    }
  },

  getDocuments: async (): Promise<DocumentItem[]> => {
    try {
      const snapshot = await getDocs(collection(db, 'documents'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentItem));
    } catch (error) {
      return handleFirestoreError(error, OperationType.LIST, 'documents');
    }
  },

  addDocument: async (document: Omit<DocumentItem, 'id'>): Promise<DocumentItem> => {
    try {
      const docRef = await addDoc(collection(db, 'documents'), document);
      return { id: docRef.id, ...document } as DocumentItem;
    } catch (error) {
      return handleFirestoreError(error, OperationType.CREATE, 'documents');
    }
  },

  deleteDocument: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'documents', id));
    } catch (error) {
      return handleFirestoreError(error, OperationType.DELETE, `documents/${id}`);
    }
  },

  addReviewCycle: async (cycle: Omit<ReviewCycle, 'id'>): Promise<ReviewCycle> => {
    try {
      const docRef = await addDoc(collection(db, 'reviewCycles'), cycle);
      return { id: docRef.id, ...cycle } as ReviewCycle;
    } catch (error) {
      return handleFirestoreError(error, OperationType.CREATE, 'reviewCycles');
    }
  },

  updateReviewCycle: async (id: string, updates: Partial<ReviewCycle>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'reviewCycles', id), updates);
    } catch (error) {
      return handleFirestoreError(error, OperationType.UPDATE, `reviewCycles/${id}`);
    }
  },

  addReviewSubmission: async (submission: Omit<ReviewSubmission, 'id'>): Promise<ReviewSubmission> => {
    try {
      const docRef = await addDoc(collection(db, 'reviewSubmissions'), submission);
      return { id: docRef.id, ...submission } as ReviewSubmission;
    } catch (error) {
      return handleFirestoreError(error, OperationType.CREATE, 'reviewSubmissions');
    }
  },

  addAdminNote: async (note: Omit<AdminNote, 'id'>): Promise<AdminNote> => {
    try {
      const docRef = await addDoc(collection(db, 'adminNotes'), note);
      return { id: docRef.id, ...note } as AdminNote;
    } catch (error) {
      return handleFirestoreError(error, OperationType.CREATE, 'adminNotes');
    }
  },

  deleteAdminNote: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'adminNotes', id));
    } catch (error) {
      return handleFirestoreError(error, OperationType.DELETE, `adminNotes/${id}`);
    }
  },

  addGuptGupshupPost: async (post: Omit<GuptGupshupPost, 'id'>): Promise<GuptGupshupPost> => {
    try {
      const docRef = await addDoc(collection(db, 'guptGupshupPosts'), post);
      return { id: docRef.id, ...post } as GuptGupshupPost;
    } catch (error) {
      return handleFirestoreError(error, OperationType.CREATE, 'guptGupshupPosts');
    }
  },

  updateGuptGupshupPost: async (id: string, updates: Partial<GuptGupshupPost>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'guptGupshupPosts', id), updates);
    } catch (error) {
      return handleFirestoreError(error, OperationType.UPDATE, `guptGupshupPosts/${id}`);
    }
  },

  uploadFile: async (file: File, path: string): Promise<string> => {
    try {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error: any) {
      console.error('Storage Error:', error);
      throw new Error(error.message || 'Failed to upload file');
    }
  }
};
