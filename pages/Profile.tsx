
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserType, Complaint, ActivityType, ComplaintStatus, TIERS, SHOP_ITEMS } from '../types';
import { updateComplaintStatus, updateComplaint, uploadAvatar, getInventory } from '../services/sheetService';
import { useComplaints } from '../context/ComplaintContext';
import { SettingsModal } from '../components/SettingsModal';
import { ShopModal } from '../components/ShopModal';
import { AvatarFrame } from '../components/AvatarFrame';
import { compressImage } from '../services/imageService';

const GlassGauge: React.FC<{ score: number }> = ({ score }) => {
  const percentage = Math.min(100, Math.max(0, score / 10)); // 0 to 100
  const circumference = 2 * Math.PI * 45; // r=45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = score >= 800 ? '#4ade80' : score >= 500 ? '#facc15' : '#ef4444';

  return (
    <div className="relative flex flex-col items-center justify-center size-48">
      <svg className="size-full rotate-[-90deg] drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
        <circle cx="50%" cy="50%" r="45" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
        <circle cx="50%" cy="50%" r="45" fill="transparent" stroke={color} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">{Math.round(score)}</span>
        <span className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">Рейтинг</span>
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
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [equippedFrameId, setEquippedFrameId] = useState<string | null>(null);
  const [userMedals, setUserMedals] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('currentUserIdentity', activeIdentity);
    setEquippedFrameId(localStorage.getItem(`equipped_frame_${activeIdentity}`));
  }, [activeIdentity]);

  useEffect(() => {
      const handleStorage = () => {
          setEquippedFrameId(localStorage.getItem(`equipped_frame_${activeIdentity}`));
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
  }, [activeIdentity]);

  useEffect(() => {
     const inv = getInventory(complaints, activeIdentity);
     const medals = inv.filter(id => id.startsWith('medal_'));
     setUserMedals(medals);
  }, [complaints, activeIdentity]);

  const score = activeIdentity === UserType.Vikulya ? vikulyaStats.score : yanikStats.score;

  const handleIdentityChange = (user: UserType) => setActiveIdentity(user);
  const openCreateGoodDeed = () => navigate('/create/step1', { state: { mode: 'good_deed' } });

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
              const resultUrl = await uploadAvatar(activeIdentity, compressed);
              
              if (resultUrl) {
                  refreshAvatars();
              } else {
                  throw new Error("Upload returned null");
              }
          } catch (error: any) { 
              console.error(error);
              alert("Ошибка загрузки. Подробности в консоли."); 
          } finally { 
              setIsUploading(false); 
              // Reset input so the same file can be selected again if needed
              if (fileInputRef.current) {
                  fileInputRef.current.value = '';
              }
          }
      }
  };

  const pendingComplaints = complaints.filter(a => a.user === activeIdentity && a.type === ActivityType.Complaint && (a.status === ComplaintStatus.InProgress || a.status === ComplaintStatus.Approved));
  const myClaims = complaints.filter(a => a.user !== activeIdentity && a.type === ActivityType.Complaint && a.status === ComplaintStatus.PendingConfirmation);
  const incomingDeeds = complaints.filter(a => a.user !== activeIdentity && a.type === ActivityType.GoodDeed && a.status === ComplaintStatus.PendingApproval);
  
  const tier = TIERS.slice().reverse().find(t => score >= t.min) || TIERS[0];

  return (
    <div className="max-w-md mx-auto min-h-screen pb-28 pt-safe-top">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} currentUser={activeIdentity} currentScore={score} />

      <header className="sticky top-0 z-40 px-4 py-3 flex justify-between items-center transition-all duration-300">
        <button onClick={() => setIsSettingsOpen(true)} className="glass-panel size-10 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-white/80">settings</span>
        </button>
        <div className="glass-panel px-1 p-1 rounded-full flex">
             <button onClick={() => handleIdentityChange(UserType.Vikulya)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeIdentity === UserType.Vikulya ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/50'}`}>Викуля</button>
             <button onClick={() => handleIdentityChange(UserType.Yanik)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeIdentity === UserType.Yanik ? 'bg-orange-500 text-white shadow-lg' : 'text-white/50'}`}>Яник</button>
        </div>
        <button onClick={() => setIsShopOpen(true)} className="glass-panel size-10 rounded-full flex items-center justify-center active:scale-95 transition-transform bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border-yellow-400/30">
           <span className="text-lg">🛍️</span>
        </button>
      </header>

      <div className="flex flex-col items-center mt-8 mb-6">
          <div className="relative mb-6" onClick={() => fileInputRef.current?.click()}>
              <AvatarFrame frameId={equippedFrameId} src={avatars[activeIdentity]} size="xl" className="shadow-2xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
              <div className="absolute -bottom-2 -right-2 bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/40 shadow-lg z-20 cursor-pointer hover:scale-110 transition-transform">
                   <span className="material-symbols-outlined text-sm text-white">edit</span>
              </div>
              {isUploading && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center z-30"><span className="animate-spin material-symbols-outlined text-white">refresh</span></div>}
              <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>

          {userMedals.length > 0 && (
              <div className="flex gap-2 mb-6 flex-wrap justify-center max-w-[80%] animate-scaleIn bg-black/20 p-2 rounded-xl border border-white/5">
                  {userMedals.map((mId, i) => {
                      const medal = SHOP_ITEMS.find(s => s.id === mId);
                      return <div key={i} className="size-8 glass-panel rounded-full flex items-center justify-center text-lg shadow-sm" title={medal?.name}>{medal?.icon}</div>
                  })}
              </div>
          )}

          <GlassGauge score={score} />
          
          <div className="glass-panel mt-4 px-6 py-2 rounded-2xl flex flex-col items-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
               <span className={`text-xl font-black ${tier.color} drop-shadow-md`}>{tier.name}</span>
               <span className="text-[10px] text-white/60 italic">"{tier.desc}"</span>
          </div>
      </div>

      <div className="px-4 mb-8">
        <button onClick={openCreateGoodDeed} className="w-full glass-panel h-16 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-transform hover:bg-white/10 border-2 border-dashed border-white/20">
            <span className="material-symbols-outlined text-green-400 text-3xl">add_a_photo</span>
            <span className="font-bold text-white">Загрузить Доброе Дело</span>
        </button>
      </div>

      <div className="px-4 space-y-6">
          {incomingDeeds.length > 0 && (
             <div className="space-y-2 animate-fadeIn">
                <h3 className="text-xs font-bold text-white/40 uppercase px-2">Требуют оценки</h3>
                {incomingDeeds.map(deed => (
                    <div key={deed.id} className="glass-panel p-4 flex items-center justify-between">
                         <div className="flex items-center gap-3 overflow-hidden">
                             {deed.image && <img src={deed.image} className="size-10 rounded-lg object-cover border border-white/20" />}
                             <span className="font-bold text-sm text-white truncate">{deed.description}</span>
                         </div>
                         <button onClick={() => setReviewItem(deed)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-green-500/30">Оценить</button>
                    </div>
                ))}
             </div>
          )}

          {myClaims.length > 0 && (
             <div className="space-y-2 animate-fadeIn">
                <h3 className="text-xs font-bold text-white/40 uppercase px-2">Ждут подтверждения</h3>
                {myClaims.map(c => (
                     <div key={c.id} className="glass-panel p-4 border-l-4 border-l-blue-500">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-sm text-white">{c.description}</span>
                            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Исправлено</span>
                        </div>
                        <button onClick={() => handleStatusUpdate(c.id, ComplaintStatus.Compensated)} className="w-full mt-2 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/30">Подтвердить и Закрыть</button>
                     </div>
                ))}
             </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white/40 uppercase px-2">Мои Долги</h3>
            {pendingComplaints.length === 0 && (
                <div className="glass-panel p-6 text-center text-white/50">
                    <span className="text-2xl">🎉</span>
                    <p className="text-sm mt-2">Вы чисты перед законом!</p>
                </div>
            )}
            {pendingComplaints.map(c => (
                 <div key={c.id} className="glass-panel p-5 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="text-xs font-bold text-orange-400 uppercase">{c.category}</span>
                            <p className="font-bold text-white leading-tight mt-1">{c.description}</p>
                        </div>
                        <span className="text-red-400 font-black text-sm">{c.points} pts</span>
                    </div>
                    
                    <div className="bg-orange-500/20 p-2 rounded-xl flex items-center gap-2 mb-4 border border-orange-500/20">
                        <span className="material-symbols-outlined text-orange-400">warning</span>
                        <span className="text-xs font-bold text-orange-200">{c.compensation}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleStatusUpdate(c.id, ComplaintStatus.PendingAppeal)} className="glass-btn-secondary py-2 rounded-xl text-xs font-bold">Апелляция</button>
                        <button onClick={() => handleStatusUpdate(c.id, ComplaintStatus.PendingConfirmation)} className="bg-green-500 text-white py-2 rounded-xl text-xs font-bold shadow-lg shadow-green-500/20">Исправлено</button>
                    </div>
                </div>
            ))}
          </div>
      </div>

      {reviewItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl px-4">
              <div className="glass-panel w-full max-w-sm p-6 relative animate-scaleIn border border-white/20">
                  <button onClick={() => setReviewItem(null)} className="absolute top-4 right-4 size-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"><span className="material-symbols-outlined text-white">close</span></button>
                  <h3 className="font-bold text-xl text-white mb-6">Оценка</h3>
                  <div className="flex justify-between items-end mb-4 px-2">
                      <span className="text-green-400 font-bold text-4xl">+{reviewPoints}</span>
                      <span className="text-white/60 text-sm mb-1">баллов</span>
                  </div>
                  <input type="range" min="5" max="100" step="5" value={reviewPoints} onChange={(e) => setReviewPoints(Number(e.target.value))} className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-green-400 mb-8" />
                  <button onClick={handleApproveDeed} className="w-full py-4 bg-green-500 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(74,222,128,0.4)] text-lg">Подтвердить</button>
              </div>
          </div>
      )}
    </div>
  );
};
