import React, { useState } from 'react';
import { Users } from './Users';
import { Teams } from './Teams';

export const Sabha = () => {
  const [activeTab, setActiveTab] = useState<'directory' | 'teams'>('directory');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 text-sm font-bold transition-colors relative ${
            activeTab === 'directory' ? 'text-violet-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Directory
          {activeTab === 'directory' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 rounded-t-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`pb-3 text-sm font-bold transition-colors relative ${
            activeTab === 'teams' ? 'text-violet-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Teams
          {activeTab === 'teams' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 rounded-t-full"></span>
          )}
        </button>
      </div>

      {activeTab === 'directory' ? <Users /> : <Teams />}
    </div>
  );
};
