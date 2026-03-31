import React, { useState } from 'react';
import { Calendar as CalendarIcon, Save, Trash2, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const Admin = () => {
  const { settings, updateSettings, holidays, addHoliday, deleteHoliday } = useAppContext();
  const [quota, setQuota] = useState(settings.defaultLeaveQuota.toString());
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });

  const handleSaveSettings = async () => {
    await updateSettings({ ...settings, defaultLeaveQuota: parseInt(quota) || 0 });
    alert('Settings saved successfully');
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.date || !newHoliday.name) return;
    await addHoliday(newHoliday);
    setNewHoliday({ date: '', name: '' });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Admin Settings</h2>
        <p className="text-slate-500">Configure global application settings and policies.</p>
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
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Public Holidays</h3>
          <p className="text-sm text-slate-500 mt-1">Manage company-wide public holidays.</p>
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
          {holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(holiday => (
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
          {holidays.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No public holidays configured yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
