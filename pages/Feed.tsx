
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
    if (!confirm("Начать апелляцию в суде?")) return;
    setAppealingId(id);
    try {
        const success = await updateComplaintStatus(id, ComplaintStatus.PendingAppeal);
        if (success) await refreshData();
    } catch (e) { alert("Ошибка"); } finally { setAppealingId(null); }
  };

  const filteredComplaints = filter === 'All' ? complaints : complaints.filter(c => c.user === filter);

  const getStatusBadge = (status: ComplaintStatus) => {
    const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border";
    switch(status) {
        case ComplaintStatus.Approved: return <span className={`${base} bg-blue-50 border-blue-100 text-blue-700`}>Одобрено</span>;
        case ComplaintStatus.InProgress: return <span className={`${base} bg-yellow-50 border-yellow-100 text-yellow-700`}>Ожидание</span>;
        case ComplaintStatus.PendingConfirmation: return <span className={`${base} bg-purple-50 border-purple-100 text-purple-700 animate-pulse`}>Проверка</span>;
        case ComplaintStatus.Compensated: return <span className={`${base} bg-green-50 border-green-100 text-green-700`}>Закрыто</span>;
        case ComplaintStatus.PendingAppeal: return <span className={`${base} bg-orange-50 border-orange-100 text-orange-700`}>Суд</span>;
        case ComplaintStatus.Annulled: return <span className={`${base} bg-gray-100 border-gray-200 text-gray-500`}>Отмена</span>;
        case ComplaintStatus.JudgedValid: return <span className={`${base} bg-indigo-50 border-indigo-100 text-indigo-700`}>Вердикт</span>;
        case ComplaintStatus.PendingApproval: return <span className={`${base} bg-cyan-50 border-cyan-100 text-cyan-700`}>На оценке</span>;
        default: return null;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-32 pt-safe-top">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <header className="sticky top-0 z-30 px-4 py-4 flex items-center justify-between bg-[#F2F6FC]/95 backdrop-blur-md transition-all">
            <button onClick={() => setIsSettingsOpen(true)} className="size-12 rounded-full bg-white dark:bg-[#1E1E1E] shadow-sm flex items-center justify-center border border-transparent hover:border-gray-200 transition-all active:scale-95">
                <span className="material-symbols-rounded text-gray-600">settings</span>
            </button>
            <h1 className="text-2xl font-black font-display text-gray-900 dark:text-white">Лента</h1>
            <button onClick={() => refreshData()} className="size-12 rounded-full bg-white dark:bg-[#1E1E1E] shadow-sm flex items-center justify-center border border-transparent hover:border-gray-200 transition-all active:scale-95">
                <span className="material-symbols-rounded text-gray-600">refresh</span>
            </button>
      </header>

      <div className="pt-2">
        {/* Search */}
        <div className="px-4 mb-6">
            <div className="relative group">
                <span className="material-symbols-rounded absolute left-5 top-4 text-gray-400">search</span>
                <input type="text" placeholder="Поиск по истории..." className="google-input w-full p-4 pl-14 shadow-inner bg-white dark:bg-[#1E1E1E]" />
            </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 px-4 mb-8 overflow-x-auto no-scrollbar py-2">
            {['All', UserType.Vikulya, UserType.Yanik].map((f) => (
                <button 
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`h-10 px-6 rounded-full text-sm font-bold transition-all shadow-sm border
                        ${filter === f 
                            ? 'bg-gray-900 text-white border-gray-900 scale-105' 
                            : 'bg-white dark:bg-[#1E1E1E] text-gray-500 border-gray-100 hover:bg-gray-50'}`}
                >
                    {f === 'All' ? 'Все' : f}
                </button>
            ))}
        </div>

        {/* List */}
        <div className="flex flex-col gap-6 px-4">
            {filteredComplaints.map((item, i) => {
                const isGoodDeed = item.type === ActivityType.GoodDeed;
                const canAppeal = item.status !== ComplaintStatus.PendingAppeal 
                                && item.status !== ComplaintStatus.Annulled 
                                && item.status !== ComplaintStatus.JudgedValid
                                && item.status !== ComplaintStatus.PendingApproval
                                && item.status !== ComplaintStatus.Compensated;
                
                return (
                <div key={item.id} className="google-card p-6 animate-slideUp" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                                <img src={avatars[item.user]} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-base font-black text-gray-900 dark:text-white flex items-center gap-1 font-display">
                                    {item.user}
                                    {isGoodDeed && <span className="material-symbols-rounded text-googleYellow text-base filled">verified</span>}
                                </p>
                                <p className="text-xs text-gray-400 font-bold">{new Date(item.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                        {getStatusBadge(item.status)}
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-[#252525] p-5 rounded-[24px] mb-4 border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 leading-snug font-display">
                            {item.description}
                        </h3>
                         <div className={`text-sm font-black flex items-center gap-1 ${item.points > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            <span className="material-symbols-rounded text-lg">{item.points > 0 ? 'trending_up' : 'trending_down'}</span>
                            {item.points > 0 ? '+' : ''}{item.points} баллов
                        </div>
                    </div>

                    {item.image && (
                        <div className="w-full h-56 rounded-[24px] overflow-hidden mb-4 shadow-sm border border-black/5">
                            <img src={item.image} alt="proof" className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
                        </div>
                    )}
                    
                    {!isGoodDeed && (
                        <div className="flex items-center gap-3 px-2 mt-2">
                             <div className="size-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 shrink-0 border border-orange-100">
                                <span className="material-symbols-rounded">{item.compensationIcon}</span>
                             </div>
                             <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                                Штраф: <span className="text-gray-900 dark:text-white">{item.compensation}</span>
                             </p>
                        </div>
                    )}

                    {canAppeal && (
                        <div className="border-t border-gray-100 dark:border-gray-800 mt-5 pt-4 flex justify-end">
                            <button onClick={() => handleAppeal(item.id)} className="google-btn bg-blue-50 text-blue-600 hover:bg-blue-100 px-5 py-2.5 text-sm">
                                <span className="material-symbols-rounded text-lg mr-2">gavel</span> Апелляция
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