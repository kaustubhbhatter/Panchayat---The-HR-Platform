import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, handleFirestoreError, OperationType } from '../services/api';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';

export type Role = 'Admin' | 'Team Leader' | 'IC' | 'Sarpanch' | 'Karyakarta' | 'HR' | 'Team Lead';

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
  wfhQuota?: number;
  creditedLeaves?: number;
  isIntern?: boolean;
  birthday?: string;
  anniversary?: string;
  journey?: {
    id: string;
    date: string;
    type: 'Joining' | 'Promoted' | 'Internship' | 'Conversion' | 'Other';
    description: string;
    oldDesignation?: string;
    newDesignation?: string;
  }[];
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
  userName?: string;
  managerId?: string | null;
  startDate: string;
  endDate: string;
  type: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
  duration?: 'full' | 'first_half' | 'second_half';
  isHalfDay?: boolean;
  createdAt?: string;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  type: 'Public' | 'Optional';
}

export interface AppSettings {
  defaultLeaveQuota: number;
  defaultWfhQuota?: number;
  companyName?: string;
  workDaysPerWeek?: number;
  guptGupshupEnabled?: boolean;
  showUpvotersToAdmin?: boolean;
  showAnonymousNamesToAdmin?: boolean;
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

export interface Goal {
  id: string;
  title: string;
  description: string;
  quarter: string; // e.g., "2026-Q1"
  createdAt: string;
  createdBy: string;
}

export interface KeyResult {
  id: string;
  goalId: string;
  title: string;
  ownerId: string;
  targetValue: number;
  currentValue: number;
  status: 'On Track' | 'Behind' | 'At Risk';
  unit: string;
  createdAt: string;
  createdBy: string;
}

export interface KRCheckIn {
  id: string;
  krId: string;
  value: number;
  status: 'On Track' | 'Behind' | 'At Risk';
  comment: string;
  createdAt: string;
  createdBy: string;
}

export interface Initiative {
  id: string;
  krId: string;
  title: string;
  ownerId: string;
  status: 'Not Picked' | 'In Progress' | 'Completed' | 'Dropped';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  createdAt: string;
  createdBy: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
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
  goals: Goal[];
  keyResults: KeyResult[];
  krCheckIns: KRCheckIn[];
  initiatives: Initiative[];
  notifications: Notification[];
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addTeam: (team: Omit<Team, 'id'>) => Promise<void>;
  updateTeam: (id: string, team: Partial<Team>) => Promise<void>;
  addLeave: (leave: Omit<LeaveRequest, 'id'>) => Promise<void>;
  updateLeave: (id: string, leave: Partial<LeaveRequest>) => Promise<void>;
  deleteLeave: (id: string) => Promise<void>;
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
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addKeyResult: (kr: Omit<KeyResult, 'id'>) => Promise<void>;
  updateKeyResult: (id: string, updates: Partial<KeyResult>) => Promise<void>;
  deleteKeyResult: (id: string) => Promise<void>;
  addKRCheckIn: (checkIn: Omit<KRCheckIn, 'id'>) => Promise<void>;
  addInitiative: (initiative: Omit<Initiative, 'id'>) => Promise<void>;
  updateInitiative: (id: string, updates: Partial<Initiative>) => Promise<void>;
  deleteInitiative: (id: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [krCheckIns, setKrCheckIns] = useState<KRCheckIn[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

    const unsubGoals = onSnapshot(collection(db, 'goals'), (snapshot) => {
      setGoals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'goals'));

    const unsubKeyResults = onSnapshot(collection(db, 'keyResults'), (snapshot) => {
      setKeyResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KeyResult)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'keyResults'));

    const unsubKRCheckIns = onSnapshot(collection(db, 'krCheckIns'), (snapshot) => {
      setKrCheckIns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KRCheckIn)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'krCheckIns'));

    const unsubInitiatives = onSnapshot(collection(db, 'initiatives'), (snapshot) => {
      setInitiatives(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Initiative)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'initiatives'));

