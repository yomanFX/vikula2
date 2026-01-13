
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserType, Complaint, ActivityType, ComplaintStatus, TIERS } from '../types';
import { updateComplaintStatus, updateComplaint } from '../services/sheetService';
import { useComplaints } from '../context/ComplaintContext';

const Gauge: React.FC<{ score: number }> = ({ score }) => {
  const percentage = Math.min(100, Math.max(0, score / 10)); // 0 to 100
  const rotation = (percentage / 100) * 180; 

  return (
    <div className="relative flex flex-col items-center">
      <div className="gauge-container mb-[-20px]">
        <div className="gauge-bg"></div>
        <div 
            className="gauge-fill" 
            style={{ transform: `rotate(${rotation}deg)` }}
        ></div>
      </div>
      <div className="flex flex-col items-center z-10">
        <span className="text-4xl font-black text-primary font-display">{Math.round(score)}</span>
        <p className="text-[#616f89] dark:text-gray-400 text-sm font-bold uppercase tracking-wider">Ваш рейтинг</p>
      </div>
    </div>
  );
};

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { complaints, refreshData, vikulyaStats, yanikStats } = useComplaints();
  
  const [activeIdentity, setActiveIdentity] = useState<UserType>(() => {
    return (localStorage.getItem('currentUserIdentity') as UserType) || UserType.Vikulya;
  });
  
  // Review Mode State
  const [reviewItem, setReviewItem] = useState<Complaint | null>(null);
  const [reviewPoints, setReviewPoints] = useState(15);

  useEffect(() => {
    localStorage.setItem('currentUserIdentity', activeIdentity);
  }, [activeIdentity]);

  const score = activeIdentity === UserType.Vikulya ? vikulyaStats.score : yanikStats.score;

  const handleIdentityChange = (user: UserType) => {
    setActiveIdentity(user);
  };

  const openCreateGoodDeed = () => {
      navigate('/create/step1', { state: { mode: 'good_deed' } });
  };

  const handleApproveDeed = async () => {
      if (!reviewItem) return;
      
      const updatedItem: Complaint = {
          ...reviewItem,
          status: ComplaintStatus.Completed,
          points: reviewPoints
      };
      
      setReviewItem(null);
      await updateComplaint(updatedItem);
      refreshData();
  };

  const handleStatusUpdate = async (complaintId: string, newStatus: ComplaintStatus) => {
    await updateComplaintStatus(complaintId, newStatus);
    refreshData();
  };

  // 1. Pending Complaints against ME (I need to apologize)
  const pendingComplaints = complaints.filter(
    a => a.user === activeIdentity && 
    a.type === ActivityType.Complaint && 
    (a.status === ComplaintStatus.InProgress || a.status === ComplaintStatus.Approved)
  );

  // 2. Good Deeds created by OTHER person waiting for MY approval
  const incomingDeeds = complaints.filter(
      a => a.user !== activeIdentity && 
      a.type === ActivityType.GoodDeed &&
      a.status === ComplaintStatus.PendingApproval
  );

  const getTierInfo = (s: number) => {
      const t = TIERS.slice().reverse().find(t => s >= t.min);
      const currentTier = t || TIERS[0];
      const nextTierIndex = TIERS.findIndex(x => x.min === currentTier.min) + 1;
      const nextTier = TIERS[nextTierIndex];
      return { 
          current: currentTier, 
          nextMin: nextTier ? nextTier.min : 1000 
      };
  };

  const { current: tier, nextMin } = getTierInfo(score);
  const progressPercent = Math.min(100, Math.max(0, ((score % 100) / 100) * 100));

  return (
    <div className="max-w-[480px] mx-auto min-h-screen flex flex-col pb-24 bg-background-light dark:bg-background-dark text-[#111318] dark:text-white transition-colors duration-200 relative pt-safe-top">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md flex items-center p-4 justify-between border-b border-gray-200 dark:border-gray-800">
        <div className="text-primary flex size-10 items-center justify-center rounded-full bg-primary/10">
          <span className="material-symbols-outlined">settings</span>
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center font-display">Профиль</h2>
        <div className="flex w-10 items-center justify-end">
          <button className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm">
             <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">notifications</span>
          </button>
        </div>
      </header>

      {/* Identity Switcher */}
      <div className="px-4 py-6">
        <div className="flex h-12 items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-800 p-1.5">
          <button 
            onClick={() => handleIdentityChange(UserType.Vikulya)}
            className={`flex h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all ${activeIdentity === UserType.Vikulya ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <span className="truncate text-sm font-semibold">Я Викуля</span>
          </button>
          <button 
            onClick={() => handleIdentityChange(UserType.Yanik)}
            className={`flex h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all ${activeIdentity === UserType.Yanik ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <span className="truncate text-sm font-semibold">Я Яник</span>
          </button>
        </div>
      </div>

      {/* Score Section */}
      <div className="flex flex-col items-center px-4 py-4 mb-4">
        <Gauge score={score} />
        
        <div className="w-full mt-8 p-4 bg-white dark:bg-gray-900 rounded-xl custom-shadow border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-2">
             <div className="flex flex-col">
                <span className={`text-xl font-bold ${tier.color}`}>{tier.name}</span>
                <span className="text-xs text-gray-400">Текущий статус</span>
             </div>
             <div className="text-right">
                <span className="text-xs font-bold text-gray-400">Цель: {nextMin}</span>
             </div>
          </div>
          
          <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }}></div>
          </div>
          
          <p className="mt-2 text-sm text-[#616f89] dark:text-gray-400 leading-normal italic text-center">
             "{tier.desc}"
          </p>
        </div>
      </div>

      {/* Action: Add Good Deed */}
      <div className="px-4 mb-6">
        <button 
            onClick={openCreateGoodDeed}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-14 rounded-xl font-bold flex items-center justify-center gap-2 text-green-600 dark:text-green-400 shadow-sm active:scale-95 transition-all"
        >
            <span className="material-symbols-outlined">add_a_photo</span>
            Загрузить Доброе Дело
        </button>
      </div>

      {/* SECTION: Incoming Good Deeds (To Approve) */}
      {incomingDeeds.length > 0 && (
          <div className="px-4 pt-2 pb-6 animate-fadeIn">
            <h3 className="text-lg font-bold leading-tight tracking-tight mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500">rate_review</span>
                На проверке ({incomingDeeds.length})
            </h3>
            <div className="space-y-3">
                {incomingDeeds.map(deed => (
                    <div key={deed.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             {deed.image && (
                                 <div className="size-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                     <img src={deed.image} className="w-full h-full object-cover" />
                                 </div>
                             )}
                             <div>
                                 <p className="font-bold text-gray-900 dark:text-white text-sm">{deed.description}</p>
                                 <p className="text-xs text-gray-500">{new Date(deed.timestamp).toLocaleDateString()}</p>
                             </div>
                         </div>
                         <button 
                            onClick={() => setReviewItem(deed)}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-green-500/30"
                         >
                             Оценить
                         </button>
                    </div>
                ))}
            </div>
          </div>
      )}

      {/* SECTION: Pending Complaints (To Pay) */}
      <div className="px-4 pt-2">
        <h3 className="text-lg font-bold leading-tight tracking-tight mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-500">warning</span>
            Штрафы и долги
        </h3>
        <div className="space-y-4">
            {pendingComplaints.length === 0 && (
                <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                     <span className="text-4xl block mb-2">🕊️</span>
                     <p className="text-gray-400 italic text-sm">Ваша совесть чиста... пока что.</p>
                </div>
            )}
            {pendingComplaints.map(complaint => (
                 <div key={complaint.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 custom-shadow">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                {complaint.category} 
                                {complaint.status === ComplaintStatus.Approved && (
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Признано</span>
                                )}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{complaint.description}</p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-orange-600 bg-orange-50 w-fit px-2 py-1 rounded-lg">
                                <span className="material-symbols-outlined text-sm">{complaint.compensationIcon}</span>
                                <span className="font-semibold">Штраф: {complaint.compensation}</span>
                            </div>
                        </div>
                        <span className="px-2 py-1 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[10px] font-black rounded uppercase shrink-0">
                            {complaint.points} б.
                        </span>
                    </div>

                    {/* Image Preview for Complaints */}
                    {complaint.image && (
                        <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 mb-3 bg-gray-50">
                            <img src={complaint.image} alt="proof" className="w-full h-full object-cover" />
                        </div>
                    )}
                    
                    <div className="flex gap-2">
                        {complaint.status !== ComplaintStatus.Approved && (
                            <button 
                                onClick={() => handleStatusUpdate(complaint.id, ComplaintStatus.Approved)} 
                                className="flex-1 h-10 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                            >
                                <span className="material-symbols-outlined text-lg">check_small</span>
                                Принять
                            </button>
                        )}
                        <button 
                            onClick={() => handleStatusUpdate(complaint.id, ComplaintStatus.Compensated)} 
                            className="flex-1 h-10 rounded-lg bg-green-500 text-sm font-bold text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-1 shadow-lg shadow-green-500/20"
                        >
                            <span className="material-symbols-outlined text-lg">done_all</span>
                            Исправлено
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* REVIEW MODAL */}
      {reviewItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
              <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scaleIn relative overflow-hidden">
                  
                  {/* Close button absolute top right */}
                  <button onClick={() => setReviewItem(null)} className="absolute top-4 right-4 size-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-200">
                      <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">close</span>
                  </button>

                  <h3 className="font-bold text-xl dark:text-white mb-4 pr-8">Оценка доброго дела</h3>
                  
                  {reviewItem.image && (
                      <div className="w-full h-56 rounded-2xl overflow-hidden mb-4 bg-gray-100 border border-gray-100 shadow-inner">
                          <img src={reviewItem.image} className="w-full h-full object-cover" />
                      </div>
                  )}

                  <p className="text-gray-700 dark:text-gray-300 mb-6 text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                      "{reviewItem.description}"
                  </p>

                  <div className="mb-8">
                      <div className="flex justify-between mb-3 items-end">
                          <span className="text-xs font-bold uppercase text-gray-400">Награда</span>
                          <span className="text-3xl font-black text-primary flex items-center gap-1">
                            +{reviewPoints} <span className="text-sm font-bold text-gray-400">pts</span>
                          </span>
                      </div>
                      <input 
                        type="range" 
                        min="5" 
                        max="100" 
                        step="5" 
                        value={reviewPoints}
                        onChange={(e) => setReviewPoints(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                          <span>Мелочь (5)</span>
                          <span>Подвиг (100)</span>
                      </div>
                  </div>

                  <button 
                    onClick={handleApproveDeed}
                    className="w-full h-14 bg-green-500 text-white font-bold rounded-2xl shadow-lg shadow-green-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2 text-lg"
                  >
                      Подтвердить
                      <span className="material-symbols-outlined">check_circle</span>
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};
