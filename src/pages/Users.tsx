import React, { useState } from 'react';
import { useAppContext, Role, User } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Plus, MoreVertical, Mail, Phone, KeyRound, Edit2 } from 'lucide-react';

export const Users = () => {
  const { users, teams, addUser, updateUser } = useAppContext();
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetMessage, setResetMessage] = useState('');

  const handleAdminReset = async (email: string) => {
    if (window.confirm(`Are you sure you want to reset the password for ${email}?`)) {
      try {
        await api.resetPassword(email, 'welcome@123');
        setResetMessage(`Password for ${email} reset to 'welcome@123'`);
        setTimeout(() => setResetMessage(''), 5000);
      } catch (err) {
        alert('Failed to reset password');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Directory</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your team members and their roles.</p>
        </div>
        {currentUser?.role === 'Admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm shadow-violet-600/20"
          >
            <Plus size={18} />
            Add User
          </button>
        )}
      </div>

      {resetMessage && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm font-bold border border-emerald-100">
          {resetMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.map(user => {
          const userTeams = teams.filter(t => user.teamIds?.includes(t.id));
          const manager = users.find(u => u.id === user.managerId);
          
          return (
            <div key={user.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
              {currentUser?.role === 'Admin' && (
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingUser(user)}
                    title="Edit User"
                    className="text-slate-300 hover:text-violet-500 p-2 rounded-lg hover:bg-violet-50"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleAdminReset(user.email)}
                    title="Reset Password"
                    className="text-slate-300 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50"
                  >
                    <KeyRound size={18} />
                  </button>
                </div>
              )}
              <div className="flex flex-col items-center text-center mt-2">
                <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-slate-50 shadow-sm" />
                <h3 className="text-lg font-bold text-slate-800">{user.name}</h3>
                <p className="text-sm text-violet-600 font-bold mb-2">{user.role}</p>
                
                <div className="flex flex-wrap gap-1 justify-center mb-2">
                  {userTeams.map(t => (
                    <span key={t.id} className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md">{t.name}</span>
                  ))}
                </div>
                
                {manager && (
                  <p className="text-xs text-slate-400 font-medium mb-2">Reports to: {manager.name}</p>
                )}

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 w-full justify-center">
                  <button className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-violet-50 hover:text-violet-600 transition-colors">
                    <Mail size={16} />
                  </button>
                  <button className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-violet-50 hover:text-violet-600 transition-colors">
                    <Phone size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(isModalOpen || editingUser) && (
        <UserModal 
          user={editingUser} 
          onClose={() => { setIsModalOpen(false); setEditingUser(null); }} 
        />
      )}
    </div>
  );
};

const UserModal = ({ user, onClose }: { user: User | null, onClose: () => void }) => {
  const { addUser, updateUser, teams, users } = useAppContext();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'Employee' as Role,
    teamIds: user?.teamIds || [],
    managerId: user?.managerId || '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (user) {
        const updates: any = { ...formData };
        if (!updates.password) delete updates.password;
        await updateUser(user.id, updates);
      } else {
        await addUser({
          ...formData,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random&color=fff`
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamToggle = (teamId: string) => {
    setFormData(prev => ({
      ...prev,
      teamIds: prev.teamIds.includes(teamId) 
        ? prev.teamIds.filter(id => id !== teamId)
        : [...prev.teamIds, teamId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">{user ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
            <input
              required
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
            <input
              required
              type="email"
              disabled={!!user}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all disabled:opacity-50"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          {user && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Set New Password (Optional)</label>
              <input
                type="text"
                placeholder="Leave blank to keep current"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Role</label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all appearance-none"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value as Role})}
            >
              <option value="Employee">Employee</option>
              <option value="Team Lead">Team Lead</option>
              <option value="HR">HR</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Manager</label>
            <select
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all appearance-none"
              value={formData.managerId}
              onChange={e => setFormData({...formData, managerId: e.target.value})}
            >
              <option value="">No Manager</option>
              {users.filter(u => u.id !== user?.id).map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Teams</label>
            <div className="space-y-2 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
              {teams.map(t => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.teamIds.includes(t.id)}
                    onChange={() => handleTeamToggle(t.id)}
                    className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                  />
                  <span className="text-sm text-slate-700">{t.name}</span>
                </label>
              ))}
              {teams.length === 0 && <p className="text-xs text-slate-500">No teams available</p>}
            </div>
          </div>
          <div className="pt-4 flex gap-3 shrink-0">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-colors shadow-sm shadow-violet-600/20 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
