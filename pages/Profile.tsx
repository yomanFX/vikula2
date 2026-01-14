
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserType, Complaint, ActivityType, ComplaintStatus, TIERS } from '../types';
import { updateComplaintStatus, updateComplaint, uploadAvatar } from '../services/sheetService';
import { useComplaints } from '../context/ComplaintContext';
import { SettingsModal } from '../components/SettingsModal';
import { compressImage } from '../services/imageService';

const GlassGauge: React.FC<{ score: number }> = ({ score }) => {
  const percentage = Math.min(100, Math.max(0, score / 10)); // 0 to 100
  const circumference = 2 * Math.PI * 45; // r=45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Color determination
  const color = score >= 800 ? '#4ade80' : score >= 500 ? '#facc15' : '#ef4444';

  return (
    <div className="relative flex flex-col items-center justify-center size-48">
      {/* Background Circle */}
      <svg className="size-full rotate-[-90deg]">
        <circle
          cx="50%"
          cy="50%"
          r="45"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-200/20"
        />
        {/* Progress Circle */}
        <circle
          cx="50%"
          cy="50%"
          r="45"
          fill="transparent"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out drop-shadow-lg"
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-gray-900 dark:text-white drop-shadow-md">{Math.round(score)}</span>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Рейтинг</span>
      </div>
    </div>
  );
};

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { complaints, refreshData, vikulyaStats, yanikStats, avatars, refreshAvatars } = useComplaints();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeIdentity, setActiveIdentity] = useState<UserType>(() => {
    return (localStorage.getItem('currentUserIdentity') as UserType) || UserType.Vikulya;
  });
  
  const [reviewItem, setReviewItem] = useState<Complaint | null>(null);
  const [reviewPoints, setReviewPoints] = useState(15);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
      const updatedItem: Complaint = { ...reviewItem, status: ComplaintStatus.Completed, points: reviewPoints };
      setReviewItem(null);
      await updateComplaint(updatedItem);
      refreshData();
  };

  const handleStatusUpdate = async (complaintId: string, newStatus: ComplaintStatus) => {
    if (newStatus === ComplaintStatus.Compensated) {
        if (!confirm("Вы подтверждаете, что долг полностью погашен?")) return;
    }
    await updateComplaintStatus(complaintId, newStatus);
    refreshData();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              setIsUploading(true);
              const compressed = await compressImage(file);
              await uploadAvatar(activeIdentity, compressed);
              refreshAvatars();
          } catch (error) { alert("Error uploading"); } finally { setIsUploading(false); }
      }
  };

  // Filter Data
  const pendingComplaints = complaints.filter(a => a.user === activeIdentity && a.type === ActivityType.Complaint && (a.status === ComplaintStatus.InProgress || a.status === ComplaintStatus.Approved));
  const myClaims = complaints.filter(a => a.user !== activeIdentity && a.type === ActivityType.Complaint && a.status === ComplaintStatus.PendingConfirmation);
  const incomingDeeds = complaints.filter(a => a.user !== activeIdentity && a.type === ActivityType.GoodDeed && a.status === ComplaintStatus.PendingApproval);
  
  const tier = TIERS.slice().reverse().find(t => score >= t.min) || TIERS[0];

  return (
    <div className="max-w-md mx-auto min-h-screen pb-28 pt-safe-top">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Glass Header */}
      <header className="sticky top-0 z-40 px-4 py-3 flex justify-between items-center transition-all duration-300">
        <button onClick={() => setIsSettingsOpen(true)} className="glass-panel size-10 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-gray-500">settings</span>
        </button>
        <div className="glass-panel px-1 p-1 rounded-full flex">
             <button onClick={() => handleIdentityChange(UserType.Vikulya)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeIdentity === UserType.Vikulya ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-500'}`}>Викуля</button>
             <button onClick={() => handleIdentityChange(UserType.Yanik)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeIdentity === UserType.Yanik ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500'}`}>Яник</button>
        </div>
        <button onClick={() => refreshData()} className="glass-panel size-10 rounded-full flex items-center justify-center active:rotate-180 transition-transform">
           <span className="material-symbols-outlined text-gray-500">refresh</span>
        </button>
      </header>

      {/* Avatar & Score HUD */}
      <div className="flex flex-col items-center mt-4 mb-6">
          <div className="relative mb-6" onClick={() => fileInputRef.current?.click()}>
              <div className="size-28 rounded-full p-1.5 glass-panel shadow-2xl relative z-10">
                  <img src={avatars[activeIdentity]} className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-700 p-2 rounded-full shadow-lg z-20 cursor-pointer hover:scale-110 transition-transform">
                   <span className="material-symbols-outlined text-sm">edit</span>
              </div>
              {isUploading && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center z-30"><span className="animate-spin material-symbols-outlined text-white">refresh</span></div>}
              <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>

          <GlassGauge score={score} />
          
          <div className="glass-panel mt-4 px-6 py-2 rounded-2xl flex flex-col items-center">
               <span className={`text-xl font-black ${tier.color} drop-shadow-sm`}>{tier.name}</span>
               <span className="text-[10px] text-gray-400 italic">"{tier.desc}"</span>
          </div>
      </div>

      {/* Main Action */}
      <div className="px-4 mb-8">
        <button onClick={openCreateGoodDeed} className="w-full glass-panel h-16 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-transform hover:bg-white/20 border-2 border-dashed border-gray-300/30">
            <span className="material-symbols-outlined text-green-500 text-3xl">add_a_photo</span>
            <span className="font-bold text-gray-700 dark:text-white">Загрузить Доброе Дело</span>
        </button>
      </div>

      {/* Incoming Tasks Stack */}
      <div className="px-4 space-y-6">
          
          {/* TO APPROVE */}
          {incomingDeeds.length > 0 && (
             <div className="space-y-2 animate-fadeIn">
                <h3 className="text-xs font-bold text-gray-400 uppercase px-2">Требуют оценки</h3>
                {incomingDeeds.map(deed => (
                    <div key={deed.id} className="glass-panel p-4 flex items-center justify-between">
                         <div className="flex items-center gap-3 overflow-hidden">
                             {deed.image && <img src={deed.image} className="size-10 rounded-lg object-cover" />}
                             <span className="font-bold text-sm truncate">{deed.description}</span>
                         </div>
                         <button onClick={() => setReviewItem(deed)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-green-500/30">Оценить</button>
                    </div>
                ))}
             </div>
          )}

          {/* MY CLAIMS */}
          {myClaims.length > 0 && (
             <div className="space-y-2 animate-fadeIn">
                <h3 className="text-xs font-bold text-gray-400 uppercase px-2">Ждут подтверждения</h3>
                {myClaims.map(c => (
                     <div key={c.id} className="glass-panel p-4 border-l-4 border-l-blue-500">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-sm">{c.description}</span>
                            <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded">Исправлено</span>
                        </div>
                        <button onClick={() => handleStatusUpdate(c.id, ComplaintStatus.Compensated)} className="w-full mt-2 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/30">
                            Подтвердить и Закрыть
                        </button>
                     </div>
                ))}
             </div>
          )}

          {/* MY DEBTS */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase px-2">Мои Долги</h3>
            {pendingComplaints.length === 0 && (
                <div className="glass-panel p-6 text-center">
                    <span className="text-2xl">🎉</span>
                    <p className="text-sm text-gray-500 mt-2">Вы чисты перед законом!</p>
                </div>
            )}
            {pendingComplaints.map(c => (
                 <div key={c.id} className="glass-panel p-5 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="text-xs font-bold text-orange-500 uppercase">{c.category}</span>
                            <p className="font-bold text-gray-800 dark:text-white leading-tight mt-1">{c.description}</p>
                        </div>
                        <span className="text-red-500 font-black text-sm">{c.points} pts</span>
                    </div>
                    
                    <div className="bg-orange-500/10 p-2 rounded-xl flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-orange-500">warning</span>
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-300">{c.compensation}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleStatusUpdate(c.id, ComplaintStatus.PendingAppeal)} className="glass-btn-secondary py-2 rounded-xl text-xs font-bold">Апелляция</button>
                        <button onClick={() => handleStatusUpdate(c.id, ComplaintStatus.PendingConfirmation)} className="bg-green-500 text-white py-2 rounded-xl text-xs font-bold shadow-lg shadow-green-500/20">Исправлено</button>
                    </div>
                </div>
            ))}
          </div>
      </div>

      {/* Review Modal */}
      {reviewItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
              <div className="glass-panel w-full max-w-sm p-6 relative animate-scaleIn">
                  <button onClick={() => setReviewItem(null)} className="absolute top-4 right-4 size-8 bg-white/10 rounded-full flex items-center justify-center"><span className="material-symbols-outlined text-white">close</span></button>
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-6">Оценка</h3>
                  
                  <div className="flex justify-between items-end mb-4 px-2">
                      <span className="text-green-500 font-bold text-4xl">+{reviewPoints}</span>
                      <span className="text-gray-400 text-sm mb-1">баллов</span>
                  </div>

                  <input type="range" min="5" max="100" step="5" value={reviewPoints} onChange={(e) => setReviewPoints(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-400 mb-8" />
                  
                  <button onClick={handleApproveDeed} className="w-full py-4 bg-green-500 text-white font-bold rounded-2xl shadow-xl shadow-green-500/40 text-lg">Подтвердить</button>
              </div>
          </div>
      )}
    </div>
  );
};