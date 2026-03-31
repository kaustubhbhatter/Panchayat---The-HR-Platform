import { User, Team, Role, LeaveRequest, Holiday, AppSettings, DocumentItem } from '../context/AppContext';

// Simulate network delay for realistic testing
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const ADMIN_EMAIL = 'bhatter.kaustubh@gmail.com';
const ADMIN_PASS = 'pass@123';

// Initialize mock database in localStorage
export const initDB = () => {
  const version = localStorage.getItem('adda_version');
  if (version !== '2') {
    const initialUsers = [{
      id: 'admin-1',
      name: 'Kaustubh Bhatter',
      email: ADMIN_EMAIL,
      password: ADMIN_PASS,
      role: 'Admin' as Role,
      teamIds: [],
      avatar: 'https://ui-avatars.com/api/?name=Kaustubh+Bhatter&background=6D28D9&color=fff'
    }];
    localStorage.setItem('adda_users', JSON.stringify(initialUsers));
    localStorage.setItem('adda_teams', JSON.stringify([]));
    localStorage.setItem('adda_leaves', JSON.stringify([]));
    localStorage.setItem('adda_holidays', JSON.stringify([]));
    localStorage.setItem('adda_settings', JSON.stringify({ defaultLeaveQuota: 20 }));
    localStorage.setItem('adda_documents', JSON.stringify([]));
    localStorage.setItem('adda_version', '2');
  }
};

const getDb = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setDb = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

// Mock API Service (Replace with Cloudflare Worker fetch calls later)
export const api = {
  login: async (email: string, password: string): Promise<User> => {
    await delay(500);
    const users = getDb('adda_users');
    const user = users.find((u: any) => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid email or password');
    const { password: _, ...userWithoutPass } = user;
    return userWithoutPass;
  },

  resetPassword: async (email: string, newPassword?: string): Promise<void> => {
    await delay(500);
    const users = getDb('adda_users');
    const userIndex = users.findIndex((u: any) => u.email === email);
    if (userIndex === -1) throw new Error('User not found');
    users[userIndex].password = newPassword || 'newpass@123'; 
    setDb('adda_users', users);
  },

  getUsers: async (): Promise<User[]> => {
    await delay(300);
    return getDb('adda_users').map((u: any) => {
      const { password, ...rest } = u;
      return rest;
    });
  },

  getTeams: async (): Promise<Team[]> => {
    await delay(300);
    return getDb('adda_teams');
  },

  addUser: async (user: Omit<User, 'id'> & { password?: string }): Promise<User> => {
    await delay(300);
    const users = getDb('adda_users');
    if (users.find((u: any) => u.email === user.email)) {
      throw new Error('Email already exists');
    }
    const newUser = { 
      ...user, 
      id: Date.now().toString(),
      password: user.password || 'welcome@123'
    };
    users.push(newUser);
    setDb('adda_users', users);
    const { password, ...rest } = newUser;
    return rest;
  },

  updateUser: async (id: string, updates: Partial<User> & { password?: string }): Promise<User> => {
    await delay(300);
    const users = getDb('adda_users');
    const idx = users.findIndex((u: any) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    users[idx] = { ...users[idx], ...updates };
    setDb('adda_users', users);
    const { password, ...rest } = users[idx];
    return rest;
  },

  addTeam: async (team: Omit<Team, 'id'>): Promise<Team> => {
    await delay(300);
    const teams = getDb('adda_teams');
    const newTeam = { ...team, id: Date.now().toString() };
    teams.push(newTeam);
    setDb('adda_teams', teams);
    return newTeam;
  },

  updateTeam: async (id: string, updates: Partial<Team>): Promise<Team> => {
    await delay(300);
    const teams = getDb('adda_teams');
    const idx = teams.findIndex((t: any) => t.id === id);
    if (idx === -1) throw new Error('Team not found');
    teams[idx] = { ...teams[idx], ...updates };
    setDb('adda_teams', teams);
    return teams[idx];
  },

  getLeaves: async (): Promise<LeaveRequest[]> => getDb('adda_leaves'),
  addLeave: async (leave: Omit<LeaveRequest, 'id'>): Promise<LeaveRequest> => {
    const leaves = getDb('adda_leaves');
    const newLeave = { ...leave, id: Date.now().toString() };
    leaves.push(newLeave);
    setDb('adda_leaves', leaves);
    return newLeave;
  },
  updateLeave: async (id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    const leaves = getDb('adda_leaves');
    const idx = leaves.findIndex((l: any) => l.id === id);
    leaves[idx] = { ...leaves[idx], ...updates };
    setDb('adda_leaves', leaves);
    return leaves[idx];
  },

  getHolidays: async (): Promise<Holiday[]> => getDb('adda_holidays'),
  addHoliday: async (holiday: Omit<Holiday, 'id'>): Promise<Holiday> => {
    const holidays = getDb('adda_holidays');
    const newHoliday = { ...holiday, id: Date.now().toString() };
    holidays.push(newHoliday);
    setDb('adda_holidays', holidays);
    return newHoliday;
  },
  deleteHoliday: async (id: string): Promise<void> => {
    const holidays = getDb('adda_holidays').filter((h: any) => h.id !== id);
    setDb('adda_holidays', holidays);
  },

  getSettings: async (): Promise<AppSettings> => {
    return JSON.parse(localStorage.getItem('adda_settings') || '{"defaultLeaveQuota": 20}');
  },
  updateSettings: async (settings: AppSettings): Promise<AppSettings> => {
    setDb('adda_settings', settings);
    return settings;
  },

  getDocuments: async (): Promise<DocumentItem[]> => getDb('adda_documents'),
  addDocument: async (doc: Omit<DocumentItem, 'id'>): Promise<DocumentItem> => {
    const docs = getDb('adda_documents');
    const newDoc = { ...doc, id: Date.now().toString() };
    docs.push(newDoc);
    setDb('adda_documents', docs);
    return newDoc;
  },
  deleteDocument: async (id: string): Promise<void> => {
    const docs = getDb('adda_documents').filter((d: any) => d.id !== id);
    setDb('adda_documents', docs);
  }
};
