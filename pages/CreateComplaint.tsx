
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

  // State
  const myIdentity = (localStorage.getItem('currentUserIdentity') as UserType) || UserType.Vikulya;
  const isGoodDeedMode = (location.state as any)?.mode === 'good_deed';
  
  // If Good Deed, I am the user (accusedUser for logic sake is ME). 
  // If Complaint, Accused is OTHER.
  const defaultAccused = isGoodDeedMode 
    ? myIdentity 
    : (myIdentity === UserType.Vikulya ? UserType.Yanik : UserType.Vikulya);

  const [accusedUser] = useState<UserType>(defaultAccused);
  
  const [customEmoji, setCustomEmoji] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[0] | null>(null);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  
  const [compensation, setCompensation] = useState<typeof COMPENSATIONS[0] | null>(null);
  const [customCompensation, setCustomCompensation] = useState('');
  const [customCompEmoji, setCustomCompEmoji] = useState('');
  
  // New state for penalty points
  const [penaltyPoints, setPenaltyPoints] = useState(10);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const compressed = await compressImage(file);
              setImage(compressed);
          } catch (error) {
              alert("Ошибка обработки фото");
          }
      }
  };

  const handleNext = async () => {
    // --- STEP 1 LOGIC ---
    if (step === 1) {
      // Validation
      if (!isGoodDeedMode && !category && !customEmoji) {
          alert("Выберите категорию!");
          return;
      }
      if (!description) {
          alert("Добавьте описание!");
          return;
      }

      // If Good Deed, we SUBMIT immediately (No step 2)
      if (isGoodDeedMode) {
          setIsSubmitting(true);
          const newComplaint: Complaint = {
             id: Date.now().toString(),
             user: myIdentity, // I did the good deed
             type: ActivityType.GoodDeed,
             category: 'Доброе дело',
             categoryIcon: '🌟',
             description: description,
             compensation: '',
             compensationIcon: '',
             timestamp: new Date().toISOString(),
             status: ComplaintStatus.PendingApproval, // Partner must approve
             points: 0, // Points decided by partner later
             image: image || undefined
          };
          await submitComplaint(newComplaint);
          await refreshData();
          setIsSubmitting(false);
          navigate('/profile'); // Go back to profile
          return;
      }

      // If Complaint, Go to Step 2
      setStep(2);
    } 
    
    // --- STEP 2 LOGIC (Complaints Only) ---
    else if (step === 2) {
       if (!compensation && !customCompensation) {
         alert("Выберите метод компенсации!");
         return;
       }
       setIsSubmitting(true);
       
       const finalCategory = customEmoji ? 'Другое' : category!.label;
       const finalIcon = customEmoji || category!.icon;

       const finalCompText = customCompensation || compensation!.label;
       const finalCompIcon = customCompEmoji || (customCompensation ? 'edit' : compensation!.icon);

       const newComplaint: Complaint = {
         id: Date.now().toString(),
         user: accusedUser,
         type: ActivityType.Complaint,
         category: finalCategory,
         categoryIcon: finalIcon,
         description: description,
         compensation: finalCompText,
         compensationIcon: finalCompIcon,
         timestamp: new Date().toISOString(),
         status: ComplaintStatus.InProgress,
         // Use the negative value of the slider
         points: -Math.abs(penaltyPoints),
         image: image || undefined
       };

       await submitComplaint(newComplaint);
       await refreshData();
       setIsSubmitting(false);
       navigate('/feed');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative pt-safe-top">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 flex items-center bg-white/80 backdrop-blur-md p-4 border-b border-gray-100">
        <button onClick={() => step === 1 ? navigate('/') : setStep(step - 1)} className="text-gray-900 flex size-10 items-center justify-start">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-gray-900 text-lg font-bold flex-1 text-center pr-10">
            {isGoodDeedMode ? 'Доброе дело' : (step === 1 ? 'Жалоба' : 'Требование')}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Stepper (Only for Complaints) */}
        {!isGoodDeedMode && (
            <div className="px-6 py-6">
                <div className="flex items-center justify-center gap-2">
                    <div className={`h-2 w-8 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-primary/20'}`}></div>
                    <div className={`h-2 w-8 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-primary/20'}`}></div>
                </div>
            </div>
        )}

        {step === 1 && (
            <>
                <div className="px-4">
                    <h3 className="text-2xl font-bold pt-2">{isGoodDeedMode ? 'Чем гордимся?' : 'Что случилось?'}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                        {isGoodDeedMode ? 'Автор:' : 'Виновник:'} <span className="font-bold text-primary">{accusedUser}</span>
                    </p>
                </div>

                {/* Categories (Only for Complaint) */}
                {!isGoodDeedMode && (
                    <div className="grid grid-cols-3 gap-3 p-4">
                        {CATEGORIES.map(cat => (
                            <div 
                                key={cat.id}
                                onClick={() => { setCategory(cat); setCustomEmoji(''); }}
                                className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer aspect-square
                                    ${category?.id === cat.id && !customEmoji ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white hover:border-primary/50'}`}
                            >
                                <div className="text-3xl mb-1">{cat.icon}</div>
                                <p className="text-[10px] font-bold text-center leading-tight">{cat.label}</p>
                            </div>
                        ))}
                         <div 
                            className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all aspect-square
                                ${customEmoji ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white'}`}
                        >
                            <input 
                                type="text" 
                                value={customEmoji}
                                onChange={(e) => { setCustomEmoji(e.target.value); setCategory(null); }}
                                className="w-full text-center text-3xl bg-transparent outline-none p-0 m-0"
                                placeholder="➕"
                                maxLength={2}
                            />
                            <p className="text-[10px] font-bold text-center leading-tight text-gray-400 mt-1">Свой эмодзи</p>
                        </div>
                    </div>
                )}

                <div className="px-4 py-3 space-y-4">
                    {/* Description */}
                    <div>
                        <p className="text-base font-bold pb-2">Подробности</p>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-base min-h-[120px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder={isGoodDeedMode ? "Расскажите, какой подвиг совершили..." : "Опишите ситуацию..."}
                        ></textarea>
                    </div>

                    {/* Image Upload (Especially for Good Deeds) */}
                    <div>
                        <p className="text-base font-bold pb-2">Фото доказательство</p>
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                        
                        {!image ? (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors bg-gray-50"
                            >
                                <span className="material-symbols-outlined text-3xl mb-1">add_a_photo</span>
                                <span className="text-xs font-bold uppercase">Загрузить фото</span>
                            </button>
                        ) : (
                            <div className="relative w-full h-48 rounded-xl overflow-hidden shadow-sm border border-gray-200 group">
                                <img src={image} alt="Evidence" className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => setImage(null)}
                                    className="absolute top-2 right-2 size-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </>
        )}

        {step === 2 && !isGoodDeedMode && (
            <>
                <div className="text-center mb-6 px-4">
                    <h2 className="text-[28px] font-bold mb-2">Компенсация</h2>
                    <p className="text-gray-500">Цена прощения</p>
                </div>

                {/* PENALTY SLIDER */}
                <div className="px-4 mb-8">
                    <div className="bg-white p-4 rounded-xl shadow-ios border border-red-100">
                        <div className="flex justify-between items-end mb-4">
                             <div>
                                <h3 className="font-bold text-gray-800">Уровень штрафа</h3>
                                <p className="text-xs text-gray-400">Насколько сильно накосячено?</p>
                             </div>
                             <span className="text-2xl font-black text-red-500">
                                 -{penaltyPoints}
                             </span>
                        </div>
                        <input 
                            type="range" 
                            min="5" 
                            max="100" 
                            step="5" 
                            value={penaltyPoints}
                            onChange={(e) => setPenaltyPoints(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-bold">
                            <span>Мелочь (-5)</span>
                            <span>Катастрофа (-100)</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 px-4 mb-8">
                    {COMPENSATIONS.map(comp => (
                        <button 
                            key={comp.id}
                            onClick={() => { setCompensation(comp); setCustomCompensation(''); setCustomCompEmoji(''); }}
                            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl transition-all border-2
                                ${compensation?.id === comp.id && !customCompensation ? 'border-primary bg-primary/5' : 'border-transparent bg-white shadow-ios'}`}
                        >
                            <div className={`size-14 rounded-full flex items-center justify-center ${comp.bg} ${comp.color}`}>
                                <span className="material-symbols-outlined !text-3xl">{comp.icon}</span>
                            </div>
                            <span className="font-semibold text-sm">{comp.label}</span>
                        </button>
                    ))}
                    
                    {/* Custom Option */}
                    <div className={`col-span-2 bg-white rounded-xl shadow-ios p-4 border-2 transition-all ${customCompensation ? 'border-primary' : 'border-transparent'}`}>
                         <div className="flex items-center gap-4 mb-2">
                            <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 overflow-hidden relative">
                                {customCompEmoji ? (
                                    <span className="text-2xl">{customCompEmoji}</span>
                                ) : (
                                    <span className="material-symbols-outlined">edit</span>
                                )}
                                <input 
                                    type="text" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    placeholder="Emoji"
                                    onChange={(e) => setCustomCompEmoji(e.target.value)}
                                />
                            </div>
                            <span className="font-semibold text-sm text-gray-400">Нажми на круг для эмодзи</span>
                         </div>
                         <input 
                            type="text" 
                            className="w-full border-b border-gray-200 py-2 outline-none focus:border-primary"
                            placeholder="Напишите свой вариант..."
                            value={customCompensation}
                            onChange={(e) => { setCustomCompensation(e.target.value); setCompensation(null); }}
                         />
                    </div>
                </div>
            </>
        )}
      </div>

      {/* Bottom Fixed Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-gray-100 flex justify-center z-20 pb-safe">
        <button 
            onClick={handleNext}
            disabled={isSubmitting}
            className="w-full max-w-[480px] h-14 bg-primary text-white text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
        >
            {isSubmitting ? (
                 <span>Отправка...</span>
            ) : isGoodDeedMode ? (
                 <>ОТПРАВИТЬ НА ПРОВЕРКУ <span className="material-symbols-outlined">send</span></>
            ) : step === 1 ? (
                <>Далее <span className="material-symbols-outlined">arrow_forward</span></>
            ) : (
                <>ОТПРАВИТЬ ЖАЛОБУ <span className="material-symbols-outlined">send</span></>
            )}
        </button>
      </div>
    </div>
  );
};
