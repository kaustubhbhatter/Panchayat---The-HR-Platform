import React, { useState, useMemo } from 'react';
import { useAppContext, Goal, KeyResult, Initiative, KRCheckIn, User } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Target, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User as UserIcon,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  PieChart as PieChartIcon,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import ReactMarkdown from 'react-markdown';

const Lakshya: React.FC = () => {
  const { 
    goals, 
    keyResults, 
    initiatives, 
    users, 
    addGoal, 
    updateGoal, 
    deleteGoal,
    addKeyResult,
    updateKeyResult,
    deleteKeyResult,
    addKRCheckIn,
    addInitiative,
    updateInitiative,
    deleteInitiative
  } = useAppContext();
  const { user: currentUser } = useAuth();
  const isAdmin = users.find(u => u.email === currentUser?.email)?.role === 'Admin' || users.find(u => u.email === currentUser?.email)?.role === 'Sarpanch';

  const [selectedFilter, setSelectedFilter] = useState<string>('Current');

  const currentQuarterStr = useMemo(() => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return `${now.getFullYear()}-Q${quarter}`;
  }, []);

  const getQuartersForFilter = (filter: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQ = Math.floor(now.getMonth() / 3) + 1;
    
    const getQStr = (year: number, q: number) => {
      let y = year;
      let quarter = q;
      while (quarter > 4) { y++; quarter -= 4; }
      while (quarter < 1) { y--; quarter += 4; }
      return `${y}-Q${quarter}`;
    };

    switch (filter) {
      case 'Current':
        return [getQStr(currentYear, currentQ)];
      case 'Upcoming':
        return [getQStr(currentYear, currentQ + 1)];
      case 'Past Year':
        return [
          getQStr(currentYear, currentQ - 1),
          getQStr(currentYear, currentQ - 2),
          getQStr(currentYear, currentQ - 3),
          getQStr(currentYear, currentQ - 4),
        ];
      case 'Future':
        return [
          getQStr(currentYear, currentQ + 1),
          getQStr(currentYear, currentQ + 2),
          getQStr(currentYear, currentQ + 3),
          getQStr(currentYear, currentQ + 4),
        ];
      case 'History':
        return []; // Special case
      default:
        return [getQStr(currentYear, currentQ)];
    }
  };

  const filteredGoals = useMemo(() => {
    if (selectedFilter === 'History') {
      return goals.filter(g => g.quarter < currentQuarterStr).sort((a, b) => b.quarter.localeCompare(a.quarter));
    }
    const targetQuarters = getQuartersForFilter(selectedFilter);
    return goals.filter(g => targetQuarters.includes(g.quarter)).sort((a, b) => b.quarter.localeCompare(a.quarter));
  }, [goals, selectedFilter, currentQuarterStr]);

  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [isAddKRModalOpen, setIsAddKRModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isAddInitiativeModalOpen, setIsAddInitiativeModalOpen] = useState(false);
  
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingKR, setEditingKR] = useState<KeyResult | null>(null);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedKRId, setSelectedKRId] = useState<string | null>(null);

  const [expandedGoals, setExpandedGoals] = useState<string[]>([]);
  const [expandedKRs, setExpandedKRs] = useState<string[]>([]);

  const [activePicker, setActivePicker] = useState<{ type: 'status' | 'date' | 'owner', id: string } | null>(null);
  const [userSearch, setUserSearch] = useState('');

  const commentRef = React.useRef<HTMLTextAreaElement>(null);

  const toggleGoal = (id: string) => {
    setExpandedGoals(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleKR = (id: string) => {
    setExpandedKRs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track': return 'text-green-600 bg-green-50 border-green-200';
      case 'Behind': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'At Risk': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getInitiativeStatusIcon = (status: string) => {
    let progress = 0;
    let color = '#94a3b8'; // Default grey

    switch (status) {
      case 'Completed':
        progress = 100;
        color = '#10b981'; // Green
        break;
      case 'In Progress':
        progress = 50;
        color = '#f97316'; // Orange
        break;
      case 'Dropped':
        progress = 0;
        color = '#ef4444'; // Red
        break;
      case 'Not Picked':
      default:
        progress = 0;
        color = '#94a3b8'; // Grey
        break;
    }

    const data = [
      { name: 'Progress', value: progress },
      { name: 'Remaining', value: 100 - progress }
    ];

    if (status === 'Completed') {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }

    return (
      <div className="w-5 h-5">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={0}
              outerRadius={10}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              <Cell fill={color} />
              <Cell fill="#e2e8f0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const calculateGoalProgress = (goalId: string) => {
    const krs = keyResults.filter(kr => kr.goalId === goalId);
    if (krs.length === 0) return 0;
    const totalProgress = krs.reduce((acc, kr) => acc + (kr.currentValue / kr.targetValue), 0);
    return Math.round((totalProgress / krs.length) * 100);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-stone-800 flex items-center gap-2">
            <Target className="w-8 h-8 text-orange-500" />
            Lakshya
          </h1>
          <p className="text-stone-500 font-medium">Quarterly Goals & Key Results</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="Current">Current</option>
            <option value="Past Year">Past Year</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Future">Future</option>
            <option value="History">History</option>
          </select>
          
          {isAdmin && (
            <button 
              onClick={() => setIsAddGoalModalOpen(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filteredGoals.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-200 rounded-3xl p-12 text-center">
            <Target className="w-12 h-12 text-stone-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-stone-800">No goals found</h3>
            <p className="text-stone-500 mb-6 font-medium">Start by creating a new goal for the current quarter</p>
            {isAdmin && (
              <button 
                onClick={() => setIsAddGoalModalOpen(true)}
                className="inline-flex items-center gap-2 text-orange-500 font-bold hover:text-orange-600"
              >
                <Plus className="w-4 h-4" />
                Create Goal
              </button>
            )}
          </div>
        ) : (
          filteredGoals.map(goal => {
            const goalProgress = calculateGoalProgress(goal.id);
            const isExpanded = expandedGoals.includes(goal.id);
            const goalKRs = keyResults.filter(kr => kr.goalId === goal.id);

            return (
              <div key={goal.id} className="bg-white border border-stone-100 rounded-3xl overflow-hidden shadow-sm">
                <div 
                  className="p-5 flex items-center gap-4 cursor-pointer hover:bg-stone-50/50 transition-colors"
                  onClick={() => toggleGoal(goal.id)}
                >
                  <div className="p-3 bg-orange-50 rounded-2xl">
                    <Target className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-stone-800">{goal.title} <span className="text-xs font-bold text-stone-400 ml-2">({goal.quarter})</span></h3>
                    <p className="text-sm text-stone-500 font-medium">{goal.description}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end gap-1">
                      <div className="w-48 h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 transition-all duration-500"
                          style={{ width: `${goalProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-orange-500">{goalProgress}% Complete</span>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGoal(goal);
                            setIsAddGoalModalOpen(true);
                          }}
                          className="p-2 hover:bg-stone-100 rounded-xl text-stone-400 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this goal?')) {
                              deleteGoal(goal.id);
                            }
                          }}
                          className="p-2 hover:bg-rose-50 rounded-xl text-stone-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronRight className="w-5 h-5 text-stone-400" />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-stone-100"
                    >
                      <div className="p-6 space-y-4 bg-stone-50/30">
                        {goalKRs.map(kr => {
                          const krProgress = Math.round((kr.currentValue / kr.targetValue) * 100);
                          const isKRExpanded = expandedKRs.includes(kr.id);
                          const krInitiatives = initiatives.filter(i => i.krId === kr.id);
                          const owner = users.find(u => u.id === kr.ownerId || u.email === kr.ownerId);

                          return (
                            <div key={kr.id} className="bg-white border border-stone-100 rounded-2xl shadow-sm">
                              <div className="p-4 flex items-center gap-4">
                                <div className="flex items-center gap-2 flex-1">
                                  <button 
                                    onClick={() => toggleKR(kr.id)}
                                    className="p-1.5 hover:bg-stone-100 rounded-xl transition-colors"
                                  >
                                    {isKRExpanded ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronRight className="w-4 h-4 text-stone-400" />}
                                  </button>
                                  <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 font-black text-xs">
                                    {owner?.name.split(' ').map(n => n[0]).join('') || 'KR'}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-stone-800">{kr.title}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${getStatusColor(kr.status)}`}>
                                        {kr.status}
                                      </span>
                                      <span className="text-[11px] text-stone-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                                        <UserIcon className="w-3 h-3" />
                                        {owner?.name || 'Unassigned'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-6">
                                  <button 
                                    onClick={() => {
                                      setSelectedKRId(kr.id);
                                      setIsCheckInModalOpen(true);
                                    }}
                                    className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                                  >
                                    Check-in
                                  </button>
                                  
                                  <div className="text-right">
                                    <div className="text-xs font-black text-stone-800">
                                      {kr.unit}{kr.currentValue.toLocaleString()} / {kr.unit}{kr.targetValue.toLocaleString()}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-orange-500"
                                          style={{ width: `${krProgress}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-black text-orange-500">{krProgress}%</span>
                                    </div>
                                  </div>

                                  {isAdmin && (
                                    <div className="flex items-center gap-1">
                                      <button 
                                        onClick={() => {
                                          setEditingKR(kr);
                                          setSelectedGoalId(goal.id);
                                          setIsAddKRModalOpen(true);
                                        }}
                                        className="p-2 hover:bg-stone-50 rounded-xl text-stone-400 transition-colors"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => {
                                          if (window.confirm('Are you sure you want to delete this KR?')) {
                                            deleteKeyResult(kr.id);
                                          }
                                        }}
                                        className="p-2 hover:bg-rose-50 rounded-xl text-stone-400 hover:text-rose-500 transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {isKRExpanded && (
                                <div className="border-t border-stone-100 p-5 bg-stone-50/20">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="text-stone-400 text-left border-b border-stone-100">
                                        <th className="pb-3 font-bold uppercase text-[10px] tracking-widest w-[45%]">Initiative</th>
                                        <th className="pb-3 font-bold uppercase text-[10px] tracking-widest">Due on</th>
                                        <th className="pb-3 font-bold uppercase text-[10px] tracking-widest">Status</th>
                                        <th className="pb-3 font-bold uppercase text-[10px] tracking-widest">Owner</th>
                                        <th className="pb-3 font-bold uppercase text-[10px] tracking-widest"></th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-50">
                                      {krInitiatives
                                        .sort((a, b) => {
                                          if (a.status === 'Completed' && b.status !== 'Completed') return 1;
                                          if (a.status !== 'Completed' && b.status === 'Completed') return -1;
                                          return 0;
                                        })
                                        .map(initiative => {
                                          const iOwner = users.find(u => u.id === initiative.ownerId || u.email === initiative.ownerId);
                                          const isCompleted = initiative.status === 'Completed';
                                          return (
                                            <tr key={initiative.id} className={`group ${isCompleted ? 'opacity-50 grayscale' : ''}`}>
                                              <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                  <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded-lg border-stone-200 text-orange-500 focus:ring-orange-500 cursor-pointer" 
                                                    checked={isCompleted} 
                                                    onChange={async (e) => {
                                                      await updateInitiative(initiative.id, { 
                                                        status: e.target.checked ? 'Completed' : 'In Progress' 
                                                      });
                                                    }}
                                                  />
                                                  <span className={`text-stone-800 font-bold ${isCompleted ? 'line-through' : ''}`}>{initiative.title}</span>
                                                </div>
                                              </td>
                                              <td className="py-4 relative">
                                                <div 
                                                  onClick={() => setActivePicker({ type: 'date', id: initiative.id })}
                                                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-stone-100 cursor-pointer transition-all w-fit group/date"
                                                >
                                                  <Calendar className="w-3.5 h-3.5 text-stone-400 group-hover/date:text-orange-500" />
                                                  <span className="text-stone-600 font-bold text-xs">
                                                    {initiative.dueDate ? new Date(initiative.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Set date'}
                                                  </span>
                                                </div>
                                                <AnimatePresence>
                                                  {activePicker?.type === 'date' && activePicker.id === initiative.id && (
                                                    <>
                                                      <div className="fixed inset-0 z-20" onClick={() => setActivePicker(null)} />
                                                      <motion.div 
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute top-full left-0 mt-2 z-30 bg-white rounded-2xl shadow-2xl border border-stone-100 p-4 min-w-[200px]"
                                                      >
                                                        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Due Date</label>
                                                        <input 
                                                          type="date" 
                                                          autoFocus
                                                          value={initiative.dueDate || ''} 
                                                          onChange={(e) => {
                                                            updateInitiative(initiative.id, { dueDate: e.target.value });
                                                            setActivePicker(null);
                                                          }}
                                                          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-700 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                                        />
                                                      </motion.div>
                                                    </>
                                                  )}
                                                </AnimatePresence>
                                              </td>
                                              <td className="py-4 relative">
                                                <div 
                                                  onClick={() => setActivePicker({ type: 'status', id: initiative.id })}
                                                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-stone-100 cursor-pointer transition-all w-fit"
                                                >
                                                  {getInitiativeStatusIcon(initiative.status)}
                                                  <span className="text-stone-600 font-bold text-xs">{initiative.status}</span>
                                                </div>
                                                <AnimatePresence>
                                                  {activePicker?.type === 'status' && activePicker.id === initiative.id && (
                                                    <>
                                                      <div className="fixed inset-0 z-20" onClick={() => setActivePicker(null)} />
                                                      <motion.div 
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute top-full left-0 mt-2 z-30 bg-white rounded-2xl shadow-2xl border border-stone-100 p-2 min-w-[160px]"
                                                      >
                                                        <div className="space-y-1">
                                                          {['Not Picked', 'In Progress', 'Completed', 'Dropped'].map(s => (
                                                            <button
                                                              key={s}
                                                              onClick={() => {
                                                                updateInitiative(initiative.id, { status: s as any });
                                                                setActivePicker(null);
                                                              }}
                                                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2
                                                                ${initiative.status === s ? 'bg-orange-50 text-orange-600' : 'text-stone-600 hover:bg-stone-50'}`}
                                                            >
                                                              {getInitiativeStatusIcon(s)}
                                                              {s}
                                                            </button>
                                                          ))}
                                                        </div>
                                                      </motion.div>
                                                    </>
                                                  )}
                                                </AnimatePresence>
                                              </td>
                                              <td className="py-4 relative">
                                                <div 
                                                  onClick={() => {
                                                    setActivePicker({ type: 'owner', id: initiative.id });
                                                    setUserSearch('');
                                                  }}
                                                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-stone-100 cursor-pointer transition-all w-fit"
                                                >
                                                  <div className="w-7 h-7 bg-orange-50 rounded-xl flex items-center justify-center text-orange-700 font-black text-[10px] border border-orange-100">
                                                    {iOwner?.name.split(' ').map(n => n[0]).join('') || '??'}
                                                  </div>
                                                  <span className="text-stone-600 font-bold text-xs">{iOwner?.name || 'Unassigned'}</span>
                                                </div>
                                                <AnimatePresence>
                                                  {activePicker?.type === 'owner' && activePicker.id === initiative.id && (
                                                    <>
                                                      <div className="fixed inset-0 z-20" onClick={() => setActivePicker(null)} />
                                                      <motion.div 
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                        className="absolute top-full left-0 mt-2 z-30 bg-white rounded-2xl shadow-2xl border border-stone-100 p-3 min-w-[240px]"
                                                      >
                                                        <div className="relative mb-3">
                                                          <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                                                          <input 
                                                            autoFocus
                                                            type="text"
                                                            placeholder="Search employee..."
                                                            value={userSearch}
                                                            onChange={(e) => setUserSearch(e.target.value)}
                                                            className="w-full bg-stone-50 border border-stone-100 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-stone-700 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                                          />
                                                        </div>
                                                        <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                                          {users
                                                            .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                                                            .map(u => (
                                                              <button
                                                                key={u.id}
                                                                onClick={() => {
                                                                  updateInitiative(initiative.id, { ownerId: u.email });
                                                                  setActivePicker(null);
                                                                }}
                                                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-3
                                                                  ${initiative.ownerId === u.email ? 'bg-orange-50 text-orange-600' : 'text-stone-600 hover:bg-stone-50'}`}
                                                              >
                                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black
                                                                  ${initiative.ownerId === u.email ? 'bg-orange-100 text-orange-700' : 'bg-stone-100 text-stone-500'}`}>
                                                                  {u.name.split(' ').map(n => n[0]).join('')}
                                                                </div>
                                                                <div className="truncate">
                                                                  <p className="truncate">{u.name}</p>
                                                                  <p className="text-[8px] text-stone-400 truncate">{u.email}</p>
                                                                </div>
                                                              </button>
                                                            ))}
                                                        </div>
                                                      </motion.div>
                                                    </>
                                                  )}
                                                </AnimatePresence>
                                              </td>
                                              <td className="py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                  <button 
                                                    onClick={() => {
                                                      setEditingInitiative(initiative);
                                                      setSelectedKRId(kr.id);
                                                      setIsAddInitiativeModalOpen(true);
                                                    }}
                                                    className="p-2 hover:bg-stone-50 rounded-xl text-stone-400 transition-colors"
                                                  >
                                                    <Edit2 className="w-4 h-4" />
                                                  </button>
                                                  <button 
                                                    onClick={() => {
                                                      if (window.confirm('Are you sure you want to delete this initiative?')) {
                                                        deleteInitiative(initiative.id);
                                                      }
                                                    }}
                                                    className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 transition-all"
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                    </tbody>
                                  </table>
                                  <div className="mt-6 flex items-center gap-6">
                                    <button 
                                      onClick={() => {
                                        setSelectedKRId(kr.id);
                                        setIsAddInitiativeModalOpen(true);
                                      }}
                                      className="text-orange-500 text-xs font-black flex items-center gap-1.5 hover:text-orange-600 transition-colors uppercase tracking-wider"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add Initiative
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {isAdmin && (
                          <button 
                            onClick={() => {
                              setSelectedGoalId(goal.id);
                              setIsAddKRModalOpen(true);
                            }}
                            className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50/30 transition-all flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest"
                          >
                            <Plus className="w-5 h-5" />
                            Add Key Result
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Goal Modal */}
      {isAddGoalModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-stone-100"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-stone-800">{editingGoal ? 'Edit Goal' : 'Add New Goal'}</h2>
              <button 
                onClick={() => {
                  setIsAddGoalModalOpen(false);
                  setEditingGoal(null);
                }} 
                className="text-stone-400 hover:text-stone-600"
              >
                <ChevronDown className="w-6 h-6 rotate-90" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const goalData = {
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                quarter: editingGoal?.quarter || currentQuarterStr,
                createdAt: editingGoal?.createdAt || new Date().toISOString(),
                createdBy: editingGoal?.createdBy || currentUser?.email || 'system'
              };

              if (editingGoal) {
                await updateGoal(editingGoal.id, goalData);
              } else {
                await addGoal(goalData);
              }
              setIsAddGoalModalOpen(false);
              setEditingGoal(null);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Goal Title</label>
                <input 
                  name="title" 
                  required 
                  defaultValue={editingGoal?.title}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                  placeholder="e.g., Achieving our highest revenue quarter" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Description</label>
                <textarea 
                  name="description" 
                  rows={3} 
                  defaultValue={editingGoal?.description}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                  placeholder="Briefly describe the objective" 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddGoalModalOpen(false);
                    setEditingGoal(null);
                  }} 
                  className="flex-1 px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20">
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add/Edit KR Modal */}
      {isAddKRModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-stone-100"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-stone-800">{editingKR ? 'Edit Key Result' : 'Add Key Result'}</h2>
              <button 
                onClick={() => {
                  setIsAddKRModalOpen(false);
                  setEditingKR(null);
                }} 
                className="text-stone-400 hover:text-stone-600"
              >
                <ChevronDown className="w-6 h-6 rotate-90" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              if (!selectedGoalId) return;
              
              const krData = {
                goalId: selectedGoalId,
                title: formData.get('title') as string,
                ownerId: formData.get('ownerId') as string,
                targetValue: Number(formData.get('targetValue')),
                currentValue: editingKR?.currentValue || 0,
                status: editingKR?.status || 'On Track',
                unit: formData.get('unit') as string,
                createdAt: editingKR?.createdAt || new Date().toISOString(),
                createdBy: editingKR?.createdBy || currentUser?.email || 'system'
              };

              if (editingKR) {
                await updateKeyResult(editingKR.id, krData);
              } else {
                await addKeyResult(krData);
              }
              setIsAddKRModalOpen(false);
              setEditingKR(null);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">KR Title</label>
                <input 
                  name="title" 
                  required 
                  defaultValue={editingKR?.title}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                  placeholder="e.g., Reach 650 B2C Conversions" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Target Value</label>
                  <input 
                    name="targetValue" 
                    type="number" 
                    required 
                    defaultValue={editingKR?.targetValue}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Unit</label>
                  <input 
                    name="unit" 
                    required 
                    defaultValue={editingKR?.unit}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                    placeholder="$ or units" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Owner</label>
                <select 
                  name="ownerId" 
                  required 
                  defaultValue={editingKR?.ownerId}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.email}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddKRModalOpen(false);
                    setEditingKR(null);
                  }} 
                  className="flex-1 px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20">
                  {editingKR ? 'Update KR' : 'Add KR'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* KR Check-in Modal */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden border border-stone-100"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-black text-stone-800">KR Check-in & History</h2>
              <button onClick={() => setIsCheckInModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <ChevronDown className="w-6 h-6 rotate-90" />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto">
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                if (!selectedKRId) return;
                await addKRCheckIn({
                  krId: selectedKRId,
                  value: Number(formData.get('value')),
                  status: formData.get('status') as any,
                  comment: formData.get('comment') as string,
                  createdAt: new Date().toISOString(),
                  createdBy: currentUser?.email || 'system'
                });
                // Reset form
                (e.target as HTMLFormElement).reset();
              }} className="p-8 space-y-6 bg-stone-50/30 border-b border-stone-100">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Progress ({keyResults.find(k => k.id === selectedKRId)?.unit || '$'}):</label>
                    <input 
                      name="value" 
                      type="number" 
                      required 
                      defaultValue={keyResults.find(k => k.id === selectedKRId)?.currentValue}
                      className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-bold text-stone-800" 
                    />
                    <p className="text-[10px] text-stone-400 mt-1 font-bold">0 → {keyResults.find(k => k.id === selectedKRId)?.targetValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Current Status:</label>
                    <div className="flex gap-2">
                      {['On Track', 'Behind', 'At Risk'].map(s => (
                        <label key={s} className="flex-1">
                          <input type="radio" name="status" value={s} className="sr-only peer" defaultChecked={s === (keyResults.find(k => k.id === selectedKRId)?.status || 'On Track')} />
                          <div className={`text-center py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all
                            ${s === 'On Track' ? 'peer-checked:bg-green-500 peer-checked:text-white peer-checked:border-green-500 text-green-600 border-green-100 bg-green-50/50' : 
                              s === 'Behind' ? 'peer-checked:bg-amber-500 peer-checked:text-white peer-checked:border-amber-500 text-amber-600 border-amber-100 bg-amber-50/50' : 
                              'peer-checked:bg-rose-500 peer-checked:text-white peer-checked:border-rose-500 text-rose-600 border-rose-100 bg-rose-50/50'}`}
                          >
                            {s}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">
                    Check-in note
                  </label>
                  <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2 p-2 border-b border-stone-100 bg-stone-50/50">
                      <div className="flex items-center gap-1 border-r border-stone-200 pr-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 px-1.5">Markdown Supported</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => {
                          if (!commentRef.current) return;
                          const start = commentRef.current.selectionStart;
                          const end = commentRef.current.selectionEnd;
                          const text = commentRef.current.value;
                          commentRef.current.value = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end);
                        }} className="p-1.5 hover:bg-stone-200 rounded-lg font-bold text-stone-600">B</button>
                        <button type="button" onClick={() => {
                          if (!commentRef.current) return;
                          const start = commentRef.current.selectionStart;
                          const end = commentRef.current.selectionEnd;
                          const text = commentRef.current.value;
                          commentRef.current.value = text.substring(0, start) + '_' + text.substring(start, end) + '_' + text.substring(end);
                        }} className="p-1.5 hover:bg-stone-200 rounded-lg italic text-stone-600">I</button>
                      </div>
                    </div>
                    <textarea 
                      ref={commentRef}
                      name="comment" 
                      rows={4} 
                      className="w-full p-4 focus:outline-none text-sm font-medium text-stone-700" 
                      placeholder="+ Summary of check-in" 
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <div className="flex gap-4">
                    <button type="submit" className="px-8 py-3 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">Check-In</button>
                    <button type="button" onClick={() => setIsCheckInModalOpen(false)} className="px-6 py-3 text-stone-400 font-bold text-xs uppercase tracking-widest hover:text-stone-600">Cancel</button>
                  </div>
                </div>
              </form>

              <div className="p-8 space-y-6 bg-stone-50/30">
                <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest">Check-in History</h3>
                {useAppContext().krCheckIns.filter(c => c.krId === selectedKRId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(checkIn => (
                  <div key={checkIn.id} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 font-black text-[10px]">
                          {users.find(u => u.email === checkIn.createdBy)?.name.split(' ').map(n => n[0]).join('') || '??'}
                        </div>
                        <div>
                          <p className="text-xs font-black text-stone-800">{users.find(u => u.email === checkIn.createdBy)?.name || checkIn.createdBy}</p>
                          <p className="text-[10px] text-stone-400 font-bold">{new Date(checkIn.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-lg border font-bold ${getStatusColor(checkIn.status)}`}>
                        {checkIn.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-black text-stone-800">Value: {keyResults.find(k => k.id === selectedKRId)?.unit}{checkIn.value.toLocaleString()}</span>
                    </div>
                    {checkIn.comment && (
                      <div className="text-sm text-stone-600 font-medium bg-stone-50 p-3 rounded-xl border border-stone-100 prose prose-sm max-w-none">
                        <ReactMarkdown>{checkIn.comment}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))}
                {useAppContext().krCheckIns.filter(c => c.krId === selectedKRId).length === 0 && (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                    <p className="text-stone-400 font-bold">No check-in history yet</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add/Edit Initiative Modal */}
      {isAddInitiativeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-stone-100"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-stone-800">{editingInitiative ? 'Edit Initiative' : 'Add Initiative'}</h2>
              <button 
                onClick={() => {
                  setIsAddInitiativeModalOpen(false);
                  setEditingInitiative(null);
                }} 
                className="text-stone-400 hover:text-stone-600"
              >
                <ChevronDown className="w-6 h-6 rotate-90" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              if (!selectedKRId) return;
              
              const initiativeData = {
                krId: selectedKRId,
                title: formData.get('title') as string,
                ownerId: formData.get('ownerId') as string,
                status: formData.get('status') as any,
                priority: editingInitiative?.priority || 'Medium',
                dueDate: formData.get('dueDate') as string,
                createdAt: editingInitiative?.createdAt || new Date().toISOString(),
                createdBy: editingInitiative?.createdBy || currentUser?.email || 'system'
              };

              if (editingInitiative) {
                await updateInitiative(editingInitiative.id, initiativeData);
              } else {
                await addInitiative(initiativeData);
              }
              setIsAddInitiativeModalOpen(false);
              setEditingInitiative(null);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Initiative Name</label>
                <input 
                  name="title" 
                  required 
                  defaultValue={editingInitiative?.title}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none" 
                  placeholder="e.g., Resource Library" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Status</label>
                  <select 
                    name="status" 
                    defaultValue={editingInitiative?.status || 'Not Picked'}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs font-bold text-stone-700"
                  >
                    <option value="Not Picked">Not Picked</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Dropped">Dropped</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">Due Date</label>
                  <input 
                    name="dueDate" 
                    type="date" 
                    defaultValue={editingInitiative?.dueDate}
                    className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs font-bold text-stone-700" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">Owner</label>
                <select 
                  name="ownerId" 
                  required 
                  defaultValue={editingInitiative?.ownerId}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs font-bold text-stone-700"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.email}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddInitiativeModalOpen(false);
                    setEditingInitiative(null);
                  }} 
                  className="flex-1 px-4 py-2 border border-stone-200 rounded-xl text-stone-600 font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20">
                  {editingInitiative ? 'Update Initiative' : 'Add Initiative'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Lakshya;
