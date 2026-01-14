
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserType, Complaint, ActivityType, ComplaintStatus, TIERS } from '../types';
import { updateComplaintStatus, updateComplaint, uploadAvatar } from '../services/sheetService';
import { useComplaints } from '../context/ComplaintContext';
import { SettingsModal } from '../components/SettingsModal';
import { compressImage } from '../services/imageService';

const GoogleGauge: React.FC<{ score: number }> = ({ score }) => {
  const percentage = Math.min(100, Math.max(0, score / 10)); // 0 to 100
  const circumference = 2 * Math.PI * 52; // r=52
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Google Colors
  const color = score >= 800 ? '#34A853' : score >= 500 ? '#FBBC05' : '#EA4335';

  return (
    <div className="relative flex flex-col items-center justify-center size-56">
      <svg className="size-full rotate-[-90deg]">
        <circle cx="50%" cy="50%" r="52" fill="transparent" stroke="#E0E0E0" strokeWidth="12" className="dark:stroke-gray-700" />
        <circle
          cx="50%"
          cy="50%"
          r="52"
          fill="transparent"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter font-display">{Math.round(score)}</span>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Рейтинг</span>
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
  const tier = TIERS.slice().reverse().find(t => score >= t.min) || TIERS[0];

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
    if (newStatus === ComplaintStatus.Compensated && !confirm("Подтвердить погашение долга?")) return;
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
          } catch (error) { alert("Ошибка загрузки"); } finally { setIsUploading(false); }
      }
  };

  const pendingComplaints = complaints.filter(a => a.user === activeIdentity && a.type === ActivityType.Complaint && (a.status === ComplaintStatus.InProgress || a.status === ComplaintStatus.Approved));
  const myClaims = complaints.filter(a => a.user !== activeIdentity && a.type === ActivityType.Complaint && a.status === ComplaintStatus.PendingConfirmation);
  const incomingDeeds = complaints.filter(a => a.user !== activeIdentity && a.type === ActivityType.GoodDeed && a.status === ComplaintStatus.PendingApproval);
  
  return (
    <div className="max-w-md mx-auto min-h-screen pb-32 pt-safe-top">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <header className="sticky top-0 z-40 px-4 py-4 flex justify-between items-center transition-all bg-[#F2F6FC]/90 backdrop-blur-sm">
        <button onClick={() => setIsSettingsOpen(true)} className="size-10 rounded-full bg-white dark:bg-[#1E1E1E] shadow-sm flex items-center justify-center">
          <span className="material-symbols-rounded text-gray-500">settings</span>
        </button>
        <div className="bg-white dark:bg-[#1E1E1E] p-1.5 rounded-full flex shadow-sm">
             <button onClick={() => handleIdentityChange(UserType.Vikulya)} className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${activeIdentity === UserType.Vikulya ? 'bg-googleBlue text-white shadow-md' : 'text-gray-500'}`}>Викуля</button>
             <button onClick={() => handleIdentityChange(UserType.Yanik)} className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${activeIdentity === UserType.Yanik ? 'bg-googleBlue text-white shadow-md' : 'text-gray-500'}`}>Яник</button>
        </div>
        <button onClick={() => refreshData()} className="size-10 rounded-full bg-white dark:bg-[#1E1E1E] shadow-sm flex items-center justify-center active:rotate-180 transition-transform">
           <span className="material-symbols-rounded text-gray-500">refresh</span>
        </button>
      </header>

      {/* Hero */}
      <div className="flex flex-col items-center mt-6 mb-8">
          <div className="relative mb-6 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
              <div className="size-32 rounded-full p-1 bg-white dark:bg-[#1E1E1E] shadow-floating relative z-10 group-active:scale-95 transition-transform">
                  <img src={avatars[activeIdentity]} className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="absolute bottom-0 right-0 size-10 bg-googleBlue rounded-full flex items-center justify-center shadow-lg z-20 border-2 border-white">
                   <span className="material-symbols-rounded text-white text-lg">edit</span>
              </div>
              {isUploading && <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center z-30"><span className="animate-spin material-symbols-rounded text-white">refresh</span></div>}
              <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>

          <GoogleGauge score={score} />
          
          <div className="bg-white dark:bg-[#1E1E1E] mt-4 px-6 py-3 rounded-2xl flex flex-col items-center shadow-sm border border-gray-100 dark:border-gray-800">
               <span className={`text-xl font-black ${tier.color} drop-shadow-sm font-display uppercase`}>{tier.name}</span>
               <span className="text-[11px] text-gray-400 font-bold mt-1">"{tier.desc}"</span>
          </div>
      </div>

      <div className="px-4 mb-8">
        <button onClick={openCreateGoodDeed} className="w-full h-16 bg-white dark:bg-[#1E1E1E] rounded-[24px] flex items-center justify-center gap-3 active:scale-95 transition-transform border-2 border-dashed border-green-200 hover:bg-green-50">
            <span className="material-symbols-rounded text-googleGreen text-3xl">add_a_photo</span>
            <span className="font-bold text-gray-700 dark:text-white">Зафиксировать Подвиг</span>
        </button>
      </div>

      <div className="px-4 space-y-6">
          
          {incomingDeeds.length > 0 && (
             <div className="animate-slideUp">
                <h3 className="text-xs font-black text-gray-400 uppercase px-2 mb-2 tracking-wider">На проверке</h3>
                {incomingDeeds.map(deed => (
                    <div key={deed.id} className="google-card p-4 flex items-center justify-between mb-3">
                         <div className="flex items-center gap-3 overflow-hidden">
                             {deed.image && <img src={deed.image} className="size-12 rounded-xl object-cover" />}
                             <span className="font-bold text-sm truncate text-gray-800 dark:text-white">{deed.description}</span>
                         </div>
                         <button onClick={() => setReviewItem(deed)} className="bg-googleGreen text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md active:scale-90 transition-transform">Оценить</button>
                    </div>
                ))}
             </div>
          )}

          {myClaims.length > 0 && (
             <div className="animate-slideUp">
                <h3 className="text-xs font-black text-gray-400 uppercase px-2 mb-2 tracking-wider">Ждут подтверждения</h3>
                {myClaims.map(c => (
                     <div key={c.id} className="google-card p-5 border-l-8 border-l-googleBlue mb-3">
                        <div className="flex justify-between items-start mb-3">
                            <span className="font-bold text-base text-gray-900 dark:text-white">{c.description}</span>
                            <span className="text-[10px] font-black bg-blue-100 text-googleBlue px-2 py-1 rounded uppercase">Исправлено</span>
                        </div>
                        <button onClick={() => handleStatusUpdate(c.id, ComplaintStatus.Compensated)} className="w-full py-3 bg-googleBlue text-white text-sm font-bold rounded-xl shadow-md active:scale-95 transition-transform">
                            Подтвердить и Закрыть
                        </button>
                     </div>
                ))}
             </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase px-2 tracking-wider">Мои "Грехи"</h3>
            {pendingComplaints.length === 0 && (
                <div className="google-card p-8 text-center bg-gray-50 border-none">
                    <span className="text-4xl block mb-2">🎉</span>
                    <p className="text-sm font-bold text-gray-500">Чистота и порядок!</p>
                </div>
            )}
            {pendingComplaints.map(c => (
                 <div key={c.id} className="google-card p-6 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <span className="text-[10px] font-black text-googleRed uppercase tracking-wide bg-red-50 px-2 py-0.5 rounded">{c.category}</span>
                            <p className="font-bold text-gray-900 dark:text-white text-lg mt-2 leading-tight">{c.description}</p>
                        </div>
                        <span className="text-googleRed font-black text-xl whitespace-nowrap">{c.points} pts</span>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-2xl flex items-center gap-3 mb-5 border border-orange-100 dark:border-orange-800">
                        <span className="material-symbols-rounded text-googleYellow text-xl">warning</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-orange-100">{c.compensation}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleStatusUpdate(c.id, ComplaintStatus.PendingAppeal)} className="py-3 rounded-xl text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200">В Суд</button>
                        <button onClick={() => handleStatusUpdate(c.id, ComplaintStatus.PendingConfirmation)} className="bg-googleGreen text-white py-3 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-transform">Я исправился</button>
                    </div>
                </div>
            ))}
          </div>
      </div>

      {/* Review Modal */}
      {reviewItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
              <div className="google-card w-full max-w-sm p-8 relative animate-pop">
                  <button onClick={() => setReviewItem(null)} className="absolute top-4 right-4 size-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"><span className="material-symbols-rounded text-gray-600">close</span></button>
                  <h3 className="font-black text-2xl text-gray-900 dark:text-white mb-8 font-display">Оценить поступок</h3>
                  
                  <div className="flex justify-between items-end mb-4">
                      <span className="text-googleGreen font-black text-6xl">+{reviewPoints}</span>
                  </div>

                  <input type="range" min="5" max="100" step="5" value={reviewPoints} onChange={(e) => setReviewPoints(Number(e.target.value))} className="w-full h-4 bg-gray-200 rounded-full appearance-none cursor-pointer accent-googleGreen mb-8" />
                  
                  <button onClick={handleApproveDeed} className="w-full py-4 bg-googleGreen text-white font-bold rounded-2xl shadow-xl text-lg active:scale-95 transition-transform">Подтвердить</button>
              </div>
          </div>
      )}
    </div>
  );
};