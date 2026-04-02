import React, { useState } from 'react';
import { useAppContext, Role, User } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Plus, Trash2, Mail, Phone, Edit2, Briefcase, Calendar } from 'lucide-react';

export const Users = () => {
  const { users, teams, addUser, updateUser, deleteUser } = useAppContext();
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('Active');

  const handleDeleteUser = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      try {
        await deleteUser(id);
        setMessage(`User ${name} deleted successfully`);
        setTimeout(() => setMessage(''), 5000);
      } catch (err) {
        alert('Failed to delete user');
      }
    }
  };

  const filteredUsers = users.filter(u => filterStatus === 'All' || u.status === filterStatus || (filterStatus === 'Active' && !u.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sabha - Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your team members and their roles.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          {(currentUser?.role === 'Admin' || currentUser?.role === 'Sarpanch') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-violet-600/20"
            >
              <Plus size={16} />
              Add User
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm font-medium border border-emerald-100">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredUsers.map(user => {
          const userTeams = teams.filter(t => user.teamIds?.includes(t.id));
          const manager = users.find(u => u.id === user.managerId);
          const isActive = user.status !== 'Inactive';
          
          return (
            <div key={user.id} className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group ${!isActive ? 'opacity-60' : ''}`}>
              {(currentUser?.role === 'Admin' || currentUser?.role === 'Sarpanch') && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingUser(user)}
                    title="Edit User"
                    className="text-slate-400 hover:text-violet-600 p-1.5 rounded-md hover:bg-violet-50"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    title="Delete User"
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-start gap-4">
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border border-slate-100" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 truncate flex items-center gap-2">
                    {user.name}
                    {!isActive && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">Inactive</span>}
                  </h3>
                  <p className="text-xs text-violet-600 font-medium truncate">
                    {user.role === 'Admin' || user.role === 'Sarpanch' ? 'Sarpanch' : teams.some(t => t.managerIds.includes(user.id)) ? 'Mukhiya' : 'Karyakarta'}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {userTeams.slice(0, 2).map(t => (
                      <span key={t.id} className="text-[10px] text-slate-500 font-medium bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">{t.name}</span>
                    ))}
                    {userTeams.length > 2 && <span className="text-[10px] text-slate-400">+{userTeams.length - 2}</span>}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-50 grid grid-cols-2 gap-2 text-xs text-slate-500">
                {user.joiningDate && (
                  <div className="flex items-center gap-1.5" title="Joining Date">
                    <Calendar size={12} className="text-slate-400" />
                    <span className="truncate">{new Date(user.joiningDate).toLocaleDateString()}</span>
                  </div>
                )}
                {manager && (
                  <div className="flex items-center gap-1.5" title="Manager">
                    <Briefcase size={12} className="text-slate-400" />
                    <span className="truncate">{manager.name}</span>
                  </div>
                )}
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
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: (user?.role === 'Admin' || user?.role === 'Sarpanch') ? 'Sarpanch' : 'Karyakarta' as Role,
    teamIds: user?.teamIds || [],
    managerId: user?.managerId || '',
    status: user?.status || 'Active',
    joiningDate: user?.joiningDate || '',
    internshipDate: user?.internshipDate || '',
    conversionDate: user?.conversionDate || '',
    designation: user?.designation || '',
    wfhEnabled: user?.wfhEnabled || false,
    creditedLeaves: user?.creditedLeaves || 0,
    isIntern: user?.isIntern || false,
    birthday: user?.birthday || '',
    anniversary: user?.anniversary || ''
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
        // Remove empty optional fields to satisfy Firestore rules
        if (!updates.managerId || updates.role === 'Admin' || updates.role === 'Sarpanch') updates.managerId = null;
        if (!updates.joiningDate) delete updates.joiningDate;
        if (!updates.internshipDate) delete updates.internshipDate;
        if (!updates.conversionDate) delete updates.conversionDate;
        if (!updates.designation) delete updates.designation;
        if (!updates.birthday) delete updates.birthday;
        if (!updates.anniversary) delete updates.anniversary;
        
        await updateUser(user.id, updates);
      } else {
        const newUser: any = {
          ...formData,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random&color=fff`
        };
        
        // Remove empty optional fields to satisfy Firestore rules
        if (!newUser.managerId || newUser.role === 'Admin' || newUser.role === 'Sarpanch') newUser.managerId = null;
        if (!newUser.joiningDate) delete newUser.joiningDate;
        if (!newUser.internshipDate) delete newUser.internshipDate;
        if (!newUser.conversionDate) delete newUser.conversionDate;
        if (!newUser.designation) delete newUser.designation;
        if (!newUser.birthday) delete newUser.birthday;
        if (!newUser.anniversary) delete newUser.anniversary;
        
        await addUser(newUser);
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <h2 className="text-base font-bold text-slate-800">{user ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm font-medium mb-4">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Basic Info</h3>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  required
                  type="email"
                  disabled={!!user}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all disabled:opacity-50"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  value={formData.designation}
                  onChange={e => setFormData({...formData, designation: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                  <select
                    disabled={currentUser?.role !== 'Admin' && currentUser?.role !== 'Sarpanch'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all disabled:opacity-50"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as Role})}
                  >
                    <option value="Karyakarta">Karyakarta</option>
                    <option value="Sarpanch">Sarpanch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    disabled={currentUser?.role !== 'Admin' && currentUser?.role !== 'Sarpanch'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all disabled:opacity-50"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Employment & Teams */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Employment & Teams</h3>
              {formData.role !== 'Admin' && formData.role !== 'Sarpanch' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Manager</label>
                  <select
                    disabled={currentUser?.role !== 'Admin' && currentUser?.role !== 'Sarpanch'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all disabled:opacity-50"
                    value={formData.managerId}
                    onChange={e => setFormData({...formData, managerId: e.target.value})}
                  >
                    <option value="">No Manager</option>
                    {users.filter(u => u.id !== user?.id).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role === 'Admin' || u.role === 'Sarpanch' ? 'Sarpanch' : teams.some(t => t.managerIds.includes(u.id)) ? 'Mukhiya' : 'Karyakarta'})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
                  <input
                    disabled={currentUser?.role !== 'Admin' && currentUser?.role !== 'Sarpanch'}
                    type="date"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all disabled:opacity-50"
                    value={formData.joiningDate}
                    onChange={e => setFormData({...formData, joiningDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Credited Leaves</label>
                  <input
                    disabled={currentUser?.role !== 'Admin' && currentUser?.role !== 'Sarpanch'}
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all disabled:opacity-50"
                    value={formData.creditedLeaves}
                    onChange={e => setFormData({...formData, creditedLeaves: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Birthday</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                    value={formData.birthday}
                    onChange={e => setFormData({...formData, birthday: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Work Anniversary</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                    value={formData.anniversary}
                    onChange={e => setFormData({...formData, anniversary: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isIntern}
                    onChange={e => setFormData({...formData, isIntern: e.target.checked})}
                    className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                  />
                  <span className="text-sm font-bold text-slate-700">Is/Was an Intern?</span>
                </label>
                
                {formData.isIntern && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Internship Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                        value={formData.internshipDate}
                        onChange={e => setFormData({...formData, internshipDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Conversion Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                        value={formData.conversionDate}
                        onChange={e => setFormData({...formData, conversionDate: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.wfhEnabled}
                    onChange={e => setFormData({...formData, wfhEnabled: e.target.checked})}
                    className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                  />
                  <span className="text-sm font-bold text-slate-700">Enable Work From Home (WFH)</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teams</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                  {teams.map(t => (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.teamIds.includes(t.id)}
                        onChange={() => handleTeamToggle(t.id)}
                        className="w-3.5 h-3.5 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                      />
                      <span className="text-sm text-slate-700">{t.name}</span>
                    </label>
                  ))}
                  {teams.length === 0 && <p className="text-xs text-slate-500">No teams available</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-3 shrink-0 justify-end border-t border-slate-100 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm shadow-violet-600/20 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
