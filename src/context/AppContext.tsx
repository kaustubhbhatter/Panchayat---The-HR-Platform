import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export type Role = 'Admin' | 'HR' | 'Team Lead' | 'Employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  teamIds: string[];
  managerId?: string;
  avatar: string;
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
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [u, t, l, h, s, d] = await Promise.all([
        api.getUsers(), api.getTeams(), api.getLeaves(), api.getHolidays(), api.getSettings(), api.getDocuments()
      ]);
      setUsers(u); setTeams(t); setLeaves(l); setHolidays(h); setSettings(s); setDocuments(d);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addUser = async (u: Omit<User, 'id'> & { password?: string }) => {
    const res = await api.addUser(u);
    setUsers([...users, res]);
  };
  const updateUser = async (id: string, updates: Partial<User> & { password?: string }) => {
    const res = await api.updateUser(id, updates);
    setUsers(users.map(u => u.id === id ? res : u));
  };
  const addTeam = async (t: Omit<Team, 'id'>) => {
    const res = await api.addTeam(t);
    setTeams([...teams, res]);
  };
  const updateTeam = async (id: string, updates: Partial<Team>) => {
    const res = await api.updateTeam(id, updates);
    setTeams(teams.map(t => t.id === id ? res : t));
  };
  const addLeave = async (l: Omit<LeaveRequest, 'id'>) => {
    const res = await api.addLeave(l);
    setLeaves([...leaves, res]);
  };
  const updateLeave = async (id: string, updates: Partial<LeaveRequest>) => {
    const res = await api.updateLeave(id, updates);
    setLeaves(leaves.map(l => l.id === id ? res : l));
  };
  const addHoliday = async (h: Omit<Holiday, 'id'>) => {
    const res = await api.addHoliday(h);
    setHolidays([...holidays, res]);
  };
  const deleteHoliday = async (id: string) => {
    await api.deleteHoliday(id);
    setHolidays(holidays.filter(h => h.id !== id));
  };
  const updateSettings = async (s: AppSettings) => {
    const res = await api.updateSettings(s);
    setSettings(res);
  };
  const addDocument = async (d: Omit<DocumentItem, 'id'>) => {
    const res = await api.addDocument(d);
    setDocuments([...documents, res]);
  };
  const deleteDocument = async (id: string) => {
    await api.deleteDocument(id);
    setDocuments(documents.filter(d => d.id !== id));
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
