import React from 'react';
import { useAppContext, User } from '../context/AppContext';

export const Hierarchy = () => {
  const { users, teams } = useAppContext();

  // Find root nodes (users without a manager)
  const rootUsers = users.filter(u => !u.managerId);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 overflow-x-auto">
      <h2 className="text-xl font-black text-stone-800 mb-6">Panchayat Hierarchy</h2>
      <div className="min-w-max">
        {rootUsers.map(user => (
          <TreeNode key={user.id} user={user} users={users} teams={teams} level={0} />
        ))}
      </div>
    </div>
  );
};

interface TreeNodeProps {
  key?: string | number;
  user: User;
  users: User[];
  teams: any[];
  level: number;
}

const TreeNode = ({ user, users, teams, level }: TreeNodeProps) => {
  const directReports = users.filter(u => u.managerId === user.id);
  const userTeams = teams.filter(t => user.teamIds?.includes(t.id));

  return (
    <div className="relative ml-8">
      {/* Horizontal line to this node */}
      {level > 0 && (
        <div className="absolute -left-8 top-6 w-8 h-px bg-stone-300"></div>
      )}
      
      <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 p-3 rounded-2xl w-64 shadow-sm relative z-10 my-2">
        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-stone-200" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-stone-800 truncate">{user.name}</h4>
          <p className="text-xs font-medium text-orange-600 truncate">{user.designation || user.role}</p>
          {userTeams.length > 0 && (
            <p className="text-[10px] text-stone-500 mt-0.5 truncate">
              {userTeams.map(t => t.name).join(', ')}
            </p>
          )}
        </div>
      </div>

      {directReports.length > 0 && (
        <div className="relative">
          {/* Vertical line connecting children */}
          <div className="absolute left-4 top-0 w-px h-[calc(100%-24px)] bg-stone-300 z-0"></div>
          <div className="pl-4">
            {directReports.map(report => (
              <TreeNode key={report.id} user={report} users={users} teams={teams} level={level + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
