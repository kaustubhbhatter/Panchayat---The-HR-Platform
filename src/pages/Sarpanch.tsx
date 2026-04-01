import React, { useState } from 'react';
import { Calendar as CalendarIcon, Save, Trash2, Plus, Copy, Megaphone, ArrowUpCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const Sarpanch = () => {
  const { settings, updateSettings, holidays, addHoliday, deleteHoliday, adminNotes, addAdminNote, deleteAdminNote, users, updateUser } = useAppContext();
  const { user } = useAuth();
  const [quota, setQuota] = useState(settings.defaultLeaveQuota.toString());
  const [wfhQuota, setWfhQuota] = useState((settings.defaultWfhQuota || 10).toString());
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
  };
  
  const [newNote, setNewNote] = useState({ content: '', expiryDate: '' });
  const [promotion, setPromotion] = useState({ userId: '', newDesignation: '', date: new Date().toISOString().split('T')[0], description: '' });

  const handleSaveSettings = async () => {
    try {
      await updateSettings({ 
        ...settings, 
        defaultLeaveQuota: parseInt(quota) || 0,
        defaultWfhQuota: parseInt(wfhQuota) || 0
      });
      showMessage('Settings saved successfully');
    } catch (err) {
      showError('Failed to save settings');
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.date || !newHoliday.name) return;
    await addHoliday(newHoliday);
    setNewHoliday({ date: '', name: '' });
  };

  const handleDuplicateHolidays = async () => {
    const prevYearHolidays = holidays.filter(h => new Date(h.date).getFullYear() === selectedYear - 1);
    if (prevYearHolidays.length === 0) {
      showError(`No holidays found for ${selectedYear - 1} to duplicate.`);
      return;
    }

    setIsDuplicating(true);
  };

  const confirmDuplicate = async () => {
    const prevYearHolidays = holidays.filter(h => new Date(h.date).getFullYear() === selectedYear - 1);
    setIsDuplicating(false);
    
    try {
      for (const h of prevYearHolidays) {
        const oldDate = new Date(h.date);
        const newDateStr = `${selectedYear}-${String(oldDate.getMonth() + 1).padStart(2, '0')}-${String(oldDate.getDate()).padStart(2, '0')}`;
        
        // Check if holiday already exists on this date
        if (!holidays.some(existing => existing.date === newDateStr)) {
          await addHoliday({ name: h.name, date: newDateStr });
        }
      }
      showMessage('Holidays duplicated successfully!');
    } catch (err) {
      showError('Failed to duplicate holidays');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.content || !newNote.expiryDate || !user) return;
    try {
      await addAdminNote({
        content: newNote.content,
        expiryDate: newNote.expiryDate,
        createdBy: user.id,
        createdAt: new Date().toISOString()
      });
      setNewNote({ content: '', expiryDate: '' });
      showMessage('Announcement posted successfully!');
    } catch (err) {
      showError('Failed to post announcement. Please check permissions.');
    }
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotion.userId || !promotion.newDesignation || !promotion.date) return;
    
    const targetUser = users.find(u => u.id === promotion.userId);
    if (!targetUser) return;

    const newJourneyEvent = {
      id: Date.now().toString(),
      date: promotion.date,
      type: 'Promoted' as const,
      description: promotion.description || `Promoted to ${promotion.newDesignation}`,
      oldDesignation: targetUser.designation,
      newDesignation: promotion.newDesignation
    };

    const updatedJourney = [...(targetUser.journey || []), newJourneyEvent];
    
    try {
      await updateUser(targetUser.id, { 
        designation: promotion.newDesignation,
        journey: updatedJourney
      });
      
      setPromotion({ userId: '', newDesignation: '', date: new Date().toISOString().split('T')[0], description: '' });
      showMessage('Villager promoted successfully!');
    } catch (err) {
      showError('Failed to promote villager');
    }
  };

  const filteredHolidays = holidays.filter(h => new Date(h.date).getFullYear() === selectedYear);
  const availableYears = Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="space-y-8 max-w-4xl relative">
      {message && (
        <div className="fixed top-4 right-4 bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl shadow-lg border border-emerald-100 font-medium z-50 animate-in slide-in-from-top-2">
          {message}
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 bg-rose-50 text-rose-600 px-4 py-3 rounded-xl shadow-lg border border-rose-100 font-medium z-50 animate-in slide-in-from-top-2">
          {error}
        </div>
      )}
      <div>
        <h2 className="text-2xl font-bold text-stone-800">Sarpanch Settings</h2>
        <p className="text-stone-500">Configure global application settings and policies.</p>
      </div>

      {/* Admin Notes */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <Megaphone size={20} className="text-orange-500" />
            Admin Notes
          </h3>
          <p className="text-sm text-stone-500 mt-1">Add notes or announcements for the dashboard.</p>
        </div>
        <div className="p-6 border-b border-stone-50 bg-stone-50/50">
          <form onSubmit={handleAddNote} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Note Content</label>
              <textarea
                required
                value={newNote.content}
                onChange={e => setNewNote({...newNote, content: e.target.value})}
                placeholder="e.g., Office closed for maintenance on Friday"
                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 min-h-[80px]"
              />
            </div>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-stone-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={newNote.expiryDate}
                  onChange={e => setNewNote({...newNote, expiryDate: e.target.value})}
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition-colors"
              >
                <Plus size={20} />
                Add Note
              </button>
            </div>
          </form>
        </div>
        <div className="divide-y divide-stone-100">
          {adminNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(note => (
            <div key={note.id} className="p-4 px-6 flex items-start justify-between hover:bg-stone-50 transition-colors">
              <div>
                <p className="font-bold text-stone-800">{note.content}</p>
                <p className="text-sm text-stone-500">Expires: {new Date(note.expiryDate).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => deleteAdminNote(note.id)}
                className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          {adminNotes.length === 0 && (
            <div className="p-8 text-center text-stone-500">No active admin notes.</div>
          )}
        </div>
      </div>

      {/* Promote User */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <ArrowUpCircle size={20} className="text-emerald-500" />
            Promote Villager
          </h3>
          <p className="text-sm text-stone-500 mt-1">Record a promotion or role change in a villager's journey.</p>
        </div>
        <div className="p-6">
          <form onSubmit={handlePromote} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Select Villager</label>
                <select
                  required
                  value={promotion.userId}
                  onChange={e => setPromotion({...promotion, userId: e.target.value})}
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select...</option>
                  {users.filter(u => u.status === 'Active').map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.designation || u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">New Designation</label>
                <input
                  type="text"
                  required
                  value={promotion.newDesignation}
                  onChange={e => setPromotion({...promotion, newDesignation: e.target.value})}
                  placeholder="e.g., Senior Developer"
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Effective Date</label>
                <input
                  type="date"
                  required
                  value={promotion.date}
                  onChange={e => setPromotion({...promotion, date: e.target.value})}
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={promotion.description}
                  onChange={e => setPromotion({...promotion, description: e.target.value})}
                  placeholder="e.g., Promoted for excellent performance"
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <ArrowUpCircle size={20} />
                Promote
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Leave Policy</h3>
          <p className="text-sm text-slate-500 mt-1">Set the default number of annual leaves for employees.</p>
        </div>
        <div className="p-6 flex items-end gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1">Annual Leave Quota (Days)</label>
            <input
              type="number"
              value={quota}
              onChange={e => setQuota(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1">Annual WFH Quota (Days)</label>
            <input
              type="number"
              value={wfhQuota}
              onChange={e => setWfhQuota(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-2 px-6 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
          >
            <Save size={20} />
            Save Policy
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Public Holidays</h3>
            <p className="text-sm text-slate-500 mt-1">Manage company-wide public holidays.</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={handleDuplicateHolidays}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              title={`Duplicate holidays from ${selectedYear - 1}`}
            >
              <Copy size={16} />
              Copy from {selectedYear - 1}
            </button>
          </div>
        </div>
        
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <form onSubmit={handleAddHoliday} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Holiday Name</label>
              <input
                type="text"
                required
                value={newHoliday.name}
                onChange={e => setNewHoliday({...newHoliday, name: e.target.value})}
                placeholder="e.g., New Year's Day"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={newHoliday.date}
                onChange={e => setNewHoliday({...newHoliday, date: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors"
            >
              <Plus size={20} />
              Add
            </button>
          </form>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredHolidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(holiday => (
            <div key={holiday.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{holiday.name}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteHoliday(holiday.id)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          {filteredHolidays.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No public holidays configured for {selectedYear}.
            </div>
          )}
        </div>
      </div>
      {isDuplicating && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-stone-800 mb-2">Duplicate Holidays</h3>
              <p className="text-sm text-stone-600 mb-6">
                Are you sure you want to duplicate holidays from {selectedYear - 1} to {selectedYear}?
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setIsDuplicating(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDuplicate}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm shadow-orange-600/20"
                >
                  Duplicate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
