
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
    <div className="min-h-screen pb-28 flex flex-col items-center pt-safe-top">
      {/* Header Banner */}
      <div className="w-full glass-panel border-b border-white/10 p-6 text-center mb-6 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-400 animate-pulse"></div>
         <div className="size-16 mx-auto bg-indigo-500/20 rounded-full flex items-center justify-center mb-3 shadow-inner">
             <span className="material-symbols-outlined text-4xl text-indigo-400">gavel</span>
         </div>
         <h1 className="text-2xl font-black font-display text-gray-900 dark:text-white drop-shadow-sm">Семейный Суд</h1>
         <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Gemini AI Justice</p>

         <div className="flex justify-center mt-4">
             <div className="glass-panel p-1 rounded-full flex">
                 <button onClick={() => setCurrentUser(UserType.Vikulya)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${currentUser === UserType.Vikulya ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-500'}`}>Викуля</button>
                 <button onClick={() => setCurrentUser(UserType.Yanik)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${currentUser === UserType.Yanik ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-500'}`}>Яник</button>
             </div>
         </div>
      </div>

      {/* Case List */}
      <div className="w-full max-w-md px-4 space-y-4">
        {appeals.length === 0 && (
             <div className="glass-panel p-8 rounded-3xl text-center opacity-60">
                 <span className="text-4xl block mb-2">⚖️</span>
                 <p className="text-sm">Судебных дел нет</p>
             </div>
        )}

        {appeals.map(c => (
             <div key={c.id} className={`glass-panel overflow-hidden transition-all duration-300 ${activeCaseId === c.id ? 'ring-2 ring-indigo-500/50' : ''}`}>
                 <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => activeCaseId === c.id ? setActiveCaseId(null) : handleOpenCase(c)}>
                     <div>
                         <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Дело #{c.id.slice(-4)}</span>
                         <h3 className="font-bold text-gray-800 dark:text-white">{c.category}</h3>
                     </div>
                     <span className={`material-symbols-outlined text-gray-400 transition-transform ${activeCaseId === c.id ? 'rotate-180' : ''}`}>expand_more</span>
                 </div>

                 {activeCaseId === c.id && (
                     <div className="p-4 pt-0 animate-fadeIn">
                         <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 mb-4 text-sm">
                             <p className="font-medium text-gray-800 dark:text-white italic">"{c.description}"</p>
                             <div className="flex justify-between mt-2 text-xs font-bold text-orange-600 dark:text-orange-300">
                                 <span>{c.type}</span>
                                 <span>{c.points} баллов</span>
                             </div>
                         </div>

                         <div className="space-y-4 mb-6">
                             <div>
                                 <label className="text-xs font-bold text-gray-400 uppercase mb-2 block ml-1">Аргумент Викули</label>
                                 <textarea 
                                    className={`glass-input w-full p-3 text-sm outline-none transition-all ${currentUser !== UserType.Vikulya ? 'opacity-50' : 'focus:ring-2 focus:ring-indigo-500/50'}`}
                                    placeholder={currentUser === UserType.Vikulya ? "Ваша позиция..." : "Ожидает..."}
                                    readOnly={currentUser !== UserType.Vikulya}
                                    value={plaintiffText}
                                    onChange={(e) => setPlaintiffText(e.target.value)}
                                    rows={3}
                                 />
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-gray-400 uppercase mb-2 block ml-1">Аргумент Яника</label>
                                 <textarea 
                                    className={`glass-input w-full p-3 text-sm outline-none transition-all ${currentUser !== UserType.Yanik ? 'opacity-50' : 'focus:ring-2 focus:ring-indigo-500/50'}`}
                                    placeholder={currentUser === UserType.Yanik ? "Ваша позиция..." : "Ожидает..."}
                                    readOnly={currentUser !== UserType.Yanik}
                                    value={defendantText}
                                    onChange={(e) => setDefendantText(e.target.value)}
                                    rows={3}
                                 />
                             </div>
                         </div>

                         <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => saveArguments(c)} className="glass-btn-secondary py-3 rounded-xl font-bold text-sm">Сохранить</button>
                             <button 
                                onClick={() => callTheJudge(c)}
                                disabled={isJudging}
                                className="py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 text-sm"
                             >
                                 {isJudging ? <span className="animate-spin material-symbols-outlined">refresh</span> : <>Суд AI <span className="material-symbols-outlined text-lg">gavel</span></>}
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