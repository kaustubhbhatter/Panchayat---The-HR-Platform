import React, { useState } from 'react';
import { useAppContext, Team } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Users as UsersIcon, Edit2 } from 'lucide-react';

export const Teams = () => {
  const { teams, users, addTeam } = useAppContext();
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Sabha - Teams</h1>
          <p className="text-slate-500 font-medium mt-1">Organize your company into functional groups.</p>
        </div>
        {currentUser?.role === 'Admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm shadow-rose-500/20"
          >
            <Plus size={18} />
            Create Team
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => {
          const managers = users.filter(u => team.managerIds?.includes(u.id));
          const members = users.filter(u => u.teamIds?.includes(team.id));

          return (
            <div 
              key={team.id} 
              onClick={() => setSelectedTeam(team)}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow group cursor-pointer"
            >
              <div className="h-32 w-full relative">
                <img src={team.coverImage} alt={team.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                <h3 className="absolute bottom-4 left-6 text-xl font-black text-white">{team.name}</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 h-10">{team.description}</p>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3">
                    {managers.length > 0 ? (
                      <div className="flex -space-x-2">
                        {managers.slice(0, 3).map(m => (
                          <img key={m.id} src={m.avatar} alt={m.name} title={m.name} className="w-8 h-8 rounded-full object-cover border-2 border-white" />
                        ))}
                        {managers.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                            +{managers.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 font-medium italic">No managers</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                    <UsersIcon size={14} />
                    <span className="text-xs font-bold">{members.length}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && <TeamModal onClose={() => setIsModalOpen(false)} />}
      {selectedTeam && <TeamDetailsModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />}
    </div>
  );
};

const TeamModal = ({ team, onClose }: { team?: Team, onClose: () => void }) => {
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
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
          'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
          'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80',
          'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80'
        ];
        const randomImage = images[Math.floor(Math.random() * images.length)];
        await addTeam({
          ...formData,
          coverImage: randomImage
        });
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleManagerToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      managerIds: prev.managerIds.includes(userId)
        ? prev.managerIds.filter(id => id !== userId)
        : [...prev.managerIds, userId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">{team ? 'Edit Team' : 'Create New Team'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Team Name</label>
            <input
              required
              type="text"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
            <textarea
              required
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Assign Managers</label>
            <div className="space-y-2 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
              {users.map(u => (
                <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.managerIds.includes(u.id)}
                    onChange={() => handleManagerToggle(u.id)}
                    className="w-4 h-4 text-rose-500 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <span className="text-sm text-slate-700">{u.name} ({u.role})</span>
                </label>
              ))}
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors shadow-sm shadow-rose-500/20 disabled:opacity-50">
              {loading ? 'Saving...' : (team ? 'Save Changes' : 'Create Team')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TeamDetailsModal = ({ team, onClose }: { team: Team, onClose: () => void }) => {
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
            {currentUser?.role === 'Admin' && (
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
