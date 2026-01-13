
import React, { useState } from 'react';
import { ComplaintStatus, UserType, ActivityType } from '../types';
import { updateComplaintStatus } from '../services/sheetService';
import { useComplaints } from '../context/ComplaintContext';
import { SettingsModal } from '../components/SettingsModal';

export const Feed: React.FC = () => {
  const { complaints, refreshData } = useComplaints();
  const [filter, setFilter] = useState<'All' | UserType>('All');
  const [appealingId, setAppealingId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleAppeal = async (id: string) => {
    if (!confirm("Вы уверены, что хотите подать апелляцию в Суд? Это заморозит дело.")) return;

    setAppealingId(id);
    try {
        const success = await updateComplaintStatus(id, ComplaintStatus.PendingAppeal);
        if (success) {
            await refreshData();
        } else {
            alert("Ошибка при подаче апелляции. Проверьте консоль.");
        }
    } catch (e) {
        alert("Произошла непредвиденная ошибка.");
    } finally {
        setAppealingId(null);
    }
  };

  const filteredComplaints = filter === 'All' 
    ? complaints 
    : complaints.filter(c => c.user === filter);

  const getStatusBadge = (status: ComplaintStatus) => {
    switch(status) {
        case ComplaintStatus.Approved:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    <span className="material-symbols-outlined text-sm">verified</span> Признано
                </span>
            );
        case ComplaintStatus.InProgress:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                    <span className="material-symbols-outlined text-sm">schedule</span> Ожидает
                </span>
            );
        case ComplaintStatus.Compensated:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600 border border-green-500/20">
                     <span className="material-symbols-outlined text-sm">check_circle</span> Исправлено
                </span>
            );
        case ComplaintStatus.PendingAppeal:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 border border-purple-500/20 animate-pulse">
                     <span className="material-symbols-outlined text-sm">gavel</span> В суде
                </span>
            );
        case ComplaintStatus.Annulled:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-500 border border-gray-300">
                     <span className="material-symbols-outlined text-sm">block</span> Отменено судом
                </span>
            );
        case ComplaintStatus.JudgedValid:
             return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                     <span className="material-symbols-outlined text-sm">balance</span> Суд подтвердил
                </span>
            );
        case ComplaintStatus.PendingApproval:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20">
                     <span className="material-symbols-outlined text-sm">hourglass_top</span> На проверке
                </span>
            );
        default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg dark:bg-slate-900 pb-24 pt-safe-top transition-colors duration-300">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="size-10 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center active:bg-gray-200"
            >
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">settings</span>
            </button>
            <h1 className="text-xl font-bold tracking-tight dark:text-white">Лента событий</h1>
            <button 
                onClick={() => refreshData()}
                className="size-10 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center active:bg-gray-200"
            >
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">refresh</span>
            </button>
        </div>
      </header>

      <div className="max-w-md mx-auto pt-4">
        {/* Search */}
        <div className="px-4 mb-4">
             <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400">search</span>
                </div>
                <input 
                    type="text" 
                    placeholder="Поиск по истории..." 
                    className="block w-full p-3 pl-10 text-sm bg-white dark:bg-slate-800 dark:text-white rounded-xl border-none shadow-sm focus:ring-2 focus:ring-primary outline-none transition-all placeholder-gray-400"
                />
            </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-4 mb-4 overflow-x-auto no-scrollbar">
            {['All', UserType.Vikulya, UserType.Yanik].map((f) => (
                <button 
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`flex h-9 shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold transition-all
                        ${filter === f 
                            ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                >
                    {f === 'All' ? 'Все' : f}
                </button>
            ))}
        </div>

        {/* List */}
        <div className="flex flex-col gap-4 px-4">
            {filteredComplaints.length === 0 && (
                <div className="text-center py-10 text-gray-400">Нет событий. Тишь да гладь! 🕊️</div>
            )}
            {filteredComplaints.map(item => {
                const isGoodDeed = item.type === ActivityType.GoodDeed;
                // Can appeal if status is not already in court, annulled, or judged valid
                const canAppeal = item.status !== ComplaintStatus.PendingAppeal 
                                && item.status !== ComplaintStatus.Annulled 
                                && item.status !== ComplaintStatus.JudgedValid
                                && item.status !== ComplaintStatus.PendingApproval
                                && item.status !== ComplaintStatus.Compensated;
                
                // Determine Points Display
                let pointsDisplay = null;
                if (item.status === ComplaintStatus.Annulled) {
                    pointsDisplay = <span className="text-gray-400 font-bold line-through text-xs">0 pts</span>;
                } else if (item.status === ComplaintStatus.PendingApproval) {
                     pointsDisplay = <span className="text-gray-400 font-bold text-xs">...</span>;
                } else {
                    const isPositive = item.points > 0;
                    pointsDisplay = (
                        <span className={`font-black text-sm whitespace-nowrap ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isPositive ? '+' : ''}{item.points} pts
                        </span>
                    );
                }

                return (
                <div key={item.id} className={`rounded-xl p-4 shadow-sm border transition-all relative overflow-hidden
                    ${isGoodDeed 
                        ? 'bg-gradient-to-br from-white to-green-50 border-green-200 shadow-green-100/50 dark:from-slate-800 dark:to-green-900/20 dark:border-green-800' 
                        : `bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 ${item.status === ComplaintStatus.Compensated || item.status === ComplaintStatus.Annulled ? 'opacity-80 grayscale-[0.3]' : ''}`
                    }`}>
                    
                    {/* Court Badge/Stamp Overlay */}
                    {item.status === ComplaintStatus.JudgedValid && (
                         <div className="absolute -right-6 -top-2 rotate-12 opacity-10 pointer-events-none">
                             <span className="material-symbols-outlined text-[100px] text-indigo-600">balance</span>
                         </div>
                    )}
                    {item.status === ComplaintStatus.Annulled && (
                         <div className="absolute -right-6 -top-2 rotate-12 opacity-10 pointer-events-none">
                             <span className="material-symbols-outlined text-[100px] text-gray-600">cancel</span>
                         </div>
                    )}

                    <div className="flex items-start justify-between mb-3 relative z-0">
                        <div className="flex items-center gap-3">
                            <div className={`size-10 rounded-full overflow-hidden border-2 shadow-sm ${isGoodDeed ? 'border-green-300' : 'border-white dark:border-gray-600'}`}>
                                <img src={`https://picsum.photos/seed/${item.user}/100`} alt={item.user} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-sm font-bold dark:text-white flex items-center gap-1">
                                    {item.user}
                                    {isGoodDeed && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded-md font-extrabold tracking-wide">HERO</span>}
                                </p>
                                <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="flex flex-col items-end gap-1">
                             {isGoodDeed ? (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === ComplaintStatus.Annulled ? 'bg-gray-200 text-gray-500' : item.status === ComplaintStatus.PendingApproval ? 'bg-blue-100 text-blue-500' : 'bg-green-500 text-white shadow-lg shadow-green-500/20'}`}>
                                    <span className="material-symbols-outlined text-sm">volunteer_activism</span> 
                                    {item.status === ComplaintStatus.Annulled ? 'Отмена' : item.status === ComplaintStatus.PendingApproval ? 'Оценка' : `Зачтено`}
                                </span>
                            ) : getStatusBadge(item.status)}
                            
                            {/* Points Display Logic */}
                            {pointsDisplay}
                        </div>
                    </div>
                    
                    <div className="mb-3 relative z-0">
                        <h3 className={`text-base font-bold leading-snug mb-2 dark:text-white ${!isGoodDeed && item.status === ComplaintStatus.Compensated ? 'line-through text-gray-400' : ''}`}>
                            {isGoodDeed && <span className="mr-2">✨</span>}
                            {item.description}
                        </h3>
                        
                        {/* Image Preview in Feed */}
                        {item.image && (
                            <div className="w-full h-40 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 mb-3">
                                <img src={item.image} alt="proof" className="w-full h-full object-cover" />
                            </div>
                        )}
                        
                        {/* Compensation Block (Only for Complaints) */}
                        {!isGoodDeed && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 mt-3">
                                 <span className="material-symbols-outlined text-primary text-lg">{item.compensationIcon}</span>
                                 <p className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-semibold">Возмещение:</span> {item.compensation}
                                 </p>
                            </div>
                        )}

                        {/* Good Deed Tag */}
                        {isGoodDeed && (
                            <div className="mt-2 flex">
                                <span className="text-xs font-semibold text-green-600/80 bg-green-50 px-2 py-1 rounded-md border border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                                    {item.category || 'Доброе дело'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Judge Reasoning Display if exists */}
                    {item.appeal?.judgeReasoning && (
                        <div className="mt-3 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/50 text-xs">
                            <p className="font-bold text-indigo-600 mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">gavel</span>
                                Вердикт Судьи:
                            </p>
                            <p className="text-indigo-800 dark:text-indigo-200 italic">"{item.appeal.judgeReasoning}"</p>
                        </div>
                    )}

                    {/* Appeal Action */}
                    {canAppeal && (
                        <div className="border-t border-gray-100 dark:border-slate-700 pt-3 flex justify-end">
                            <button 
                                onClick={() => handleAppeal(item.id)}
                                disabled={appealingId === item.id}
                                className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
                            >
                                <span className={`material-symbols-outlined text-base ${appealingId === item.id ? 'animate-spin' : ''}`}>
                                    {appealingId === item.id ? 'refresh' : 'balance'}
                                </span>
                                {appealingId === item.id ? 'Загрузка...' : 'Апелляция'}
                            </button>
                        </div>
                    )}
                </div>
            )})}
        </div>
      </div>
    </div>
  );
};
