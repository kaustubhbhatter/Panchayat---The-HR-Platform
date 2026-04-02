import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, handleFirestoreError, OperationType } from '../services/api';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';

export type Role = 'Admin' | 'Team Leader' | 'IC' | 'Sarpanch' | 'Karyakarta';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  teamIds: string[];
  managerId?: string;
  avatar: string;
  status: 'Active' | 'Inactive';
  joiningDate?: string;
  internshipDate?: string;
  conversionDate?: string;
  designation?: string;
  wfhEnabled?: boolean;
  creditedLeaves?: number;
  isIntern?: boolean;
  birthday?: string;
  anniversary?: string;
}

export interface AdminNote {
  id: string;
  content: string;
  expiryDate: string;
  createdAt: string;
  createdBy: string;
}

export interface Team {
  id: string;
  name: string;
  managerIds: string[];
  description: string;
  coverImage: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
  duration?: 'full' | 'first_half' | 'second_half';
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

export interface AppSettings {
  defaultLeaveQuota: number;
  defaultWfhQuota?: number;
  companyName?: string;
  workDaysPerWeek?: number;
  guptGupshupEnabled?: boolean;
  showUpvotersToAdmin?: boolean;
}

export interface DocumentItem {
  id: string;
  title: string;
  url: string;
  description: string;
  addedBy: string;
}

export interface ReviewCycle {
  id: string;
  title: string;
  type: 'Manager-to-Junior' | 'Peer-to-Peer' | 'Organization';
  targetTeamIds?: string[];
  questions: string[];
  deadline: string;
  status: 'Active' | 'Closed';
  createdBy: string;
  createdAt: string;
}

export interface ReviewSubmission {
  id: string;
  cycleId: string;
  reviewerId: string;
  revieweeId: string | null;
  answers: Record<string, string>;
  submittedAt: string;
}

export interface GuptGupshupPost {
  id: string;
  content: string;
  authorId: string;
  isAnonymous: boolean;
  upvotes: string[]; // array of userIds
  createdAt: string;
  dismissedBy: string[]; // array of userIds who dismissed it
}

interface AppContextType {
  users: User[];
  teams: Team[];
  leaves: LeaveRequest[];
  holidays: Holiday[];
  settings: AppSettings;
  documents: DocumentItem[];
  reviewCycles: ReviewCycle[];
  reviewSubmissions: ReviewSubmission[];
  adminNotes: AdminNote[];
  guptGupshupPosts: GuptGupshupPost[];
  addUser: (user: Omit<User, 'id'> & { password?: string }) => Promise<void>;
  updateUser: (id: string, user: Partial<User> & { password?: string }) => Promise<void>;
  addTeam: (team: Omit<Team, 'id'>) => Promise<void>;
  updateTeam: (id: string, team: Partial<Team>) => Promise<void>;
  addLeave: (leave: Omit<LeaveRequest, 'id'>) => Promise<void>;
  updateLeave: (id: string, leave: Partial<LeaveRequest>) => Promise<void>;
  addHoliday: (holiday: Omit<Holiday, 'id'>) => Promise<void>;
  deleteHoliday: (id: string) => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
  addDocument: (doc: Omit<DocumentItem, 'id'>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  addReviewCycle: (cycle: Omit<ReviewCycle, 'id'>) => Promise<void>;
  updateReviewCycle: (id: string, updates: Partial<ReviewCycle>) => Promise<void>;
  addReviewSubmission: (submission: Omit<ReviewSubmission, 'id'>) => Promise<void>;
  addAdminNote: (note: Omit<AdminNote, 'id'>) => Promise<void>;
  deleteAdminNote: (id: string) => Promise<void>;
  addGuptGupshupPost: (post: Omit<GuptGupshupPost, 'id'>) => Promise<void>;
  updateGuptGupshupPost: (id: string, updates: Partial<GuptGupshupPost>) => Promise<void>;
  uploadFile: (file: File, path: string) => Promise<string>;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ defaultLeaveQuota: 20, defaultWfhQuota: 10 });
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [reviewCycles, setReviewCycles] = useState<ReviewCycle[]>([]);
  const [reviewSubmissions, setReviewSubmissions] = useState<ReviewSubmission[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [guptGupshupPosts, setGuptGupshupPosts] = useState<GuptGupshupPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUsers([]);
      setTeams([]);
      setLeaves([]);
      setHolidays([]);
      setDocuments([]);
      setAdminNotes([]);
      return;
    }

