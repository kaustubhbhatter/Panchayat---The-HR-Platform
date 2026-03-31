import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';

export type Role = 'Admin' | 'HR' | 'Team Lead' | 'Employee';

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
}

export interface DocumentItem {
  id: string;
  title: string;
  url: string;
  description: string;
  addedBy: string;
}

interface AppContextType {
  users: User[];
  teams: Team[];
  leaves: LeaveRequest[];
  holidays: Holiday[];
  settings: AppSettings;
  documents: DocumentItem[];
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
  const [settings, setSettings] = useState<AppSettings>({ defaultLeaveQuota: 20 });
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
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

    setIsLoading(false);

    return () => {
      unsubUsers();
      unsubTeams();
      unsubLeaves();
      unsubHolidays();
      unsubSettings();
      unsubDocuments();
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

  return (
    <AppContext.Provider value={{ 
      users, teams, leaves, holidays, settings, documents,
      addUser, updateUser, addTeam, updateTeam, 
      addLeave, updateLeave, addHoliday, deleteHoliday, 
      updateSettings, addDocument, deleteDocument,
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
