import React, { useState } from 'react';
import { useAppContext, Team } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Users as UsersIcon, Edit2 } from 'lucide-react';

export const TeamModal = ({ team, onClose }: { team?: Team, onClose: () => void }) => {
  const { addTeam, updateTeam, users } = useAppContext();
  const [formData, setFormData] = useState({
    name: team?.name || '',
    description: team?.description || '',
    managerIds: team?.managerIds || []
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (team) {
        await updateTeam(team.id, formData);
      } else {
        const images = [
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800'
        ];
        const coverImage = images[Math.floor(Math.random() * images.length)];
        await addTeam({ ...formData, coverImage });
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{team ? 'Edit Team' : 'Create New Team'}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Team Name</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                placeholder="e.g., Engineering, Marketing"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none"
                placeholder="What does this team do?"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Assign Managers</label>
              <div className="max-h-40 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                {users.filter(u => u.status === 'Active').map(u => (
                  <label key={u.id} className="flex items-center gap-3 cursor-pointer hover:bg-white p-1.5 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.managerIds.includes(u.id)}
                      onChange={e => {
                        const newIds = e.target.checked 
                          ? [...formData.managerIds, u.id]
                          : formData.managerIds.filter(id => id !== u.id);
                        setFormData({...formData, managerIds: newIds});
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
                    />
                    <span className="text-sm text-slate-700">{u.name} ({u.role})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : team ? 'Update Team' : 'Create Team'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const TeamDetailsModal = ({ team, onClose }: { team: Team, onClose: () => void }) => {
  const { users } = useAppContext();
  const { user: currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const members = users.filter(u => u.teamIds?.includes(team.id));
  const managers = users.filter(u => team.managerIds?.includes(u.id));

  if (isEditing) {
    return <TeamModal team={team} onClose={() => setIsEditing(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="h-48 w-full relative shrink-0">
          <img src={team.coverImage} alt={team.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 backdrop-blur-sm transition-all">✕</button>
          <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-black text-white">{team.name}</h2>
              <p className="text-white/80 mt-1">{team.description}</p>
            </div>
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Sarpanch') && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-xl font-medium transition-colors"
              >
                <Edit2 size={16} />
                Edit Team
              </button>
            )}
          </div>
        </div>
        
        <div className="p-8 overflow-y-auto">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              Managers <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-sm">{managers.length}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {managers.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                  <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.role}</p>
                  </div>
                </div>
              ))}
              {managers.length === 0 && <p className="text-sm text-slate-500 italic">No managers assigned.</p>}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              Team Members <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-sm">{members.length}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                  <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.role}</p>
                  </div>
                </div>
              ))}
              {members.length === 0 && <p className="text-sm text-slate-500 italic">No members in this team.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
