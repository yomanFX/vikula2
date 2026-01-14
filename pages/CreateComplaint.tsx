
import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CATEGORIES, COMPENSATIONS, UserType, Complaint, ComplaintStatus, ActivityType } from '../types';
import { submitComplaint } from '../services/sheetService';
import { compressImage } from '../services/imageService';
import { useComplaints } from '../context/ComplaintContext';

export const CreateComplaint: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshData } = useComplaints();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myIdentity = (localStorage.getItem('currentUserIdentity') as UserType) || UserType.Vikulya;
  const isGoodDeedMode = (location.state as any)?.mode === 'good_deed';
  const defaultAccused = isGoodDeedMode ? myIdentity : (myIdentity === UserType.Vikulya ? UserType.Yanik : UserType.Vikulya);
  const [accusedUser] = useState<UserType>(defaultAccused);
  
  const [customEmoji, setCustomEmoji] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[0] | null>(null);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [compensation, setCompensation] = useState<typeof COMPENSATIONS[0] | null>(null);
  const [customCompensation, setCustomCompensation] = useState('');
  const [penaltyPoints, setPenaltyPoints] = useState(10);
  const customCompInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try { const compressed = await compressImage(file); setImage(compressed); } catch (error) { alert("Ошибка фото"); }
      }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!isGoodDeedMode && !category && !customEmoji) { alert("Выберите категорию!"); return; }
      if (!description) { alert("Добавьте описание!"); return; }

      if (isGoodDeedMode) {
          setIsSubmitting(true);
          const newComplaint: Complaint = {
             id: Date.now().toString(), user: myIdentity, type: ActivityType.GoodDeed, category: 'Доброе дело', categoryIcon: '🌟',
             description: description, compensation: '', compensationIcon: '', timestamp: new Date().toISOString(), status: ComplaintStatus.PendingApproval, points: 0, image: image || undefined
          };
          await submitComplaint(newComplaint);
          await refreshData();
          navigate('/profile');
          return;
      }
      setStep(2);
    } else if (step === 2) {
       if (!compensation && !customCompensation) { alert("Выберите метод компенсации!"); return; }
       setIsSubmitting(true);
       const newComplaint: Complaint = {
         id: Date.now().toString(), user: accusedUser, type: ActivityType.Complaint,
         category: customEmoji ? 'Другое' : category!.label, categoryIcon: customEmoji || category!.icon,
         description: description, compensation: customCompensation || compensation!.label, compensationIcon: customCompensation ? 'edit' : compensation!.icon,
         timestamp: new Date().toISOString(), status: ComplaintStatus.InProgress, points: -Math.abs(penaltyPoints), image: image || undefined
       };
       await submitComplaint(newComplaint);
       await refreshData();
       navigate('/feed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto pt-safe-top bg-[#F2F6FC] dark:bg-[#121212]">
      {/* Header */}
      <div className="sticky top-0 z-20 px-6 py-5 flex items-center justify-between bg-[#F2F6FC]/95 dark:bg-[#121212]/95 backdrop-blur-sm">
        <button onClick={() => step === 1 ? navigate('/') : setStep(step - 1)} className="size-10 rounded-full bg-white dark:bg-[#1E1E1E] shadow-sm flex items-center justify-center hover:bg-gray-100">
          <span className="material-symbols-rounded text-gray-600">arrow_back</span>
        </button>
        <h2 className="text-xl font-black text-gray-900 dark:text-white font-display">
            {isGoodDeedMode ? 'Новый Подвиг' : (step === 1 ? 'Новое Дело' : 'Вердикт')}
        </h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32 px-6 space-y-6">
        {step === 1 && (
            <>
                <div className="google-card p-4 rounded-[24px] text-center bg-white dark:bg-[#1E1E1E]">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{isGoodDeedMode ? 'ГЕРОЙ' : 'ОБВИНЯЕМЫЙ'}</p>
                    <h3 className="text-3xl font-black text-googleBlue font-display">{accusedUser}</h3>
                </div>

                {!isGoodDeedMode && (
                    <div className="grid grid-cols-3 gap-4">
                        {CATEGORIES.map(cat => (
                            <div key={cat.id} onClick={() => { setCategory(cat); setCustomEmoji(''); }}
                                className={`aspect-square rounded-[24px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border-2 shadow-sm
                                    ${category?.id === cat.id && !customEmoji 
                                        ? 'border-googleBlue bg-blue-50 dark:bg-blue-900/30 scale-105' 
                                        : 'bg-white dark:bg-[#1E1E1E] border-transparent hover:border-gray-200'}`}
                            >
                                <span className="text-3xl mb-1">{cat.icon}</span>
                                <span className="text-[10px] font-black text-gray-500 uppercase">{cat.label}</span>
                            </div>
                        ))}
                         <div className={`aspect-square rounded-[24px] flex flex-col items-center justify-center cursor-pointer border-2 bg-white dark:bg-[#1E1E1E] ${customEmoji ? 'border-googleBlue' : 'border-transparent'}`}>
                            <input type="text" value={customEmoji} onChange={(e) => { setCustomEmoji(e.target.value); setCategory(null); }} className="bg-transparent text-center text-3xl w-full outline-none font-bold placeholder-gray-300" placeholder="+" maxLength={2} />
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <textarea 
                        value={description} onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-6 min-h-[160px] text-lg font-medium bg-white dark:bg-[#1E1E1E] rounded-[24px] shadow-sm focus:ring-4 focus:ring-blue-100 outline-none placeholder-gray-400 border border-transparent focus:border-googleBlue/20 transition-all resize-none"
                        placeholder={isGoodDeedMode ? "Как вы спасли мир сегодня?" : "Суть претензии..."}
                    />

                    <div onClick={() => fileInputRef.current?.click()} className="h-24 bg-white dark:bg-[#1E1E1E] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-[24px] flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden active:scale-95">
                        {image ? (
                             <img src={image} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                        ) : (
                             <>
                                <span className="material-symbols-rounded text-gray-400">add_a_photo</span>
                                <span className="text-xs font-black text-gray-400 uppercase">Фото</span>
                             </>
                        )}
                        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                    </div>
                </div>
            </>
        )}

        {step === 2 && !isGoodDeedMode && (
            <>
                <div className="google-card p-8 rounded-[32px] border-none bg-white dark:bg-[#1E1E1E]">
                    <div className="flex justify-between items-center mb-6">
                         <span className="text-xs font-black text-gray-400 uppercase tracking-widest">УРОВЕНЬ БОЛИ</span>
                         <span className="text-4xl font-black text-googleRed font-display">-{penaltyPoints}</span>
                    </div>
                    <input type="range" min="5" max="100" step="5" value={penaltyPoints} onChange={(e) => setPenaltyPoints(Number(e.target.value))} className="w-full h-6 bg-gray-100 dark:bg-gray-800 rounded-full appearance-none cursor-pointer accent-googleRed" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {COMPENSATIONS.map(comp => (
                        <div key={comp.id} onClick={() => { setCompensation(comp); setCustomCompensation(''); }}
                            className={`p-4 rounded-[24px] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all border-2 shadow-sm
                                ${compensation?.id === comp.id && !customCompensation 
                                    ? 'border-googleBlue bg-blue-50 dark:bg-blue-900/20' 
                                    : 'bg-white dark:bg-[#1E1E1E] border-transparent'}`}
                        >
                            <div className={`size-10 rounded-full flex items-center justify-center ${comp.bg} ${comp.color}`}><span className="material-symbols-rounded">{comp.icon}</span></div>
                            <span className="font-bold text-xs text-center leading-tight">{comp.label}</span>
                        </div>
                    ))}
                    <div onClick={() => { setCompensation(null); customCompInputRef.current?.focus(); }} className={`col-span-2 p-4 rounded-[24px] flex items-center gap-4 cursor-pointer border-2 bg-white dark:bg-[#1E1E1E] shadow-sm ${customCompensation ? 'border-googleBlue' : 'border-transparent'}`}>
                         <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center"><span className="material-symbols-rounded text-gray-500">edit</span></div>
                         <input ref={customCompInputRef} type="text" className="bg-transparent w-full outline-none font-bold placeholder-gray-400 text-sm" placeholder="Свой вариант..." value={customCompensation} onChange={(e) => { setCustomCompensation(e.target.value); setCompensation(null); }} />
                    </div>
                </div>
            </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 z-30 pb-8 flex justify-center pointer-events-none">
        <button onClick={handleNext} disabled={isSubmitting} className="pointer-events-auto w-full max-w-[400px] h-16 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-lg font-black rounded-full shadow-2xl flex items-center justify-center gap-3 active:scale-90 transition-transform">
            {isSubmitting ? 'Отправка...' : step === 1 && !isGoodDeedMode ? 'Далее' : 'Готово'}
            <span className="material-symbols-rounded">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};