
import React, { useEffect, useState } from 'react';
import { fetchComplaints, updateComplaint } from '../services/sheetService';
import { Complaint, ComplaintStatus, UserType, ActivityType } from '../types';
import { judgeCase } from '../services/geminiService';

export const Court: React.FC = () => {
  const [appeals, setAppeals] = useState<Complaint[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType>(() => {
    return (localStorage.getItem('currentUserIdentity') as UserType) || UserType.Vikulya;
  });

  const [plaintiffText, setPlaintiffText] = useState('');
  const [defendantText, setDefendantText] = useState('');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isJudging, setIsJudging] = useState(false);

  useEffect(() => {
    loadAppeals();
  }, []);

  const loadAppeals = async () => {
    const all = await fetchComplaints();
    const pending = all.filter(c => c.status === ComplaintStatus.PendingAppeal);
    setAppeals(pending);
  };

  const handleOpenCase = (c: Complaint) => {
    setActiveCaseId(c.id);
    // Load existing drafts if any (mocking this, normally from DB)
    setPlaintiffText(c.appeal?.plaintiffArg || '');
    setDefendantText(c.appeal?.defendantArg || '');
  };

  const saveArguments = async (c: Complaint) => {
      // Update local object to simulate saving progress
      const updated: Complaint = {
          ...c,
          appeal: {
              ...(c.appeal || { isResolved: false }),
              isResolved: false,
              plaintiffArg: plaintiffText,
              defendantArg: defendantText
          }
      };
      await updateComplaint(updated);
      alert("Аргументы сохранены.");
  };

  const callTheJudge = async (c: Complaint) => {
    if (!plaintiffText || !defendantText) {
        alert("Обе стороны должны высказаться перед судом!");
        return;
    }

    setIsJudging(true);

    const fullComplaint: Complaint = {
        ...c,
        appeal: {
            plaintiffArg: plaintiffText,
            defendantArg: defendantText,
            isResolved: false
        }
    };

    const verdict = await judgeCase(fullComplaint);

    const newStatus = verdict.decision === 'cancel' 
        ? ComplaintStatus.Annulled 
        : ComplaintStatus.JudgedValid;

    const resolvedComplaint: Complaint = {
        ...fullComplaint,
        status: newStatus,
        appeal: {
            ...fullComplaint.appeal!,
            isResolved: true,
            judgeReasoning: verdict.explanation
        }
    };

    await updateComplaint(resolvedComplaint);
    setIsJudging(false);
    setActiveCaseId(null);
    loadAppeals(); // Refresh list
    alert(`Суд постановил: ${verdict.decision === 'cancel' ? 'ОТМЕНИТЬ' : 'ОСТАВИТЬ'}!`);
  };

  return (
    <div className="min-h-screen bg-bg dark:bg-slate-900 pb-24 flex flex-col items-center">
      {/* Header */}
      <div className="w-full bg-white dark:bg-slate-800 p-6 shadow-sm border-b border-indigo-100 dark:border-indigo-900/50 text-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-400"></div>
         <div className="size-16 mx-auto bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-3">
             <span className="material-symbols-outlined text-4xl text-indigo-600">gavel</span>
         </div>
         <h1 className="text-2xl font-bold font-display dark:text-white">Семейный Суд</h1>
         <p className="text-sm text-gray-500">Справедливость на базе AI</p>

         {/* Identity Toggles for Inputs */}
         <div className="flex justify-center mt-4">
             <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                 <button onClick={() => setCurrentUser(UserType.Vikulya)} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${currentUser === UserType.Vikulya ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}>Викуля</button>
                 <button onClick={() => setCurrentUser(UserType.Yanik)} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${currentUser === UserType.Yanik ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}>Яник</button>
             </div>
         </div>
      </div>

      {/* Case List */}
      <div className="w-full max-w-md p-4 space-y-4">
        {appeals.length === 0 && (
             <div className="text-center py-10 opacity-50">
                 <span className="text-4xl">🕊️</span>
                 <p className="mt-2 text-sm">Судебных дел нет</p>
             </div>
        )}

        {appeals.map(c => (
             <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-ios overflow-hidden border border-indigo-50 dark:border-slate-700">
                 {/* Case Header */}
                 <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                     <div>
                         <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Дело #{c.id.slice(-4)}</span>
                         <h3 className="font-bold text-gray-800 dark:text-gray-200">{c.category}</h3>
                     </div>
                     <button 
                        onClick={() => activeCaseId === c.id ? setActiveCaseId(null) : handleOpenCase(c)}
                        className="text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1.5 rounded-lg"
                     >
                        {activeCaseId === c.id ? 'Свернуть' : 'Рассмотреть'}
                     </button>
                 </div>

                 {activeCaseId === c.id && (
                     <div className="p-4 animate-fadeIn">
                         {/* Original Context */}
                         <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800/50 mb-4 text-sm">
                             <p className="text-gray-500 text-xs mb-1">Предмет спора:</p>
                             <p className="font-medium text-gray-800 dark:text-gray-200">"{c.description}"</p>
                             <div className="flex justify-between mt-2 text-xs">
                                 <span>Тип: <b>{c.type === ActivityType.GoodDeed ? 'Доброе дело' : 'Жалоба'}</b></span>
                                 <span>Цена: <b>{c.points} баллов</b></span>
                             </div>
                         </div>

                         {/* Arguments */}
                         <div className="space-y-4 mb-6">
                             <div>
                                 <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Аргумент Викули</label>
                                 <textarea 
                                    className={`w-full p-3 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-200 outline-none
                                        ${currentUser !== UserType.Vikulya ? 'bg-gray-100 text-gray-500' : 'bg-white border-indigo-200'}`}
                                    placeholder={currentUser === UserType.Vikulya ? "Почему это несправедливо?" : "Ожидает заполнения..."}
                                    readOnly={currentUser !== UserType.Vikulya}
                                    value={plaintiffText} // In a real app, logic would map User to Plaintiff/Defendant correctly. Here simplified.
                                    onChange={(e) => setPlaintiffText(e.target.value)}
                                    rows={3}
                                 />
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Аргумент Яника</label>
                                 <textarea 
                                    className={`w-full p-3 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-200 outline-none
                                        ${currentUser !== UserType.Yanik ? 'bg-gray-100 text-gray-500' : 'bg-white border-indigo-200'}`}
                                    placeholder={currentUser === UserType.Yanik ? "Ваша защита?" : "Ожидает заполнения..."}
                                    readOnly={currentUser !== UserType.Yanik}
                                    value={defendantText}
                                    onChange={(e) => setDefendantText(e.target.value)}
                                    rows={3}
                                 />
                             </div>
                         </div>

                         {/* Actions */}
                         <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => saveArguments(c)} className="py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">
                                 Сохранить
                             </button>
                             <button 
                                onClick={() => callTheJudge(c)}
                                disabled={isJudging}
                                className="py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
                             >
                                 {isJudging ? (
                                     <span className="animate-spin material-symbols-outlined">refresh</span>
                                 ) : (
                                     <>
                                        <span className="material-symbols-outlined">gavel</span>
                                        Суд AI
                                     </>
                                 )}
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
