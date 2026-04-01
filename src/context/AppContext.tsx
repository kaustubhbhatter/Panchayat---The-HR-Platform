import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';

export type Role = 'Admin' | 'Team Leader' | 'IC';

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

interface AppContextType {
  users: User[];
  teams: Team[];
  leaves: LeaveRequest[];
  holidays: Holiday[];
  settings: AppSettings;
  documents: DocumentItem[];
  reviewCycles: ReviewCycle[];
  reviewSubmissions: ReviewSubmission[];
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUsers([]);
      setTeams([]);
      setLeaves([]);
      setHolidays([]);
      setDocuments([]);
      return;
    }

    setIsLoading(true);

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    }, (error) => console.error("Error fetching users:", error));

    const unsubTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
      setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
    }, (error) => console.error("Error fetching teams:", error));

    const unsubLeaves = onSnapshot(collection(db, 'leaves'), (snapshot) => {
      setLeaves(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest)));
    }, (error) => console.error("Error fetching leaves:", error));

    const unsubHolidays = onSnapshot(collection(db, 'holidays'), (snapshot) => {
      setHolidays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Holiday)));
    }, (error) => console.error("Error fetching holidays:", error));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as AppSettings);
      }
    }, (error) => console.error("Error fetching settings:", error));

    const unsubDocuments = onSnapshot(collection(db, 'documents'), (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentItem)));
    }, (error) => console.error("Error fetching documents:", error));

    const unsubReviewCycles = onSnapshot(collection(db, 'reviewCycles'), (snapshot) => {
      setReviewCycles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReviewCycle)));
    }, (error) => console.error("Error fetching review cycles:", error));

    const unsubReviewSubmissions = onSnapshot(collection(db, 'reviewSubmissions'), (snapshot) => {
      setReviewSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReviewSubmission)));
    }, (error) => console.error("Error fetching review submissions:", error));

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

  return (
    <AppContext.Provider value={{ 
      users, teams, leaves, holidays, settings, documents, reviewCycles, reviewSubmissions,
      addUser, updateUser, addTeam, updateTeam, 
      addLeave, updateLeave, addHoliday, deleteHoliday, 
      updateSettings, addDocument, deleteDocument,
      addReviewCycle, updateReviewCycle, addReviewSubmission,
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
