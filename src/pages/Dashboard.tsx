import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Users, Briefcase, TrendingUp, Calendar, Gift, Award, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

export const Dashboard = () => {
  const { users, teams, leaves, adminNotes } = useAppContext();
  const { user } = useAuth();
  const [notePage, setNotePage] = useState(0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upcoming Leaves (next 30 days)
  const upcomingLeaves = leaves
    .filter(l => l.status === 'Approved' && new Date(l.startDate) >= today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  // Upcoming Events (Birthdays & Anniversaries in next 30 days)
  const upcomingEvents = users.flatMap(u => {
    const events = [];
    if (u.birthday) {
      const bday = new Date(u.birthday);
      bday.setFullYear(today.getFullYear());
      if (bday < today) bday.setFullYear(today.getFullYear() + 1);
      
      const diffTime = Math.abs(bday.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 30) {
        events.push({ type: 'Birthday', date: bday, user: u, days: diffDays });
      }
    }
    if (u.anniversary) {
      const anniv = new Date(u.anniversary);
      anniv.setFullYear(today.getFullYear());
      if (anniv < today) anniv.setFullYear(today.getFullYear() + 1);
      
      const diffTime = Math.abs(anniv.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 30) {
        events.push({ type: 'Work Anniversary', date: anniv, user: u, days: diffDays });
      }
    }
    return events;
  }).sort((a, b) => a.days - b.days).slice(0, 5);

  // Active Admin Notes
  const activeNotes = adminNotes
    .filter(n => new Date(n.expiryDate) >= today)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const notesPerPage = 1;
  const totalNotePages = Math.ceil(activeNotes.length / notesPerPage);
  const currentNotes = activeNotes.slice(notePage * notesPerPage, (notePage + 1) * notesPerPage);

  const nextNotePage = () => setNotePage(p => Math.min(totalNotePages - 1, p + 1));
  const prevNotePage = () => setNotePage(p => Math.max(0, p - 1));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-stone-800 tracking-tight">Welcome back, {user?.name.split(' ')[0]}! 👋</h1>
        <p className="text-stone-500 mt-1 font-medium">Here's what's happening in your Panchayat today.</p>
      </div>

      {/* Admin Notes */}
      {activeNotes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-lg font-bold text-amber-900">Announcements</h3>
          </div>
          
          <div className="min-h-[80px]">
            {currentNotes.map(note => (
              <div key={note.id} className="animate-in fade-in slide-in-from-bottom-2">
                <p className="text-amber-800 font-medium text-lg">{note.content}</p>
                <p className="text-amber-600/70 text-sm mt-2">
                  Expires: {new Date(note.expiryDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {totalNotePages > 1 && (
            <div className="absolute bottom-6 right-6 flex items-center gap-2">
              <button 
                onClick={prevNotePage} 
                disabled={notePage === 0}
                className="p-1.5 rounded-lg hover:bg-amber-200/50 disabled:opacity-50 text-amber-700 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-medium text-amber-700/70">
                {notePage + 1} / {totalNotePages}
              </span>
              <button 
                onClick={nextNotePage} 
                disabled={notePage === totalNotePages - 1}
                className="p-1.5 rounded-lg hover:bg-amber-200/50 disabled:opacity-50 text-amber-700 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Leaves */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
              <Calendar size={20} />
            </div>
            <h3 className="text-lg font-bold text-stone-800">Upcoming Leaves</h3>
          </div>
          
          <div className="space-y-4">
            {upcomingLeaves.length > 0 ? (
              upcomingLeaves.map(leave => {
                const leaveUser = users.find(u => u.id === leave.userId);
                return (
                  <div key={leave.id} className="flex items-center gap-4 p-3 hover:bg-stone-50 rounded-2xl transition-colors">
                    <img src={leaveUser?.avatar || `https://ui-avatars.com/api/?name=${leaveUser?.name}`} alt={leaveUser?.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1">
                      <p className="font-bold text-stone-800">{leaveUser?.name}</p>
                      <p className="text-sm text-stone-500">{leave.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-stone-700">
                        {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-stone-500">
                        to {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-stone-500 text-center py-4">No upcoming leaves in the next 30 days.</p>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-fuchsia-50 text-fuchsia-500 rounded-xl">
              <Gift size={20} />
            </div>
            <h3 className="text-lg font-bold text-stone-800">Upcoming Events</h3>
          </div>
          
          <div className="space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 hover:bg-stone-50 rounded-2xl transition-colors">
                  <div className={`p-3 rounded-full ${event.type === 'Birthday' ? 'bg-pink-50 text-pink-500' : 'bg-purple-50 text-purple-500'}`}>
                    {event.type === 'Birthday' ? <Gift size={18} /> : <Award size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-stone-800">{event.user.name}</p>
                    <p className="text-sm text-stone-500">{event.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-stone-700">
                      {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-stone-500">
                      {event.days === 0 ? 'Today!' : `in ${event.days} days`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-stone-500 text-center py-4">No upcoming events in the next 30 days.</p>
            )}
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
