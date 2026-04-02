import React, { useState } from 'react';
import { useAppContext, Team } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Users as UsersIcon, Edit2 } from 'lucide-react';

import { TeamModal, TeamDetailsModal } from '../components/TeamModals';

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
        {(currentUser?.role === 'Admin' || currentUser?.role === 'Sarpanch') && (
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