    setIsLoading(true);

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));

    const unsubTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
      setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'teams'));

    const unsubLeaves = onSnapshot(collection(db, 'leaves'), (snapshot) => {
      setLeaves(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'leaves'));

    const unsubHolidays = onSnapshot(collection(db, 'holidays'), (snapshot) => {
      setHolidays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Holiday)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'holidays'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as AppSettings);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/global'));

    const unsubDocuments = onSnapshot(collection(db, 'documents'), (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentItem)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'documents'));

    const unsubReviewCycles = onSnapshot(collection(db, 'reviewCycles'), (snapshot) => {
      setReviewCycles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReviewCycle)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'reviewCycles'));

    const unsubReviewSubmissions = onSnapshot(collection(db, 'reviewSubmissions'), (snapshot) => {
      setReviewSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReviewSubmission)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'reviewSubmissions'));

    const unsubAdminNotes = onSnapshot(collection(db, 'adminNotes'), (snapshot) => {
      setAdminNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminNote)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'adminNotes'));

    const unsubGuptGupshupPosts = onSnapshot(collection(db, 'guptGupshupPosts'), (snapshot) => {
      setGuptGupshupPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuptGupshupPost)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'guptGupshupPosts'));

    setIsLoading(false);

    return () => {
      unsubUsers();
      unsubTeams();
      unsubLeaves();
      unsubHolidays();
      unsubSettings();
      unsubDocuments();
      unsubReviewCycles();
      unsubReviewSubmissions();
      unsubAdminNotes();
      unsubGuptGupshupPosts();
    };
  }, [user]);

  const loadData = async () => {
    // With onSnapshot, we don't need to manually fetch data anymore
    // This function is kept for compatibility if needed, but it's mostly a no-op now
    console.log("Data is synced automatically via Firestore listeners.");
  };

  const addUser = async (u: Omit<User, 'id'> & { password?: string }) => {
    await api.addUser(u);
  };
  const updateUser = async (id: string, updates: Partial<User> & { password?: string }) => {
    await api.updateUser(id, updates);
  };
  const addTeam = async (t: Omit<Team, 'id'>) => {
    await api.addTeam(t);
  };
  const updateTeam = async (id: string, updates: Partial<Team>) => {
    await api.updateTeam(id, updates);
  };
  const addLeave = async (l: Omit<LeaveRequest, 'id'>) => {
    await api.addLeave(l);
  };
  const updateLeave = async (id: string, updates: Partial<LeaveRequest>) => {
    await api.updateLeave(id, updates);
  };
  const addHoliday = async (h: Omit<Holiday, 'id'>) => {
    await api.addHoliday(h);
  };
  const deleteHoliday = async (id: string) => {
    await api.deleteHoliday(id);
  };
  const updateSettings = async (s: AppSettings) => {
    await api.updateSettings(s);
  };
  const addDocument = async (d: Omit<DocumentItem, 'id'>) => {
    await api.addDocument(d);
  };
  const deleteDocument = async (id: string) => {
    await api.deleteDocument(id);
  };
  const addReviewCycle = async (c: Omit<ReviewCycle, 'id'>) => {
    await api.addReviewCycle(c);
  };
  const updateReviewCycle = async (id: string, updates: Partial<ReviewCycle>) => {
    await api.updateReviewCycle(id, updates);
  };
  const addReviewSubmission = async (s: Omit<ReviewSubmission, 'id'>) => {
    await api.addReviewSubmission(s);
  };
  const addAdminNote = async (n: Omit<AdminNote, 'id'>) => {
    await api.addAdminNote(n);
  };
  const deleteAdminNote = async (id: string) => {
    await api.deleteAdminNote(id);
  };
  const addGuptGupshupPost = async (post: Omit<GuptGupshupPost, 'id'>) => {
    await api.addGuptGupshupPost(post);
  };
  const updateGuptGupshupPost = async (id: string, updates: Partial<GuptGupshupPost>) => {
    await api.updateGuptGupshupPost(id, updates);
  };
  const uploadFile = async (file: File, path: string) => {
    return await api.uploadFile(file, path);
  };

  return (
    <AppContext.Provider value={{ 
      users, teams, leaves, holidays, settings, documents, reviewCycles, reviewSubmissions, adminNotes, guptGupshupPosts,
      addUser, updateUser, addTeam, updateTeam, 
      addLeave, updateLeave, addHoliday, deleteHoliday, 
      updateSettings, addDocument, deleteDocument,
      addReviewCycle, updateReviewCycle, addReviewSubmission,
      addAdminNote, deleteAdminNote, addGuptGupshupPost, updateGuptGupshupPost, uploadFile,
      isLoading, refreshData: loadData 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
