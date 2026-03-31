import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const Attendance = () => {
  const { leaves, addLeave, updateLeave, holidays, settings, users, teams } = useAppContext();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'my-leaves' | 'apply' | 'requests'>('my-leaves');
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Apply leave state
  const [newLeave, setNewLeave] = useState({ startDate: '', endDate: '', type: 'Vacation', reason: '' });

  const isManager = users.some(u => u.managerId === user?.id) || 
                    teams.some(t => t.managerIds?.includes(user?.id || '')) ||
                    user?.role === 'Admin' || user?.role === 'HR';
  
  const myLeaves = leaves.filter(l => l.userId === user?.id);
  const pendingRequests = leaves.filter(l => {
    if (l.status !== 'Pending') return false;
    if (user?.role === 'Admin' || user?.role === 'HR') return true;
    const requestor = users.find(u => u.id === l.userId);
    if (!requestor) return false;
    if (requestor.managerId === user?.id) return true;
    
    const requestorTeams = teams.filter(t => requestor.teamIds?.includes(t.id));
    return requestorTeams.some(t => t.managerIds?.includes(user?.id || ''));
  });

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeave.startDate || !newLeave.endDate) return;
    await addLeave({
      userId: user!.id,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      type: newLeave.type,
      reason: newLeave.reason,
      status: 'Pending'
    });
    setNewLeave({ startDate: '', endDate: '', type: 'Vacation', reason: '' });
    setActiveTab('my-leaves');
  };

  const handleApproveReject = async (id: string, status: 'Approved' | 'Rejected') => {
    await updateLeave(id, { status });
  };

  // Calendar logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const isHoliday = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.some(h => h.date === dateStr);
  };
  
  const isWeekend = (day: number) => {
    const date = new Date(year, month, day);
    return date.getDay() === 0 || date.getDay() === 6;
  };

  const getHolidayName = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.find(h => h.date === dateStr)?.name;
  };

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const approvedLeavesDays = myLeaves
    .filter(l => l.status === 'Approved')
    .reduce((total, l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return total + diffDays;
    }, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Attendance & Leaves</h2>
          <p className="text-slate-500">Manage your time off and view team availability.</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('my-leaves')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'my-leaves' ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            My Leaves
          </button>
          <button
            onClick={() => setActiveTab('apply')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'apply' ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Apply Leave
          </button>
          {isManager && (
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'requests' ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              Requests
              {pendingRequests.length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Calendar & Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Leave Balance</h3>
            <div className="flex items-center justify-between p-4 bg-violet-50 rounded-xl border border-violet-100">
              <div>
                <p className="text-sm text-violet-600 font-medium">Available</p>
                <p className="text-3xl font-black text-violet-700">{Math.max(0, settings.defaultLeaveQuota - approvedLeavesDays)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 font-medium">Used</p>
                <p className="text-xl font-bold text-slate-700">{approvedLeavesDays}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">Out of {settings.defaultLeaveQuota} annual days</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <button onClick={prevMonth} className="p-1 hover:bg-slate-200 rounded-lg"><ChevronLeft size={20} /></button>
              <h3 className="font-bold text-slate-800">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={nextMonth} className="p-1 hover:bg-slate-200 rounded-lg"><ChevronRight size={20} /></button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {blanks.map(b => <div key={`blank-${b}`} className="h-8"></div>)}
                {days.map(d => {
                  const holiday = isHoliday(d);
                  const weekend = isWeekend(d);
                  return (
                    <div 
                      key={d} 
                      title={holiday ? getHolidayName(d) : ''}
                      className={`h-8 flex items-center justify-center rounded-lg text-sm font-medium cursor-default
                        ${holiday ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200' : 
                          weekend ? 'text-slate-400 bg-slate-50' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-4 text-xs text-slate-500 justify-center">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-100 rounded border border-rose-200"></div> Holiday</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-50 rounded border border-slate-200"></div> Weekend</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Main Content Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          {activeTab === 'my-leaves' && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-6">Leave History</h3>
              <div className="space-y-4">
                {myLeaves.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 rounded-xl">
                    No leaves requested yet.
                  </div>
                ) : (
                  myLeaves.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(leave => (
                    <div key={leave.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-violet-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                          ${leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 
                            leave.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                          {leave.status === 'Approved' ? <CheckCircle2 size={20} /> : 
                           leave.status === 'Rejected' ? <XCircle size={20} /> : <Clock size={20} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{leave.type}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 
                            leave.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                          {leave.status}
                        </span>
                        <p className="text-xs text-slate-400 mt-1 max-w-[150px] truncate" title={leave.reason}>{leave.reason}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'apply' && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-6">Apply for Leave</h3>
              <form onSubmit={handleApply} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
                  <select
                    value={newLeave.type}
                    onChange={e => setNewLeave({...newLeave, type: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 bg-white"
                  >
                    <option>Vacation</option>
                    <option>Sick Leave</option>
                    <option>Personal</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={newLeave.startDate}
                      onChange={e => setNewLeave({...newLeave, startDate: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={newLeave.endDate}
                      onChange={e => setNewLeave({...newLeave, endDate: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                  <textarea
                    required
                    value={newLeave.reason}
                    onChange={e => setNewLeave({...newLeave, reason: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 transition-colors"
                >
                  Submit Request
                </button>
              </form>
            </div>
          )}

          {activeTab === 'requests' && isManager && (
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-6">Leave Center</h3>
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 rounded-xl">
                    No pending leave requests to review.
                  </div>
                ) : (
                  pendingRequests.map(leave => {
                    const requestor = users.find(u => u.id === leave.userId);
                    return (
                      <div key={leave.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <img src={requestor?.avatar} alt="" className="w-10 h-10 rounded-full" />
                            <div>
                              <p className="font-bold text-slate-800">{requestor?.name}</p>
                              <p className="text-sm text-slate-500">{leave.type} • {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveReject(leave.id, 'Rejected')}
                              className="px-3 py-1.5 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApproveReject(leave.id, 'Approved')}
                              className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                          <span className="font-medium">Reason:</span> {leave.reason}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
