
import React, { useState } from 'react';
import { ComplaintStatus, UserType, ActivityType } from '../types';
import { updateComplaintStatus } from '../services/sheetService';
import { useComplaints } from '../context/ComplaintContext';
import { SettingsModal } from '../components/SettingsModal';

export const Feed: React.FC = () => {
  const { complaints, refreshData, avatars } = useComplaints();
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
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">Признано</span>;
        case ComplaintStatus.InProgress:
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">Ожидает</span>;
        case ComplaintStatus.PendingConfirmation:
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20 animate-pulse">Проверка</span>;
        case ComplaintStatus.Compensated:
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600 border border-green-500/20">Закрыто</span>;
        case ComplaintStatus.PendingAppeal:
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 border border-purple-500/20 animate-pulse">В суде</span>;
        case ComplaintStatus.Annulled:
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-500 border border-gray-300">Отмена</span>;
        case ComplaintStatus.JudgedValid:
             return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">Суд OK</span>;
        case ComplaintStatus.PendingApproval:
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 border border-blue-500/20">На проверке</span>;
        default: return null;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-28 pt-safe-top transition-colors duration-300">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Header */}
      <header className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="glass-panel size-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            >
                <span className="material-symbols-outlined text-gray-600">settings</span>
            </button>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white drop-shadow-sm">Лента</h1>
            <button 
                onClick={() => refreshData()}
                className="glass-panel size-10 rounded-full flex items-center justify-center active:rotate-180 transition-transform"
            >
                <span className="material-symbols-outlined text-gray-600">refresh</span>
            </button>
      </header>

      <div className="pt-2">
        {/* Search */}
        <div className="px-4 mb-4">
             <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400">search</span>
                </div>
                <input 
                    type="text" 
                    placeholder="Поиск по истории..." 
                    className="glass-input block w-full p-3 pl-10 text-sm outline-none transition-all placeholder-gray-400 focus:ring-2 focus:ring-primary/50"
                />
            </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-4 mb-4 overflow-x-auto no-scrollbar">
            {['All', UserType.Vikulya, UserType.Yanik].map((f) => (
                <button 
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`glass-panel h-9 shrink-0 flex items-center justify-center rounded-full px-5 text-sm font-bold transition-all
                        ${filter === f 
                            ? 'bg-primary text-white border-transparent shadow-lg shadow-primary/30' 
                            : 'text-gray-500 hover:text-gray-900'}`}
                >
                    {f === 'All' ? 'Все' : f}
                </button>
            ))}
        </div>

        {/* List */}
        <div className="flex flex-col gap-4 px-4">
            {filteredComplaints.length === 0 && (
                <div className="glass-panel p-8 rounded-2xl text-center text-gray-400">
                    <span className="text-4xl block mb-2">🕊️</span>
                    Нет событий. Тишь да гладь!
                </div>
            )}
            {filteredComplaints.map(item => {
                const isGoodDeed = item.type === ActivityType.GoodDeed;
                const canAppeal = item.status !== ComplaintStatus.PendingAppeal 
                                && item.status !== ComplaintStatus.Annulled 
                                && item.status !== ComplaintStatus.JudgedValid
                                && item.status !== ComplaintStatus.PendingApproval
                                && item.status !== ComplaintStatus.Compensated;
                
                return (
                <div key={item.id} className={`glass-panel p-5 relative overflow-hidden group
                    ${isGoodDeed ? 'border-l-4 border-l-green-400' : ''}
                    ${item.status === ComplaintStatus.Compensated || item.status === ComplaintStatus.Annulled ? 'opacity-75 grayscale-[0.3]' : ''}
                `}>
                    
                    {/* Stamps */}
                    {item.status === ComplaintStatus.JudgedValid && (
                         <span className="material-symbols-outlined absolute -right-6 -top-2 text-[100px] text-indigo-600/10 rotate-12 pointer-events-none">balance</span>
                    )}
                    {item.status === ComplaintStatus.Annulled && (
                         <span className="material-symbols-outlined absolute -right-6 -top-2 text-[100px] text-gray-500/10 rotate-12 pointer-events-none">cancel</span>
                    )}

                    {/* Top Row */}
                    <div className="flex items-start justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full overflow-hidden border-2 border-white/20 shadow-sm">
                                <img 
                                    src={avatars[item.user]} 
                                    onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${item.user}/100` }}
                                    alt={item.user} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                                    {item.user}
                                    {isGoodDeed && <span className="text-[9px] bg-green-500 text-white px-1.5 rounded uppercase tracking-wide">Hero</span>}
                                </p>
                                <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                            {getStatusBadge(item.status)}
                            <span className={`font-black text-sm whitespace-nowrap ${item.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {item.points > 0 ? '+' : ''}{item.points} pts
                            </span>
                        </div>
                    </div>
                    
                    {/* Content */}
                    <div className="mb-3 relative z-10">
                        <h3 className={`text-base font-bold leading-snug mb-2 text-gray-800 dark:text-gray-100 ${!isGoodDeed && item.status === ComplaintStatus.Compensated ? 'line-through text-gray-400' : ''}`}>
                            {item.description}
                        </h3>
                        
                        {item.image && (
                            <div className="w-full h-40 rounded-xl overflow-hidden border border-white/10 mb-3 shadow-inner">
                                <img src={item.image} alt="proof" className="w-full h-full object-cover" />
                            </div>
                        )}
                        
                        {!isGoodDeed && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/30 border border-gray-100/50 dark:border-white/5 mt-3">
                                 <span className="material-symbols-outlined text-primary text-lg">{item.compensationIcon}</span>
                                 <p className="text-sm text-gray-600">
                                    <span className="font-semibold">Штраф:</span> {item.compensation}
                                 </p>
                            </div>
                        )}
                    </div>

                    {item.appeal?.judgeReasoning && (
                        <div className="mt-3 bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 text-xs">
                            <p className="font-bold text-indigo-500 mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">gavel</span>
                                Вердикт:
                            </p>
                            <p className="text-indigo-400 italic">"{item.appeal.judgeReasoning}"</p>
                        </div>
                    )}

                    {canAppeal && (
                        <div className="border-t border-gray-200/20 pt-3 flex justify-end">
                            <button 
                                onClick={() => handleAppeal(item.id)}
                                disabled={appealingId === item.id}
                                className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50"
                            >
                                <span className={`material-symbols-outlined text-base ${appealingId === item.id ? 'animate-spin' : ''}`}>
                                    {appealingId === item.id ? 'refresh' : 'balance'}
                                </span>
                                Апелляция
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