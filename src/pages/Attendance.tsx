import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const Attendance = () => {
  const { leaves, addLeave, updateLeave, holidays, settings, users, teams } = useAppContext();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'my-leaves' | 'apply' | 'requests'>('my-leaves');
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Apply leave state
  const [newLeave, setNewLeave] = useState({ startDate: '', endDate: '', type: 'Vacation', reason: '', isHalfDay: false });
  const [showOptionalConfirm, setShowOptionalConfirm] = useState<{ show: boolean; holiday?: any }>({ show: false });

  const isManager = users.some(u => u.managerId === user?.id) || 
                    teams.some(t => t.managerIds?.includes(user?.id || '')) ||
                    user?.role === 'Admin' || user?.role === 'Sarpanch';
  
  const myLeaves = leaves.filter(l => l.userId === user?.id && new Date(l.startDate).getFullYear() === selectedYear);
  const pendingRequests = leaves.filter(l => {
    if (l.status !== 'Pending') return false;
    if (new Date(l.startDate).getFullYear() !== selectedYear) return false;
    
    // Admins see all requests
    if (user?.role === 'Admin' || user?.role === 'Sarpanch') return true;
    
    // Check if current user is the manager of the requester
    if (l.managerId === user?.id) return true;
    
    // Fallback for older leaves or team-based management
    const requestor = users.find(u => u.id === l.userId);
    if (!requestor) return false;
    if (requestor.managerId === user?.id) return true;
    
    const requestorTeams = teams.filter(t => requestor.teamIds?.includes(t.id));
    return requestorTeams.some(t => t.managerIds?.includes(user?.id || ''));
  });

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeave.startDate || !newLeave.endDate) return;

    // Check for optional holiday
    const start = new Date(newLeave.startDate);
    const end = new Date(newLeave.endDate);
    let current = new Date(start);
    let optionalHolidayFound = null;

    while (current <= end) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const holiday = holidays.find(h => h.date === dateStr && h.type === 'Optional');
      if (holiday) {
        optionalHolidayFound = holiday;
        break;
      }
      current.setDate(current.getDate() + 1);
    }

    if (optionalHolidayFound) {
      // Check if already taken an optional holiday this year
      const alreadyTaken = myLeaves.some(l => l.type.startsWith('Optional Holiday') && l.status !== 'Rejected');
      if (alreadyTaken) {
        alert("You have already used your optional holiday for this year.");
        return;
      }
      setShowOptionalConfirm({ show: true, holiday: optionalHolidayFound });
      return;
    }

    await submitLeaveRequest(newLeave.type, newLeave.reason, newLeave.startDate, newLeave.endDate, newLeave.isHalfDay);
  };

  const submitLeaveRequest = async (type: string, reason: string, startDate: string, endDate: string, isHalfDay: boolean) => {
    await addLeave({
      userId: user!.id,
      userName: user!.name,
      managerId: user!.managerId || null,
      startDate,
      endDate,
      type,
      reason,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      isHalfDay
    });
    setNewLeave({ startDate: '', endDate: '', type: 'Vacation', reason: '', isHalfDay: false });
    setActiveTab('my-leaves');
    setShowOptionalConfirm({ show: false });
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
    return holidays.find(h => h.date === dateStr);
  };
  
  const isWeekend = (date: Date) => {
    return date.getDay() === 0; // Only Sunday is a full weekend
  };

  const getHolidayName = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.find(h => h.date === dateStr)?.name;
  };

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  // Calculate working days between two dates
  const calculateWorkingDays = (startDate: string, endDate: string, isHalfDay?: boolean, type?: string) => {
    if (type?.startsWith('Optional Holiday')) return 0;
    if (isHalfDay) return 0.5;

    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    
    let current = new Date(start);
    while (current <= end) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const holiday = isHoliday(dateStr);
      if (!isWeekend(current) && (!holiday || holiday.type === 'Optional')) {
        if (current.getDay() === 6) {
          workingDays += 0.5; // Saturday is half day
        } else {
          workingDays += 1;
        }
      }
      current.setDate(current.getDate() + 1);
    }
    return workingDays;
  };

  const approvedLeavesDays = useMemo(() => {
    return myLeaves
      .filter(l => l.status === 'Approved' && l.type !== 'Work From Home' && !l.type.startsWith('Optional Holiday'))
      .reduce((total, l) => total + calculateWorkingDays(l.startDate, l.endDate, l.isHalfDay, l.type), 0);
  }, [myLeaves, holidays]);

  const approvedWfhDays = useMemo(() => {
    return myLeaves
      .filter(l => l.status === 'Approved' && l.type === 'Work From Home')
      .reduce((total, l) => total + calculateWorkingDays(l.startDate, l.endDate, l.isHalfDay), 0);
  }, [myLeaves, holidays]);

  const availableYears = Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i);

  const currentUserData = users.find(u => u.id === user?.id);
  const creditedLeaves = currentUserData?.creditedLeaves || 0;
  const totalLeaveQuota = settings.defaultLeaveQuota + creditedLeaves;
  const totalWfhQuota = settings.defaultWfhQuota || 10;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hazri (Attendance & Leaves)</h2>
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
                  const myLeave = myLeaves.some(l => l.status === 'Approved' && new Date(l.startDate) <= new Date(dateStr) && new Date(l.endDate) >= new Date(dateStr));
                  const weekend = isWeekend(new Date(year, month, d));
                  return (
                    <div 
                      key={d} 
                      title={holiday ? holiday.name : myLeave ? 'My Leave' : ''}
                      className={`h-8 flex items-center justify-center rounded-lg text-sm font-medium cursor-default
                        ${holiday ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' : 
                          myLeave ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' :
                          weekend ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-4 text-xs text-slate-500 justify-center">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-100 rounded border border-amber-200"></div> Holiday</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 rounded border border-blue-200"></div> My Leave</div>
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
                            <span className="ml-2 text-xs text-slate-400">({calculateWorkingDays(leave.startDate, leave.endDate, leave.isHalfDay, leave.type)} days)</span>
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
              
              {showOptionalConfirm.show && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <h4 className="font-bold text-amber-800 mb-2">Optional Holiday Detected</h4>
                  <p className="text-sm text-amber-700 mb-4">
                    The date you selected coincides with the optional holiday: <span className="font-bold">{showOptionalConfirm.holiday?.name}</span>. 
                    Would you like to mark this as your optional holiday? This will not be deducted from your leave balance.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => submitLeaveRequest(`Optional Holiday - ${showOptionalConfirm.holiday?.name}`, newLeave.reason, newLeave.startDate, newLeave.endDate, newLeave.isHalfDay)}
                      className="px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition-colors"
                    >
                      Yes, use Optional Holiday
                    </button>
                    <button
                      onClick={() => submitLeaveRequest(newLeave.type, newLeave.reason, newLeave.startDate, newLeave.endDate, newLeave.isHalfDay)}
                      className="px-4 py-2 bg-white border border-amber-200 text-amber-700 text-sm font-bold rounded-xl hover:bg-amber-50 transition-colors"
                    >
                      No, use regular {newLeave.type}
                    </button>
                    <button
                      onClick={() => setShowOptionalConfirm({ show: false })}
                      className="px-4 py-2 text-stone-400 text-sm font-medium hover:text-stone-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

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
                  {newLeave.isHalfDay ? (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={newLeave.startDate}
                        onChange={e => setNewLeave({...newLeave, startDate: e.target.value, endDate: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="isHalfDay"
                    checked={newLeave.isHalfDay}
                    onChange={e => {
                      const isHalfDay = e.target.checked;
                      setNewLeave(prev => ({
                        ...prev,
                        isHalfDay,
                        endDate: isHalfDay ? prev.startDate : prev.endDate
                      }));
                    }}
                    className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                  />
                  <label htmlFor="isHalfDay" className="text-sm text-slate-700 font-medium">
                    This is a half-day leave
                  </label>
                </div>

                {newLeave.startDate && newLeave.endDate && (
                  <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    This request is for <span className="font-bold">{calculateWorkingDays(newLeave.startDate, newLeave.endDate, newLeave.isHalfDay, newLeave.type)}</span> working days.
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
                              <p className="text-sm text-slate-500">{leave.type} • {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()} ({calculateWorkingDays(leave.startDate, leave.endDate, leave.isHalfDay, leave.type)} days)</p>
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
