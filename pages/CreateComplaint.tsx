
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
    <div className="min-h-screen flex flex-col max-w-md mx-auto pt-safe-top">
      {/* Glass Header */}
      <div className="sticky top-0 z-20 px-4 py-4 flex items-center justify-between">
        <button onClick={() => step === 1 ? navigate('/') : setStep(step - 1)} className="glass-panel size-10 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-gray-500">arrow_back_ios_new</span>
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white drop-shadow-sm">
            {isGoodDeedMode ? 'Подвиг' : (step === 1 ? 'Обвинение' : 'Наказание')}
        </h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32 px-4 space-y-6">
        {step === 1 && (
            <>
                <div className="glass-panel p-6 rounded-3xl text-center">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">{isGoodDeedMode ? 'Автор' : 'Виновник'}</p>
                    <h3 className="text-3xl font-black text-primary drop-shadow-sm">{accusedUser}</h3>
                </div>

                {!isGoodDeedMode && (
                    <div className="grid grid-cols-3 gap-3">
                        {CATEGORIES.map(cat => (
                            <div key={cat.id} onClick={() => { setCategory(cat); setCustomEmoji(''); }}
                                className={`glass-panel aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border-2
                                    ${category?.id === cat.id && !customEmoji ? 'border-primary bg-primary/20 scale-105' : 'border-transparent hover:bg-white/10'}`}
                            >
                                <span className="text-4xl mb-2">{cat.icon}</span>
                                <span className="text-[10px] font-bold">{cat.label}</span>
                            </div>
                        ))}
                         <div className={`glass-panel aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer border-2 ${customEmoji ? 'border-primary bg-primary/20' : 'border-transparent'}`}>
                            <input type="text" value={customEmoji} onChange={(e) => { setCustomEmoji(e.target.value); setCategory(null); }} className="bg-transparent text-center text-4xl w-full outline-none" placeholder="➕" maxLength={2} />
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <textarea 
                        value={description} onChange={(e) => setDescription(e.target.value)}
                        className="glass-input w-full p-5 min-h-[140px] text-base focus:ring-2 focus:ring-primary/50 outline-none placeholder-gray-400"
                        placeholder={isGoodDeedMode ? "Опишите ваш героический поступок..." : "Что этот человек натворил?"}
                    />

                    <div onClick={() => fileInputRef.current?.click()} className="glass-panel border-2 border-dashed border-gray-400/30 rounded-2xl h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors relative overflow-hidden">
                        {image ? (
                             <img src={image} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                             <>
                                <span className="material-symbols-outlined text-3xl text-gray-400 mb-1">add_a_photo</span>
                                <span className="text-xs font-bold text-gray-500 uppercase">Добавить фото</span>
                             </>
                        )}
                        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                    </div>
                </div>
            </>
        )}

        {step === 2 && !isGoodDeedMode && (
            <>
                <div className="glass-panel p-6 rounded-3xl border border-red-500/30">
                    <div className="flex justify-between items-center mb-4">
                         <span className="text-xs font-bold text-gray-400 uppercase">Уровень боли</span>
                         <span className="text-3xl font-black text-red-500">-{penaltyPoints}</span>
                    </div>
                    <input type="range" min="5" max="100" step="5" value={penaltyPoints} onChange={(e) => setPenaltyPoints(Number(e.target.value))} className="w-full h-2 bg-gray-200/20 rounded-lg appearance-none cursor-pointer accent-red-500" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {COMPENSATIONS.map(comp => (
                        <div key={comp.id} onClick={() => { setCompensation(comp); setCustomCompensation(''); }}
                            className={`glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all border-2
                                ${compensation?.id === comp.id && !customCompensation ? 'border-primary bg-primary/10' : 'border-transparent'}`}
                        >
                            <div className={`size-12 rounded-full flex items-center justify-center ${comp.bg} ${comp.color}`}><span className="material-symbols-outlined">{comp.icon}</span></div>
                            <span className="font-bold text-xs">{comp.label}</span>
                        </div>
                    ))}
                    <div onClick={() => { setCompensation(null); customCompInputRef.current?.focus(); }} className={`col-span-2 glass-panel p-4 rounded-2xl flex items-center gap-4 cursor-pointer border-2 ${customCompensation ? 'border-primary' : 'border-transparent'}`}>
                         <div className="size-10 rounded-full bg-gray-500/10 flex items-center justify-center"><span className="material-symbols-outlined">edit</span></div>
                         <input ref={customCompInputRef} type="text" className="bg-transparent w-full outline-none font-bold placeholder-gray-400" placeholder="Свой вариант..." value={customCompensation} onChange={(e) => { setCustomCompensation(e.target.value); setCompensation(null); }} />
                    </div>
                </div>
            </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 z-30 pb-8 flex justify-center pointer-events-none">
        <button onClick={handleNext} disabled={isSubmitting} className="pointer-events-auto w-full max-w-[480px] h-14 bg-primary text-white text-lg font-bold rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-2 active:scale-95 transition-transform">
            {isSubmitting ? 'Отправка...' : step === 1 && !isGoodDeedMode ? 'Далее' : 'Отправить'}
            <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};