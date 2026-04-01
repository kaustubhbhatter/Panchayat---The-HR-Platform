import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Users, Briefcase, TrendingUp, Calendar, Bell, Info } from 'lucide-react';

export const Dashboard = () => {
  const { users, teams, leaves, adminNotes } = useAppContext();
  const { user } = useAuth();

  const today = new Date();
  const upcomingLeaves = leaves.filter(l => new Date(l.startDate) >= today && l.status === 'Approved').sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 5);
  
  const upcomingBirthdays = users.filter(u => {
    if (!u.dob) return false;
    const dob = new Date(u.dob);
    dob.setFullYear(today.getFullYear());
    if (dob < today) dob.setFullYear(today.getFullYear() + 1);
    const diffTime = Math.abs(dob.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  }).sort((a, b) => {
    const dobA = new Date(a.dob!); dobA.setFullYear(today.getFullYear()); if (dobA < today) dobA.setFullYear(today.getFullYear() + 1);
    const dobB = new Date(b.dob!); dobB.setFullYear(today.getFullYear()); if (dobB < today) dobB.setFullYear(today.getFullYear() + 1);
    return dobA.getTime() - dobB.getTime();
  }).slice(0, 5);

  const upcomingAnniversaries = users.filter(u => {
    if (!u.joiningDate) return false;
    const join = new Date(u.joiningDate);
    join.setFullYear(today.getFullYear());
    if (join < today) join.setFullYear(today.getFullYear() + 1);
    const diffTime = Math.abs(join.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  }).sort((a, b) => {
    const joinA = new Date(a.joiningDate!); joinA.setFullYear(today.getFullYear()); if (joinA < today) joinA.setFullYear(today.getFullYear() + 1);
    const joinB = new Date(b.joiningDate!); joinB.setFullYear(today.getFullYear()); if (joinB < today) joinB.setFullYear(today.getFullYear() + 1);
    return joinA.getTime() - joinB.getTime();
  }).slice(0, 5);

  const activeNotes = adminNotes.filter(n => new Date(n.expiryDate) >= today).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-stone-800 tracking-tight">Welcome back, {user?.name.split(' ')[0]}! 👋</h1>
        <p className="text-stone-500 mt-1 font-medium">Here's what's happening in your Panchayat today.</p>
      </div>

      {/* Admin Notes */}
      {activeNotes.length > 0 && (
        <div className="space-y-4">
          {activeNotes.map(note => (
            <div key={note.id} className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-start gap-4 shadow-sm">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-xl shrink-0">
                <Info size={20} />
              </div>
              <div>
                <h4 className="font-bold text-orange-900">Announcement from Sarpanch</h4>
                <p className="text-sm text-orange-800 mt-1">{note.message}</p>
                <p className="text-xs text-orange-600/70 mt-2 font-medium">Expires {new Date(note.expiryDate).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Villagers"
          value={users.length}
          icon={<Users size={24} className="text-orange-500" />}
          trend="+12% this month"
          color="bg-orange-50"
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

      {/* Upcoming Events & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
          <h3 className="text-lg font-black text-stone-800 mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-orange-500" />
            Upcoming Events
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4 border-b border-stone-100 pb-2">Birthdays & Anniversaries</h4>
              <div className="space-y-4">
                {upcomingBirthdays.length === 0 && upcomingAnniversaries.length === 0 && (
                  <p className="text-sm text-stone-500 italic">No upcoming celebrations in the next 30 days.</p>
                )}
                {upcomingBirthdays.map(u => (
                  <div key={`bday-${u.id}`} className="flex items-center gap-3">
                    <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-stone-200" />
                    <div>
                      <p className="text-sm font-bold text-stone-800">{u.name}</p>
                      <p className="text-xs text-orange-600 font-medium">🎂 Birthday on {new Date(u.dob!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
                {upcomingAnniversaries.map(u => {
                  const years = today.getFullYear() - new Date(u.joiningDate!).getFullYear();
                  return (
                    <div key={`anniv-${u.id}`} className="flex items-center gap-3">
                      <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-stone-200" />
                      <div>
                        <p className="text-sm font-bold text-stone-800">{u.name}</p>
                        <p className="text-xs text-emerald-600 font-medium">🎉 {years > 0 ? `${years} Year` : '1st'} Work Anniversary on {new Date(u.joiningDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4 border-b border-stone-100 pb-2">Upcoming Leaves</h4>
              <div className="space-y-4">
                {upcomingLeaves.length === 0 ? (
                  <p className="text-sm text-stone-500 italic">No approved leaves coming up.</p>
                ) : (
                  upcomingLeaves.map(leave => {
                    const leaveUser = users.find(u => u.id === leave.userId);
                    return (
                      <div key={leave.id} className="flex items-center gap-3">
                        <img src={leaveUser?.avatar} alt={leaveUser?.name} className="w-10 h-10 rounded-full object-cover border border-stone-200" />
                        <div>
                          <p className="text-sm font-bold text-stone-800">{leaveUser?.name}</p>
                          <p className="text-xs text-stone-500 font-medium">{new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"></div>
          <h3 className="text-lg font-bold mb-4 relative z-10">Quick Actions</h3>
          <div className="space-y-3 relative z-10">
            <button className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors backdrop-blur-sm">
              <span className="font-medium">Welcome New Villager</span>
              <span className="bg-white/20 p-1.5 rounded-lg">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors backdrop-blur-sm">
              <span className="font-medium">Form New Team</span>
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
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-start justify-between group hover:shadow-md transition-shadow">
    <div>
      <p className="text-stone-500 font-medium text-sm mb-1">{title}</p>
      <h3 className="text-3xl font-black text-stone-800">{value}</h3>
      <p className="text-xs font-medium text-emerald-500 mt-2">{trend}</p>
    </div>
    <div className={`p-4 rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
  </div>
);
