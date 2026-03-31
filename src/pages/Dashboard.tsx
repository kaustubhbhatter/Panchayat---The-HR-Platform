import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Users, Briefcase, TrendingUp } from 'lucide-react';

export const Dashboard = () => {
  const { users, teams } = useAppContext();
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Welcome back, {user?.name.split(' ')[0]}! 👋</h1>
        <p className="text-slate-500 mt-1 font-medium">Here's what's happening in your company today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Employees"
          value={users.length}
          icon={<Users size={24} className="text-violet-500" />}
          trend="+12% this month"
          color="bg-violet-50"
        />
        <StatCard
          title="Active Teams"
          value={teams.length}
          icon={<Briefcase size={24} className="text-rose-500" />}
          trend="+2 new teams"
          color="bg-rose-50"
        />
        <StatCard
          title="Avg. Performance"
          value="94%"
          icon={<TrendingUp size={24} className="text-emerald-500" />}
          trend="+4% from last quarter"
          color="bg-emerald-50"
        />
      </div>

      {/* Recent Activity or Images */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Company Culture</h3>
          <div className="grid grid-cols-2 gap-4">
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&q=80" alt="Team" className="rounded-2xl h-40 w-full object-cover shadow-sm" />
            <img src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=500&q=80" alt="Office" className="rounded-2xl h-40 w-full object-cover shadow-sm" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl"></div>
          <h3 className="text-lg font-bold mb-4 relative z-10">Quick Actions</h3>
          <div className="space-y-3 relative z-10">
            <button className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors backdrop-blur-sm">
              <span className="font-medium">Onboard New Employee</span>
              <span className="bg-white/20 p-1.5 rounded-lg">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors backdrop-blur-sm">
              <span className="font-medium">Create New Team</span>
              <span className="bg-white/20 p-1.5 rounded-lg">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors backdrop-blur-sm">
              <span className="font-medium">Review Leave Requests</span>
              <span className="bg-white/20 p-1.5 rounded-lg">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, color }: any) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-start justify-between group hover:shadow-md transition-shadow">
    <div>
      <p className="text-slate-500 font-medium text-sm mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-800">{value}</h3>
      <p className="text-xs font-medium text-emerald-500 mt-2">{trend}</p>
    </div>
    <div className={`p-4 rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
  </div>
);