    const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'notifications'));

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
      unsubGoals();
      unsubKeyResults();
      unsubKRCheckIns();
      unsubInitiatives();
      unsubNotifications();
    };
  }, [user]);

  const loadData = async () => {
    // With onSnapshot, we don't need to manually fetch data anymore
    // This function is kept for compatibility if needed, but it's mostly a no-op now
    console.log("Data is synced automatically via Firestore listeners.");
  };

  const addUser = async (u: Omit<User, 'id'>) => {
    await api.addUser(u);
  };
  const updateUser = async (id: string, updates: Partial<User>) => {
    await api.updateUser(id, updates);
  };
  const deleteUser = async (id: string) => {
    await api.deleteUser(id);
  };
  const addTeam = async (t: Omit<Team, 'id'>) => {
    await api.addTeam(t);
  };
  const updateTeam = async (id: string, updates: Partial<Team>) => {
    await api.updateTeam(id, updates);
  };
  const addLeave = async (l: Omit<LeaveRequest, 'id'>) => {
    await api.addLeave(l);
    // Notify managers/admins
    const managers = users.filter(u => u.role === 'Admin' || u.role === 'Sarpanch' || u.id === user?.managerId);
    for (const manager of managers) {
      if (manager.id !== user?.id) {
        await addNotification({
          userId: manager.id,
          title: 'Leave Requested',
          message: `${user?.name} has requested leave from ${l.startDate} to ${l.endDate}`,
          type: 'info',
          link: '/attendance'
        });
      }
    }
  };
  const updateLeave = async (id: string, updates: Partial<LeaveRequest>) => {
    const oldLeave = leaves.find(l => l.id === id);
    await api.updateLeave(id, updates);
    if (updates.status && updates.status !== oldLeave?.status && oldLeave?.userId !== user?.id) {
      await addNotification({
        userId: oldLeave!.userId,
        title: `Leave ${updates.status}`,
        message: `Your leave request from ${oldLeave?.startDate} has been ${updates.status.toLowerCase()}`,
        type: updates.status === 'Approved' ? 'success' : 'error',
        link: '/attendance'
      });
    }
  };
  const deleteLeave = async (id: string) => {
    await api.deleteLeave(id);
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
  const addGoal = async (g: Omit<Goal, 'id'>) => {
    await api.addGoal(g);
  };
  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    await api.updateGoal(id, updates);
  };
  const deleteGoal = async (id: string) => {
    await api.deleteGoal(id);
  };
  const addKeyResult = async (kr: Omit<KeyResult, 'id'>) => {
    await api.addKeyResult(kr);
  };
  const updateKeyResult = async (id: string, updates: Partial<KeyResult>) => {
    await api.updateKeyResult(id, updates);
  };
  const deleteKeyResult = async (id: string) => {
    await api.deleteKeyResult(id);
  };
  const addKRCheckIn = async (ci: Omit<KRCheckIn, 'id'>) => {
    await api.addKRCheckIn(ci);
    const kr = keyResults.find(k => k.id === ci.krId);
    if (kr && kr.ownerId !== user?.id) {
      await addNotification({
        userId: kr.ownerId,
        title: 'KR Updated',
        message: `Your KR "${kr.title}" has been updated to ${ci.value}${kr.unit}`,
        type: 'info',
        link: '/lakshya'
      });
    }
  };
  const addInitiative = async (i: Omit<Initiative, 'id'>) => {
    await api.addInitiative(i);
    if (i.ownerId !== user?.id) {
      await addNotification({
        userId: i.ownerId,
        title: 'New Initiative Assigned',
        message: `You have been assigned a new initiative: ${i.title}`,
        type: 'info',
        link: '/lakshya'
      });
    }
  };
  const updateInitiative = async (id: string, updates: Partial<Initiative>) => {
    const oldInitiative = initiatives.find(i => i.id === id);
    await api.updateInitiative(id, updates);
    if (updates.ownerId && updates.ownerId !== oldInitiative?.ownerId && updates.ownerId !== user?.id) {
      await addNotification({
        userId: updates.ownerId,
        title: 'Initiative Assigned',
        message: `You have been assigned the initiative: ${updates.title || oldInitiative?.title}`,
        type: 'info',
        link: '/lakshya'
      });
    }
  };
  const deleteInitiative = async (id: string) => {
    await api.deleteInitiative(id);
  };
  const addNotification = async (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    await api.addNotification(n);
  };
  const markNotificationAsRead = async (id: string) => {
    await api.updateNotification(id, { read: true });
  };
  const deleteNotification = async (id: string) => {
    await api.deleteNotification(id);
  };
  const uploadFile = async (file: File, path: string) => {
    return await api.uploadFile(file, path);
  };

  return (
    <AppContext.Provider value={{ 
      users, teams, leaves, holidays, settings, documents, reviewCycles, reviewSubmissions, adminNotes, guptGupshupPosts,
      goals, keyResults, krCheckIns, initiatives, notifications,
      addUser, updateUser, deleteUser, addTeam, updateTeam, 
      addLeave, updateLeave, deleteLeave, addHoliday, deleteHoliday, 
      updateSettings, addDocument, deleteDocument,
      addReviewCycle, updateReviewCycle, addReviewSubmission,
      addAdminNote, deleteAdminNote, addGuptGupshupPost, updateGuptGupshupPost,
      addGoal, updateGoal, deleteGoal, addKeyResult, updateKeyResult, deleteKeyResult,
      addKRCheckIn, addInitiative, updateInitiative, deleteInitiative,
      addNotification, markNotificationAsRead, deleteNotification,
      uploadFile,
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
