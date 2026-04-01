import React, { useState, useMemo } from 'react';
import { useAppContext, ReviewCycle, ReviewSubmission } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Plus, CheckCircle2, Clock, MessageSquare, Users, Building, Calendar } from 'lucide-react';

export const Reviews = () => {
  const { users, teams, reviewCycles, reviewSubmissions, addReviewCycle, addReviewSubmission } = useAppContext();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'pending' | 'past' | 'admin'>('pending');
  
  const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'HR' || user?.role === 'Team Lead' || users.some(u => u.managerId === user?.id);

  // Admin Setup State
  const [isCreating, setIsCreating] = useState(false);
  const [newCycle, setNewCycle] = useState({
    title: '',
    type: 'Organization' as ReviewCycle['type'],
    deadline: '',
    questions: ['']
  });

  // Review Form State
  const [selectedReview, setSelectedReview] = useState<{cycle: ReviewCycle, revieweeId: string | null} | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Calculate Pending Reviews
  const pendingReviews = useMemo(() => {
    if (!user) return [];
    const pending: {cycle: ReviewCycle, revieweeId: string | null, revieweeName?: string}[] = [];
    
    const activeCycles = reviewCycles.filter(c => c.status === 'Active');
    
    activeCycles.forEach(cycle => {
      if (cycle.type === 'Organization') {
        const hasSubmitted = reviewSubmissions.some(s => s.cycleId === cycle.id && s.reviewerId === user.id);
        if (!hasSubmitted) pending.push({ cycle, revieweeId: null, revieweeName: 'Overall Organization' });
      } 
      else if (cycle.type === 'Manager-to-Junior') {
        // Find users where I am the manager
        const myJuniors = users.filter(u => u.managerId === user.id);
        myJuniors.forEach(junior => {
          const hasSubmitted = reviewSubmissions.some(s => s.cycleId === cycle.id && s.reviewerId === user.id && s.revieweeId === junior.id);
          if (!hasSubmitted) pending.push({ cycle, revieweeId: junior.id, revieweeName: junior.name });
        });
      }
      else if (cycle.type === 'Peer-to-Peer') {
        // Find my teams
        const myTeams = teams.filter(t => user.teamIds?.includes(t.id));
        // Find all users in those teams except me
        const peers = new Set<string>();
        myTeams.forEach(t => {
          users.filter(u => u.teamIds?.includes(t.id) && u.id !== user.id).forEach(u => peers.add(u.id));
        });
        
        peers.forEach(peerId => {
          const peer = users.find(u => u.id === peerId);
          if (peer) {
            const hasSubmitted = reviewSubmissions.some(s => s.cycleId === cycle.id && s.reviewerId === user.id && s.revieweeId === peer.id);
            if (!hasSubmitted) pending.push({ cycle, revieweeId: peer.id, revieweeName: peer.name });
          }
        });
      }
    });
    
    return pending;
  }, [user, users, teams, reviewCycles, reviewSubmissions]);

  const myPastSubmissions = reviewSubmissions
    .filter(s => s.reviewerId === user?.id)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    await addReviewCycle({
      title: newCycle.title,
      type: newCycle.type,
      deadline: newCycle.deadline,
      questions: newCycle.questions.filter(q => q.trim() !== ''),
      status: 'Active',
      createdBy: user.id,
      createdAt: new Date().toISOString()
    });
    
    setIsCreating(false);
    setNewCycle({ title: '', type: 'Organization', deadline: '', questions: [''] });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedReview) return;
    
    await addReviewSubmission({
      cycleId: selectedReview.cycle.id,
      reviewerId: user.id,
      revieweeId: selectedReview.revieweeId,
      answers,
      submittedAt: new Date().toISOString()
    });
    
    setSelectedReview(null);
    setAnswers({});
  };

  const getIconForType = (type: string) => {
    if (type === 'Organization') return <Building size={18} />;
    if (type === 'Peer-to-Peer') return <Users size={18} />;
    return <MessageSquare size={18} />;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">360° Reviews</h2>
          <p className="text-stone-500">Provide and manage feedback across the Panchayat.</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-stone-200 shadow-sm">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pending' ? 'bg-orange-100 text-orange-700' : 'text-stone-600 hover:bg-stone-50'}`}
          >
            Pending ({pendingReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'past' ? 'bg-orange-100 text-orange-700' : 'text-stone-600 hover:bg-stone-50'}`}
          >
            Past Reviews
          </button>
          {isManagerOrAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'admin' ? 'bg-orange-100 text-orange-700' : 'text-stone-600 hover:bg-stone-50'}`}
            >
              Admin Setup
            </button>
          )}
        </div>
      </div>

      {selectedReview ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
            <div>
              <h3 className="text-xl font-bold text-stone-800">{selectedReview.cycle.title}</h3>
              <p className="text-stone-500">Reviewing: <span className="font-bold text-stone-700">{pendingReviews.find(p => p.cycle.id === selectedReview.cycle.id && p.revieweeId === selectedReview.revieweeId)?.revieweeName}</span></p>
            </div>
            <button onClick={() => setSelectedReview(null)} className="text-stone-400 hover:text-stone-600">✕ Cancel</button>
          </div>
          
          <form onSubmit={handleSubmitReview} className="space-y-6">
            {selectedReview.cycle.questions.map((q, i) => (
              <div key={i}>
                <label className="block text-sm font-bold text-stone-700 mb-2">{i + 1}. {q}</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="Enter your feedback..."
                  value={answers[i] || ''}
                  onChange={e => setAnswers({...answers, [i]: e.target.value})}
                />
              </div>
            ))}
            <div className="pt-4 flex justify-end">
              <button type="submit" className="px-6 py-2.5 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 transition-colors">
                Submit Review
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {activeTab === 'pending' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingReviews.length === 0 ? (
                <div className="col-span-full py-12 text-center border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
                  <h3 className="text-lg font-bold text-stone-800">All caught up!</h3>
                  <p className="text-stone-500">You have no pending reviews to complete.</p>
                </div>
              ) : (
                pendingReviews.map((item, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm hover:border-orange-200 transition-all flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
                        {getIconForType(item.cycle.type)}
                        {item.cycle.type}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                        <Clock size={14} />
                        Due: {new Date(item.cycle.deadline).toLocaleDateString()}
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-stone-800 mb-1">{item.cycle.title}</h4>
                    <p className="text-stone-500 text-sm mb-6 flex-1">Reviewing: <span className="font-bold text-stone-700">{item.revieweeName}</span></p>
                    <button 
                      onClick={() => setSelectedReview(item)}
                      className="w-full py-2 bg-stone-100 hover:bg-orange-600 hover:text-white text-stone-700 font-medium rounded-xl transition-colors"
                    >
                      Start Review
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'past' && (
            <div className="space-y-4">
              {myPastSubmissions.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                  <p className="text-stone-500">You haven't submitted any reviews yet.</p>
                </div>
              ) : (
                myPastSubmissions.map(sub => {
                  const cycle = reviewCycles.find(c => c.id === sub.cycleId);
                  const reviewee = users.find(u => u.id === sub.revieweeId);
                  return (
                    <div key={sub.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-stone-800">{cycle?.title || 'Unknown Cycle'}</h4>
                          <p className="text-sm text-stone-500">
                            Reviewee: <span className="font-medium text-stone-700">{reviewee?.name || 'Overall Organization'}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Submitted</span>
                          <p className="text-xs text-stone-400 mt-1">{new Date(sub.submittedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="space-y-3 pt-4 border-t border-stone-100">
                        {cycle?.questions.map((q, i) => (
                          <div key={i} className="bg-stone-50 p-3 rounded-xl">
                            <p className="text-xs font-bold text-stone-500 mb-1">Q: {q}</p>
                            <p className="text-sm text-stone-800">{sub.answers[i] || 'No answer provided'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'admin' && isManagerOrAdmin && (
            <div className="space-y-6">
              {!isCreating ? (
                <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                  <div>
                    <h3 className="font-bold text-stone-800">Review Cycles</h3>
                    <p className="text-sm text-stone-500">Manage active and past review cycles.</p>
                  </div>
                  <button 
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 transition-colors"
                  >
                    <Plus size={18} />
                    New Cycle
                  </button>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-stone-800">Create Review Cycle</h3>
                    <button onClick={() => setIsCreating(false)} className="text-stone-400 hover:text-stone-600">✕</button>
                  </div>
                  <form onSubmit={handleCreateCycle} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">Cycle Title</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Q3 Performance Review"
                          className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          value={newCycle.title}
                          onChange={e => setNewCycle({...newCycle, title: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-1">Review Type</label>
                        <select
                          className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          value={newCycle.type}
                          onChange={e => setNewCycle({...newCycle, type: e.target.value as any})}
                        >
                          <option value="Organization">Overall Organization</option>
                          <option value="Peer-to-Peer">Peer-to-Peer</option>
                          <option value="Manager-to-Junior">Manager-to-Junior</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1">Deadline</label>
                      <input
                        required
                        type="date"
                        className="w-full md:w-1/2 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        value={newCycle.deadline}
                        onChange={e => setNewCycle({...newCycle, deadline: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2">Questions Template</label>
                      <div className="space-y-3">
                        {newCycle.questions.map((q, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              required
                              type="text"
                              placeholder={`Question ${i + 1}`}
                              className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                              value={q}
                              onChange={e => {
                                const newQ = [...newCycle.questions];
                                newQ[i] = e.target.value;
                                setNewCycle({...newCycle, questions: newQ});
                              }}
                            />
                            {newCycle.questions.length > 1 && (
                              <button 
                                type="button"
                                onClick={() => setNewCycle({...newCycle, questions: newCycle.questions.filter((_, idx) => idx !== i)})}
                                className="px-3 text-rose-500 hover:bg-rose-50 rounded-xl"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setNewCycle({...newCycle, questions: [...newCycle.questions, '']})}
                          className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                        >
                          <Plus size={16} /> Add Question
                        </button>
                      </div>
                    </div>
                    <div className="pt-4 flex justify-end">
                      <button type="submit" className="px-6 py-2 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 transition-colors">
                        Launch Review Cycle
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-bold text-stone-800">All Cycles</h3>
                {reviewCycles.length === 0 ? (
                  <p className="text-stone-500 text-sm">No review cycles created yet.</p>
                ) : (
                  reviewCycles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(cycle => (
                    <div key={cycle.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-stone-800">{cycle.title}</h4>
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${cycle.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>
                            {cycle.status}
                          </span>
                        </div>
                        <p className="text-sm text-stone-500">{cycle.type} • Due: {new Date(cycle.deadline).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Submissions</p>
                        <p className="text-lg font-black text-stone-700">{reviewSubmissions.filter(s => s.cycleId === cycle.id).length}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
