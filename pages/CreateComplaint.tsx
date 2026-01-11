import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CATEGORIES, COMPENSATIONS, UserType, Complaint, ComplaintStatus, ActivityType } from '../types';
import { submitComplaint } from '../services/sheetService';

export const CreateComplaint: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine who is being accused based on navigation state or local storage logic
  // If I am Vikulya (in Profile), I accuse Yanik.
  const myIdentity = (localStorage.getItem('currentUserIdentity') as UserType) || UserType.Vikulya;
  const defaultAccused = myIdentity === UserType.Vikulya ? UserType.Yanik : UserType.Vikulya;

  const [accusedUser] = useState<UserType>((location.state as any)?.accusedUser || defaultAccused);
  
  // Custom Emoji States
  const [customEmoji, setCustomEmoji] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[0] | null>(null);
  
  const [description, setDescription] = useState('');
  
  const [compensation, setCompensation] = useState<typeof COMPENSATIONS[0] | null>(null);
  const [customCompensation, setCustomCompensation] = useState('');
  const [customCompEmoji, setCustomCompEmoji] = useState('');

  const handleNext = async () => {
    if (step === 1) {
      if ((category || customEmoji) && description) setStep(2);
      else alert("Выберите категорию (или эмодзи) и добавьте описание!");
    } else if (step === 2) {
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
         user: accusedUser, // The person receiving the negative points
         type: ActivityType.Complaint,
         category: finalCategory,
         categoryIcon: finalIcon,
         description: description,
         compensation: finalCompText,
         compensationIcon: finalCompIcon,
         timestamp: new Date().toISOString(),
         status: ComplaintStatus.InProgress,
         points: -10 // Default penalty
       };

       const success = await submitComplaint(newComplaint);
       setIsSubmitting(false);
       if (success) {
         navigate('/feed');
       } else {
         alert("Ошибка при сохранении!");
       }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 flex items-center bg-white/80 backdrop-blur-md p-4 border-b border-gray-100">
        <button onClick={() => step === 1 ? navigate('/') : setStep(step - 1)} className="text-gray-900 flex size-10 items-center justify-start">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-gray-900 text-lg font-bold flex-1 text-center pr-10">
            {step === 1 ? 'Жалоба' : 'Требование'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Stepper */}
        <div className="px-6 py-6">
            <div className="flex items-center justify-center gap-2">
                 <div className={`h-2 w-8 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-primary/20'}`}></div>
                 <div className={`h-2 w-8 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-primary/20'}`}></div>
            </div>
        </div>

        {step === 1 && (
            <>
                <div className="px-4">
                    <h3 className="text-2xl font-bold pt-2">Что случилось?</h3>
                    <p className="text-gray-500 text-sm mt-1">Виновник: <span className="font-bold text-red-500">{accusedUser}</span></p>
                </div>

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
                    {/* Custom Emoji Input */}
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

                <div className="px-4 py-3">
                    <p className="text-base font-bold pb-2">Подробности</p>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-base min-h-[120px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="Опишите ситуацию..."
                    ></textarea>
                </div>
            </>
        )}

        {step === 2 && (
            <>
                <div className="text-center mb-8 px-4">
                    <h2 className="text-[28px] font-bold mb-2">Компенсация</h2>
                    <p className="text-gray-500">Цена прощения</p>
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-gray-100 flex justify-center z-20">
        <button 
            onClick={handleNext}
            disabled={isSubmitting}
            className="w-full max-w-[480px] h-14 bg-primary text-white text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
        >
            {isSubmitting ? (
                 <span>Отправка...</span>
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