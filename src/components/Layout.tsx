import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, UsersRound, LayoutDashboard, Bell, Search, LogOut, Calendar, Settings, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#F4F7FE] text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col shadow-sm z-10">
        <div className="h-20 flex items-center px-8 border-b border-slate-100">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#E31E24] shadow-sm border border-slate-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">Adda.</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          <NavItem to="/users" icon={<Users size={20} />} label="Directory" />
          <NavItem to="/teams" icon={<UsersRound size={20} />} label="Teams" />
          <NavItem to="/attendance" icon={<Calendar size={20} />} label="Attendance" />
          <NavItem to="/documents" icon={<FileText size={20} />} label="Documents" />
          {(user?.role === 'Admin' || user?.role === 'HR') && (
            <NavItem to="/admin" icon={<Settings size={20} />} label="Admin" />
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search employees, teams..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-violet-500 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-700">{user?.name}</p>
                  <p className="text-xs text-slate-500 font-medium">{user?.role}</p>
                </div>
                <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=6D28D9&color=fff`} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
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
    </div>
  );
};

const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-200 ${
        isActive
          ? 'bg-violet-50 text-violet-600 shadow-sm'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`
    }
  >
    {icon}
    {label}
  </NavLink>
);
