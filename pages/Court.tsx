
import React, { useState } from 'react';
import { updateComplaint } from '../services/sheetService';
import { Complaint, ComplaintStatus, UserType, ActivityType } from '../types';
import { judgeCase } from '../services/geminiService';
import { useComplaints } from '../context/ComplaintContext';

export const Court: React.FC = () => {
  const { complaints, refreshData } = useComplaints();
  const [currentUser, setCurrentUser] = useState<UserType>(() => {
    return (localStorage.getItem('currentUserIdentity') as UserType) || UserType.Vikulya;
  });

  const [plaintiffText, setPlaintiffText] = useState('');
  const [defendantText, setDefendantText] = useState('');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isJudging, setIsJudging] = useState(false);

  const appeals = complaints.filter(c => c.status === ComplaintStatus.PendingAppeal);

  const handleOpenCase = (c: Complaint) => {
    setActiveCaseId(c.id);
    setPlaintiffText(c.appeal?.plaintiffArg || '');
    setDefendantText(c.appeal?.defendantArg || '');
  };

  const saveArguments = async (c: Complaint) => {
      const updated: Complaint = {
          ...c,
          appeal: { ...(c.appeal || { isResolved: false }), plaintiffArg: plaintiffText, defendantArg: defendantText }
      };
      await updateComplaint(updated);
      await refreshData();
      alert("Аргументы сохранены.");
  };

  const callTheJudge = async (c: Complaint) => {
    if (!plaintiffText || !defendantText) { alert("Обе стороны должны высказаться!"); return; }
    setIsJudging(true);
    const fullComplaint: Complaint = { ...c, appeal: { plaintiffArg: plaintiffText, defendantArg: defendantText, isResolved: false } };

    try {
        const verdict = await judgeCase(fullComplaint);
        let newStatus = ComplaintStatus.JudgedValid;
        let finalPoints = c.points;

        if (verdict.decision === 'annul') { newStatus = ComplaintStatus.Annulled; finalPoints = 0; } 
        else if (verdict.decision === 'reduce') { finalPoints = verdict.newPoints ? -Math.abs(verdict.newPoints) : Math.ceil(c.points / 2); }

        const resolvedComplaint: Complaint = {
            ...fullComplaint,
            status: newStatus,
            points: finalPoints,
            appeal: { ...fullComplaint.appeal!, isResolved: true, judgeReasoning: verdict.explanation }
        };

        await updateComplaint(resolvedComplaint);
        alert("Суд вынес решение!");
    } catch (e) { alert("Ошибка судьи."); } finally { setIsJudging(false); setActiveCaseId(null); await refreshData(); }
  };

  return (
    <div className="min-h-screen pb-32 flex flex-col items-center pt-safe-top bg-[#F2F6FC] dark:bg-[#121212]">
      {/* Header Banner */}
      <div className="w-full bg-white dark:bg-[#1E1E1E] border-b border-gray-100 dark:border-gray-800 p-8 text-center mb-8 relative overflow-hidden shadow-sm">
         <div className="size-20 mx-auto bg-indigo-50 rounded-[24px] flex items-center justify-center mb-4 transform rotate-3">
             <span className="material-symbols-rounded text-5xl text-indigo-500">gavel</span>
         </div>
         <h1 className="text-3xl font-black font-display text-gray-900 dark:text-white tracking-tight">Семейный Суд</h1>
         <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest mt-2">Gemini AI Justice</p>

         <div className="flex justify-center mt-6">
             <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-full flex">
                 <button onClick={() => setCurrentUser(UserType.Vikulya)} className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${currentUser === UserType.Vikulya ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500'}`}>Викуля</button>
                 <button onClick={() => setCurrentUser(UserType.Yanik)} className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${currentUser === UserType.Yanik ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500'}`}>Яник</button>
             </div>
         </div>
      </div>

      {/* Case List */}
      <div className="w-full max-w-md px-4 space-y-4">
        {appeals.length === 0 && (
             <div className="google-card p-10 rounded-[32px] text-center bg-white border-dashed border-2 border-gray-200">
                 <span className="text-6xl block mb-4 grayscale opacity-50">⚖️</span>
                 <p className="text-base font-bold text-gray-400">Судебных дел нет</p>
             </div>
        )}

        {appeals.map(c => (
             <div key={c.id} className={`google-card overflow-hidden transition-all duration-300 ${activeCaseId === c.id ? 'ring-4 ring-indigo-100' : ''}`}>
                 <div className="p-6 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-[#252525]" onClick={() => activeCaseId === c.id ? setActiveCaseId(null) : handleOpenCase(c)}>
                     <div>
                         <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">Дело #{c.id.slice(-4)}</span>
                         <h3 className="font-bold text-lg text-gray-900 dark:text-white">{c.category}</h3>
                     </div>
                     <span className={`material-symbols-rounded text-gray-400 text-3xl transition-transform ${activeCaseId === c.id ? 'rotate-180' : ''}`}>expand_more</span>
                 </div>

                 {activeCaseId === c.id && (
                     <div className="p-6 pt-0 animate-slideUp">
                         <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl mb-6 text-sm border border-indigo-100 dark:border-indigo-800">
                             <p className="font-bold text-gray-800 dark:text-white italic text-lg leading-snug">"{c.description}"</p>
                             <div className="flex justify-between mt-3 text-xs font-black text-indigo-600 dark:text-indigo-300 uppercase">
                                 <span>{c.type}</span>
                                 <span>{c.points} баллов</span>
                             </div>
                         </div>

                         <div className="space-y-5 mb-8">
                             <div>
                                 <label className="text-xs font-black text-gray-400 uppercase mb-2 block ml-1">Аргумент Викули</label>
                                 <textarea 
                                    className={`google-input w-full p-4 text-sm transition-all min-h-[100px] ${currentUser !== UserType.Vikulya ? 'opacity-50 grayscale' : ''}`}
                                    placeholder={currentUser === UserType.Vikulya ? "Ваша позиция..." : "Ожидает аргументов..."}
                                    readOnly={currentUser !== UserType.Vikulya}
                                    value={plaintiffText}
                                    onChange={(e) => setPlaintiffText(e.target.value)}
                                 />
                             </div>
                             <div>
                                 <label className="text-xs font-black text-gray-400 uppercase mb-2 block ml-1">Аргумент Яника</label>
                                 <textarea 
                                    className={`google-input w-full p-4 text-sm transition-all min-h-[100px] ${currentUser !== UserType.Yanik ? 'opacity-50 grayscale' : ''}`}
                                    placeholder={currentUser === UserType.Yanik ? "Ваша позиция..." : "Ожидает аргументов..."}
                                    readOnly={currentUser !== UserType.Yanik}
                                    value={defendantText}
                                    onChange={(e) => setDefendantText(e.target.value)}
                                 />
                             </div>
                         </div>

                         <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => saveArguments(c)} className="py-4 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">Сохранить</button>
                             <button 
                                onClick={() => callTheJudge(c)}
                                disabled={isJudging}
                                className="py-4 rounded-xl font-bold text-white bg-indigo-600 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 text-sm active:scale-95 transition-transform"
                             >
                                 {isJudging ? <span className="animate-spin material-symbols-rounded">refresh</span> : <>Суд AI <span className="material-symbols-rounded text-lg">gavel</span></>}
                             </button>
                         </div>
                     </div>
                 )}
             </div>
        ))}
      </div>
    </div>
  );
};