import React, { useState } from 'react';
import { User, useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { X, Calendar, Briefcase, Mail, MapPin, Edit2, Camera, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const EmployeeProfileModal = ({ user, onClose }: { user: User, onClose: () => void }) => {
  const { user: currentUser } = useAuth();
  const { leaves, reviewSubmissions, updateUser } = useAppContext();
  const [activeTab, setActiveTab] = useState<'details' | 'journey' | 'leaves' | 'reviews'>('details');
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState(user.avatar);

  const isManagerOrAdmin = currentUser?.role === 'Admin' || currentUser?.id === user.managerId;

  const userLeaves = leaves.filter(l => l.userId === user.id);
  const userReviews = reviewSubmissions.filter(r => r.revieweeId === user.id);

  const handleSavePhoto = async () => {
    if (newAvatarUrl !== user.avatar) {
      await updateUser(user.id, { avatar: newAvatarUrl });
      setIsEditingPhoto(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-orange-500 to-amber-500">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-8 pb-6 relative">
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div className="relative group">
              <img 
                src={isEditingPhoto ? newAvatarUrl : user.avatar} 
                alt={user.name} 
                className="w-24 h-24 rounded-2xl border-4 border-white shadow-md object-cover bg-white"
              />
              {(currentUser?.id === user.id || currentUser?.role === 'Admin') && !isEditingPhoto && (
                <button 
                  onClick={() => setIsEditingPhoto(true)}
                  className="absolute bottom-2 right-2 bg-stone-900/70 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>
                {user.status}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                {user.role}
              </span>
            </div>
          </div>

          {isEditingPhoto && (
            <div className="mb-4 flex gap-2 items-center bg-stone-50 p-3 rounded-xl border border-stone-200">
              <input 
                type="text" 
                value={newAvatarUrl} 
                onChange={(e) => setNewAvatarUrl(e.target.value)}
                placeholder="Image URL"
                className="flex-1 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <button onClick={handleSavePhoto} className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-orange-700">Save</button>
              <button onClick={() => { setIsEditingPhoto(false); setNewAvatarUrl(user.avatar); }} className="text-stone-500 hover:text-stone-700 text-sm font-medium px-2">Cancel</button>
            </div>
          )}

          <div>
            <h2 className="text-2xl font-black text-stone-800">{user.name}</h2>
            <p className="text-orange-600 font-bold">{user.designation || 'Villager'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100 px-8">
          <TabButton active={activeTab === 'details'} onClick={() => setActiveTab('details')}>Details</TabButton>
          <TabButton active={activeTab === 'journey'} onClick={() => setActiveTab('journey')}>Journey</TabButton>
          {isManagerOrAdmin && (
            <>
              <TabButton active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')}>Leaves</TabButton>
              <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>Charcha (Reviews)</TabButton>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-stone-50">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailCard icon={<Mail />} label="Email" value={user.email} />
              <DetailCard icon={<Calendar />} label="Joining Date" value={user.joiningDate || 'Not set'} />
              <DetailCard icon={<Calendar />} label="Date of Birth" value={user.dob || 'Not set'} />
              <DetailCard icon={<Briefcase />} label="Designation" value={user.designation || 'Not set'} />
              {user.isIntern && <DetailCard icon={<Briefcase />} label="Internship Status" value="Currently in Internship Program" />}
              {user.creditedLeaves ? <DetailCard icon={<CheckCircle2 />} label="Credited Leaves" value={`${user.creditedLeaves} days`} /> : null}
              {user.wfhEnabled && user.wfhQuota !== undefined ? <DetailCard icon={<MapPin />} label="Custom WFH Quota" value={`${user.wfhQuota} days`} /> : null}
            </div>
          )}

          {activeTab === 'journey' && (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-stone-300 before:to-transparent">
              {(user.journey || []).length === 0 ? (
                <div className="text-center text-stone-500 py-8 italic">No journey events recorded yet.</div>
              ) : (
                (user.journey || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((event, index) => (
                  <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-orange-100 text-orange-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <Briefcase size={16} />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-stone-800">{event.type}</h4>
                        <time className="text-xs font-medium text-stone-500">{new Date(event.date).toLocaleDateString()}</time>
                      </div>
                      <p className="text-sm text-stone-600">{event.description}</p>
                      {event.newDesignation && (
                        <div className="mt-2 text-xs font-bold text-orange-600 bg-orange-50 inline-block px-2 py-1 rounded-md">
                          {event.oldDesignation && <span className="line-through text-stone-400 mr-1">{event.oldDesignation}</span>}
                          {event.newDesignation}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'leaves' && isManagerOrAdmin && (
            <div className="space-y-4">
              {userLeaves.length === 0 ? (
                <div className="text-center text-stone-500 py-8 italic">No leave requests found.</div>
              ) : (
                userLeaves.map(leave => (
                  <div key={leave.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-stone-800">{leave.type}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          leave.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                          leave.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {leave.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-stone-600 truncate max-w-[200px]">{leave.reason}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'reviews' && isManagerOrAdmin && (
            <div className="space-y-4">
              {userReviews.length === 0 ? (
                <div className="text-center text-stone-500 py-8 italic">No reviews received yet.</div>
              ) : (
                userReviews.map(review => (
                  <div key={review.id} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-stone-800">Review Submission</h4>
                      <span className="text-xs text-stone-500">{new Date(review.submittedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(review.answers).map(([question, answer], idx) => (
                        <div key={idx} className="bg-stone-50 p-3 rounded-xl">
                          <p className="text-xs font-bold text-stone-500 mb-1">{question}</p>
                          <p className="text-sm text-stone-800">{answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors ${
      active ? 'border-orange-600 text-orange-600' : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-200'
    }`}
  >
    {children}
  </button>
);

const DetailCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex items-start gap-4">
    <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
      {React.cloneElement(icon as React.ReactElement, { size: 20 })}
    </div>
    <div>
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-bold text-stone-800">{value}</p>
    </div>
  </div>
);
