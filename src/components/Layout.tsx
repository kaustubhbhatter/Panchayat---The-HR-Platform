import React, { useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, UsersRound, LayoutDashboard, Bell, Search, LogOut, Calendar, Settings, FileText, TreeDeciduous, MessageSquare, Camera, Loader2, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext, User, Team } from '../context/AppContext';
import { EmployeeProfileModal } from './EmployeeProfileModal';
import { TeamDetailsModal } from './TeamModals';

export const Layout = () => {
  const { user, logout } = useAuth();
  const { uploadFile, updateUser, users, teams } = useAppContext();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const filteredUsers = searchQuery.trim() 
    ? users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.designation?.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];
  
  const filteredTeams = searchQuery.trim()
    ? teams.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const hasResults = filteredUsers.length > 0 || filteredTeams.length > 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // 2MB Limit
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadFile(file, 'avatars');
      await updateUser(user.id, { avatar: url });
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#fdfbf7] text-stone-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-100 flex flex-col shadow-sm z-10">
        <div className="h-20 flex items-center px-8 border-b border-stone-100">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
              <TreeDeciduous size={24} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-black tracking-tight text-stone-900">Panchayat</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem to="/sabha" icon={<Users size={20} />} label="Sabha" />
          <NavItem to="/attendance" icon={<Calendar size={20} />} label="Hazri" />
          <NavItem to="/reviews" icon={<MessageSquare size={20} />} label="Charcha" />
          <NavItem to="/documents" icon={<FileText size={20} />} label="Khaata" />
          {(user?.role === 'Admin' || user?.role === 'Sarpanch') && (
            <NavItem to="/admin" icon={<Settings size={20} />} label="Sarpanch" />
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-stone-100 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Search employees, teams..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-100/50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
            />

            {showSearchResults && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden z-50 max-h-96 overflow-y-auto">
                <div className="p-2">
                  {hasResults ? (
                    <>
                      {filteredUsers.length > 0 && (
                        <div className="mb-2">
                          <p className="px-3 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider">Employees</p>
                          {filteredUsers.map(u => (
                            <button
                              key={u.id}
                              onClick={() => {
                                setSelectedUser(u);
                                setShowSearchResults(false);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-stone-50 rounded-xl transition-colors text-left"
                            >
                              <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                              <div>
                                <p className="text-sm font-bold text-stone-800">{u.name}</p>
                                <p className="text-xs text-stone-500">{u.designation}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {filteredTeams.length > 0 && (
                        <div>
                          <p className="px-3 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider">Teams</p>
                          {filteredTeams.map(t => (
                            <button
                              key={t.id}
                              onClick={() => {
                                setSelectedTeam(t);
                                setShowSearchResults(false);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-stone-50 rounded-xl transition-colors text-left"
                            >
                              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                                <UsersIcon size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-stone-800">{t.name}</p>
                                <p className="text-xs text-stone-500">{t.description}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-sm text-stone-500">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {showSearchResults && searchQuery.trim() && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowSearchResults(false)}
              />
            )}
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-stone-400 hover:text-orange-500 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-4 pl-6 border-l border-stone-200">
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-stone-700">{user?.name}</p>
                  <p className="text-xs text-stone-500 font-medium">{user?.role}</p>
                </div>
                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                  <img 
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=EA580C&color=fff`} 
                    alt="Profile" 
                    className={`w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover transition-opacity ${isUploading ? 'opacity-50' : 'group-hover:opacity-80'}`} 
                  />
                  {isUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 size={16} className="text-orange-600 animate-spin" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={16} className="text-white drop-shadow-md" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                title="Log out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>

      {selectedUser && (
        <EmployeeProfileModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}

      {selectedTeam && (
        <TeamDetailsModal 
          team={selectedTeam} 
          onClose={() => setSelectedTeam(null)} 
        />
      )}
    </div>
  );
};

const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-200 ${
        isActive
          ? 'bg-orange-50 text-orange-600 shadow-sm'
          : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
      }`
    }
  >
    {icon}
    {label}
  </NavLink>
);
