import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Users, Briefcase, TrendingUp, Calendar, Gift, Award, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

export const Drishyam = () => {
  const { users, teams, leaves, adminNotes, holidays } = useAppContext();
  const { user } = useAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
    .filter(n => {
      const expiry = new Date(n.expiryDate);
      expiry.setHours(23, 59, 59, 999); // End of the expiry day
      return expiry >= today;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const calendarDays = getDaysInMonth(currentMonth);

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayHolidays = holidays.filter(h => h.date === dateStr);
    const dayLeaves = leaves.filter(l => {
      if (l.status !== 'Approved') return false;
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      const current = new Date(date);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      current.setHours(0,0,0,0);
      
      if (current < start || current > end) return false;
      
      // Only show leaves of villagers in my team or my own leaves
      if (l.userId === user?.id) return true;
      const requestor = users.find(u => u.id === l.userId);
      if (!requestor) return false;
      const requestorTeams = teams.filter(t => requestor.teamIds?.includes(t.id));
      const myTeams = teams.filter(t => user?.teamIds?.includes(t.id) || t.managerIds?.includes(user?.id || ''));
      const shareTeam = requestorTeams.some(rt => myTeams.some(mt => mt.id === rt.id));
      return shareTeam;
    });
    return { holidays: dayHolidays, leaves: dayLeaves };
  };

  const selectedEvents = getEventsForDate(selectedDate);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-stone-800 tracking-tight">Drishyam: Welcome back, {user?.name.split(' ')[0]}! 👋</h1>
        <p className="text-stone-500 mt-1 font-medium">Here's what's happening in your Panchayat today.</p>
      </div>

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
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex flex-col group hover:shadow-md transition-shadow h-full min-h-[220px]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-stone-500 font-medium text-sm">Panchayat Notes</p>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <MessageSquare size={20} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {activeNotes.length > 0 ? (
              <div className="space-y-3">
                {activeNotes.map(note => (
                  <div key={note.id} className="border-l-2 border-amber-200 pl-3 py-1">
                    <p className="text-sm font-bold text-stone-800 line-clamp-2">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400 italic">No active notes.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Calendar */}
          <div className="p-6 md:w-1/2 border-b md:border-b-0 md:border-r border-stone-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-stone-800">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                  className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                  className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={`${d}-${i}`} className="text-[10px] font-bold text-stone-400 uppercase">{d}</span>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} className="aspect-square" />;
                
                const events = getEventsForDate(date);
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                const isSunday = date.getDay() === 0;
                const hasHoliday = events.holidays.length > 0 || isSunday;
                const hasLeave = events.leaves.length > 0;
                const hasMyLeave = events.leaves.some(l => l.userId === user?.id);

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      aspect-square rounded-xl text-xs font-medium flex flex-col items-center justify-center relative transition-all
                      ${isSelected ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : isSunday ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'hover:bg-stone-50 text-stone-700'}
                      ${isToday && !isSelected ? 'border-2 border-orange-200' : ''}
                    `}
                  >
                    {date.getDate()}
                    <div className="flex gap-0.5 mt-0.5">
                      {events.holidays.length > 0 && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500'}`} />}
                      {hasMyLeave && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />}
                      {hasLeave && !hasMyLeave && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-stone-400'}`} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Details */}
          <div className="p-6 md:w-1/2 bg-stone-50/30 flex flex-col">
            <div className="mb-6">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
              <h4 className="text-xl font-black text-stone-800">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </h4>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
              {selectedEvents.holidays.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Public Holidays</p>
                  {selectedEvents.holidays.map(h => (
                    <div key={h.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-2xl border border-yellow-100">
                      <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                        <Calendar size={16} />
                      </div>
                      <p className="text-sm font-bold text-stone-800">{h.name}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedEvents.leaves.length > 0 && selectedDate.toDateString() === new Date().toDateString() && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Villagers chilling today</p>
                  {selectedEvents.leaves.map(l => {
                    const leaveUser = users.find(u => u.id === l.userId);
                    return (
                      <div key={l.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-100">
                        <img 
                          src={leaveUser?.avatar || `https://ui-avatars.com/api/?name=${leaveUser?.name}`} 
                          alt={leaveUser?.name} 
                          className="w-8 h-8 rounded-full object-cover grayscale" 
                        />
                        <div>
                          <p className="text-sm font-bold text-stone-800">{leaveUser?.name} {l.userId === user?.id ? '(Me)' : ''}</p>
                          <p className="text-[10px] text-stone-500 font-medium">{l.type}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedEvents.holidays.length === 0 && (selectedEvents.leaves.length === 0 || selectedDate.toDateString() !== new Date().toDateString()) && (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <div className="w-12 h-12 bg-stone-100 text-stone-300 rounded-full flex items-center justify-center mb-3">
                    <Calendar size={24} />
                  </div>
                  <p className="text-sm text-stone-400 font-medium">No holidays or leaves<br/>on this day.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 h-full min-h-[220px] flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-fuchsia-50 text-fuchsia-500 rounded-xl">
              <Gift size={20} />
            </div>
            <h3 className="text-lg font-bold text-stone-800">Activities</h3>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
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
