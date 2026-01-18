
import React, { useState, useEffect } from 'react';
import { ComplaintStatus, UserType, ActivityType, SHOP_ITEMS } from '../types';
import { updateComplaintStatus } from '../services/sheetService';
import { useComplaints } from '../context/ComplaintContext';
import { SettingsModal } from '../components/SettingsModal';
import { AvatarFrame } from '../components/AvatarFrame';

export const Feed: React.FC = () => {
  const { complaints, refreshData, avatars } = useComplaints();
  const [filter, setFilter] = useState<'All' | UserType>('All');
  const [appealingId, setAppealingId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [equippedFrames, setEquippedFrames] = useState<Record<UserType, string | null>>({
      [UserType.Vikulya]: null,
      [UserType.Yanik]: null
  });

  const loadFrames = () => {
      setEquippedFrames({
          [UserType.Vikulya]: localStorage.getItem(`equipped_frame_${UserType.Vikulya}`),
          [UserType.Yanik]: localStorage.getItem(`equipped_frame_${UserType.Yanik}`)
      });
  };

  useEffect(() => {
      loadFrames();
      window.addEventListener('storage', loadFrames);
      return () => window.removeEventListener('storage', loadFrames);
  }, []);

  const handleAppeal = async (id: string) => {
    if (!confirm("Вы уверены, что хотите подать апелляцию в Суд? Это заморозит дело.")) return;
    setAppealingId(id);
    try {
        await updateComplaintStatus(id, ComplaintStatus.PendingAppeal);
        await refreshData();
    } catch (e) {
        alert("Произошла ошибка.");
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
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20">Признано</span>;
        case ComplaintStatus.InProgress:
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Ожидает</span>;
        case ComplaintStatus.PendingConfirmation:
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">Проверка</span>;
        case ComplaintStatus.Compensated:
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-300 border border-green-500/30">Закрыто</span>;
        case ComplaintStatus.PendingAppeal:
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">В суде</span>;
        case ComplaintStatus.Annulled:
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/50 border border-white/10">Отмена</span>;
        case ComplaintStatus.JudgedValid:
             return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Суд OK</span>;
        case ComplaintStatus.PendingApproval:
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">На проверке</span>;
        default: return null;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-28 pt-safe-top">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <header className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
            <button onClick={() => setIsSettingsOpen(true)} className="glass-panel size-10 rounded-full flex items-center justify-center active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-white/80">settings</span>
            </button>
            <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-sm">Лента</h1>
            <button onClick={() => refreshData()} className="glass-panel size-10 rounded-full flex items-center justify-center active:rotate-180 transition-transform">
                <span className="material-symbols-outlined text-white/80">refresh</span>
            </button>
      </header>

      <div className="pt-2">
        {/* Search */}
        <div className="px-4 mb-4">
             <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="material-symbols-outlined text-white/50">search</span>
                </div>
                <input 
                    type="text" 
                    placeholder="Поиск по истории..." 
                    className="glass-input block w-full p-3 pl-10 text-sm outline-none transition-all placeholder-white/40 focus:ring-1 focus:ring-white/50"
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
                            ? 'bg-white/20 text-white border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                            : 'text-white/60 hover:text-white'}`}
                >
                    {f === 'All' ? 'Все' : f}
                </button>
            ))}
        </div>

        {/* List */}
        <div className="flex flex-col gap-4 px-4">
            {filteredComplaints.length === 0 && (
                <div className="glass-panel p-8 rounded-2xl text-center text-white/40">
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
                
                let description = item.description;
                if (item.type === ActivityType.Purchase) {
                     const shopItem = SHOP_ITEMS.find(s => s.id === item.category);
                     if (shopItem) description = `Куплено: ${shopItem.name}`;
                }

                return (
                <div key={item.id} className={`glass-panel p-5 relative overflow-hidden group
                    ${isGoodDeed ? 'shadow-[inset_0_0_20px_rgba(74,222,128,0.1)]' : ''}
                    ${item.status === ComplaintStatus.Compensated || item.status === ComplaintStatus.Annulled ? 'opacity-70' : ''}
                `}>
                    
                    {/* Stamps */}
                    {item.status === ComplaintStatus.JudgedValid && (
                         <span className="material-symbols-outlined absolute -right-6 -top-2 text-[100px] text-white/5 rotate-12 pointer-events-none">balance</span>
                    )}
                    {item.status === ComplaintStatus.Annulled && (
                         <span className="material-symbols-outlined absolute -right-6 -top-2 text-[100px] text-white/5 rotate-12 pointer-events-none">cancel</span>
                    )}

                    <div className="flex items-start justify-between mb-3 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="size-12 relative shrink-0">
                                <AvatarFrame 
                                    frameId={equippedFrames[item.user]} 
                                    src={avatars[item.user]} 
                                    size="sm" 
                                />
                            </div>

                            <div>
                                <p className="text-sm font-bold text-white flex items-center gap-1">
                                    {item.user}
                                    {isGoodDeed && <span className="text-[9px] bg-green-500 text-white px-1.5 rounded uppercase tracking-wide shadow-lg shadow-green-500/40">Hero</span>}
                                </p>
                                <p className="text-xs text-secondary">{new Date(item.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                            {getStatusBadge(item.status)}
                            <span className={`font-black text-sm whitespace-nowrap ${item.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {item.points > 0 ? '+' : ''}{item.points} pts
                            </span>
                        </div>
                    </div>
                    
                    <div className="mb-3 relative z-10">
                        <h3 className={`text-base font-bold leading-snug mb-2 text-white ${!isGoodDeed && item.status === ComplaintStatus.Compensated ? 'line-through text-white/40' : ''}`}>
                            {description}
                        </h3>
                        
                        {item.image && (
                            <div className="w-full h-40 rounded-xl overflow-hidden border border-white/10 mb-3 shadow-inner">
                                <img src={item.image} alt="proof" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                            </div>
                        )}
                        
                        {!isGoodDeed && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-black/20 border border-white/5 mt-3">
                                 <span className="material-symbols-outlined text-white/80 text-lg">{item.compensationIcon}</span>
                                 <p className="text-sm text-white/80">
                                    <span className="font-semibold text-white">Штраф:</span> {item.compensation}
                                 </p>
                            </div>
                        )}
                    </div>

                    {item.appeal?.judgeReasoning && (
                        <div className="mt-3 bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30 text-xs">
                            <p className="font-bold text-indigo-300 mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">gavel</span>
                                Вердикт:
                            </p>
                            <p className="text-white italic">"{item.appeal.judgeReasoning}"</p>
                        </div>
                    )}

                    {canAppeal && (
                        <div className="border-t border-white/10 pt-3 flex justify-end">
                            <button 
                                onClick={() => handleAppeal(item.id)}
                                disabled={appealingId === item.id}
                                className="text-xs font-bold text-white/60 hover:text-white flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
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
