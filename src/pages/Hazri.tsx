import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const Hazri = () => {
  const { leaves, addLeave, updateLeave, holidays, settings, users, teams } = useAppContext();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'my-leaves' | 'apply' | 'requests'>('my-leaves');
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Apply leave state
  const [newLeave, setNewLeave] = useState({ startDate: '', endDate: '', type: 'Vacation', reason: '', duration: 'full' as 'full' | 'first_half' | 'second_half' });

  const isManager = users.some(u => u.managerId === user?.id) || 
                    teams.some(t => t.managerIds?.includes(user?.id || '')) ||
                    user?.role === 'Admin' || user?.role === 'Sarpanch' || user?.role === 'HR';
  
  const myLeaves = leaves.filter(l => l.userId === user?.id && new Date(l.startDate).getFullYear() === selectedYear);
  const pendingRequests = leaves.filter(l => {
    if (l.status !== 'Pending') return false;
    if (new Date(l.startDate).getFullYear() !== selectedYear) return false;
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
      duration: newLeave.duration,
      status: 'Pending'
    });
    setNewLeave({ startDate: '', endDate: '', type: 'Vacation', reason: '', duration: 'full' });
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

  const isHoliday = (dateStr: string) => {
    return holidays.some(h => h.date === dateStr);
  };
  
  const isWeekend = (date: Date) => {
    return date.getDay() === 0 || date.getDay() === 6;
  };

  const getHolidayName = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.find(h => h.date === dateStr)?.name;
  };

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  // Calculate working days between two dates
  const calculateWorkingDays = (startDate: string, endDate: string, duration?: 'full' | 'first_half' | 'second_half') => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    
    let current = new Date(start);
    while (current <= end) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      if (current.getDay() !== 0 && !isHoliday(dateStr)) {
        let dayValue = 1;
        if (current.getDay() === 6) {
          dayValue = 0.5; // Saturday is half day
        }
        if (duration === 'first_half' || duration === 'second_half') {
          dayValue = dayValue * 0.5;
        }
        workingDays += dayValue;
      }
      current.setDate(current.getDate() + 1);
    }
    return workingDays;
  };

  const approvedLeavesDays = useMemo(() => {
    return myLeaves
      .filter(l => l.status === 'Approved' && l.type !== 'Work From Home')
      .reduce((total, l) => total + calculateWorkingDays(l.startDate, l.endDate, l.duration), 0);
  }, [myLeaves, holidays]);

  const approvedWfhDays = useMemo(() => {
    return myLeaves
      .filter(l => l.status === 'Approved' && l.type === 'Work From Home')
      .reduce((total, l) => total + calculateWorkingDays(l.startDate, l.endDate, l.duration), 0);
  }, [myLeaves, holidays]);

  const availableYears = Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i);

  const currentUserData = users.find(u => u.id === user?.id);
  const creditedLeaves = currentUserData?.creditedLeaves || 0;
  const totalLeaveQuota = settings.defaultLeaveQuota + creditedLeaves;
  const totalWfhQuota = currentUserData?.wfhQuota ?? settings.defaultWfhQuota ?? 10;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Attendance & Leaves</h2>
          <p className="text-slate-500">Manage your time off and view team availability.</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Calendar & Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Leave Balance ({selectedYear})</h3>
            <div className="flex items-center justify-between p-4 bg-violet-50 rounded-xl border border-violet-100 mb-3">
              <div>
                <p className="text-sm text-violet-600 font-medium">Available</p>
                <p className="text-3xl font-black text-violet-700">{Math.max(0, totalLeaveQuota - approvedLeavesDays)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 font-medium">Used</p>
                <p className="text-xl font-bold text-slate-700">{approvedLeavesDays}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">Out of {totalLeaveQuota} annual days {creditedLeaves > 0 ? `(${settings.defaultLeaveQuota} + ${creditedLeaves} credited)` : ''}</p>
            
            {currentUserData?.wfhEnabled && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-700 mb-3">Work From Home (WFH)</h4>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Available</p>
                    <p className="text-2xl font-black text-emerald-700">{Math.max(0, totalWfhQuota - approvedWfhDays)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">Used</p>
                    <p className="text-lg font-bold text-slate-700">{approvedWfhDays}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">Out of {totalWfhQuota} WFH days</p>
              </div>
            )}
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
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const holiday = isHoliday(dateStr);
                  const weekend = isWeekend(new Date(year, month, d));
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
              <h3 className="text-lg font-bold text-slate-800 mb-6">Leave History ({selectedYear})</h3>
              <div className="space-y-4">
                {myLeaves.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 rounded-xl">
                    No leaves requested in {selectedYear}.
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
                            <span className="ml-2 text-xs text-slate-400">({calculateWorkingDays(leave.startDate, leave.endDate)} days)</span>
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
                    {currentUserData?.wfhEnabled && <option>Work From Home</option>}
                    <option>Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                    <select
                      value={newLeave.duration}
                      onChange={e => setNewLeave({...newLeave, duration: e.target.value as any})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 bg-white"
                    >
                      <option value="full">Full Day</option>
                      <option value="first_half">First Half</option>
                      <option value="second_half">Second Half</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={newLeave.startDate}
                      onChange={e => {
                        const newStart = e.target.value;
                        setNewLeave(prev => ({
                          ...prev, 
                          startDate: newStart,
                          endDate: prev.duration !== 'full' ? newStart : prev.endDate
                        }));
                      }}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      disabled={newLeave.duration !== 'full'}
                      value={newLeave.duration !== 'full' ? newLeave.startDate : newLeave.endDate}
                      onChange={e => setNewLeave({...newLeave, endDate: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                </div>
                {newLeave.startDate && newLeave.endDate && (
                  <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    This request is for <span className="font-bold">{calculateWorkingDays(newLeave.startDate, newLeave.endDate)}</span> working days.
                  </div>
                )}
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
              <h3 className="text-lg font-bold text-slate-800 mb-6">Leave Center ({selectedYear})</h3>
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 border border-dashed border-slate-200 rounded-xl">
                    No pending leave requests to review for {selectedYear}.
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
                              <p className="text-sm text-slate-500">{leave.type} • {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()} ({calculateWorkingDays(leave.startDate, leave.endDate)} days)</p>
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
