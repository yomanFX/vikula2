import React, { useEffect, useState } from 'react';
import { Complaint, ComplaintStatus, UserType } from '../types';
import { fetchComplaints } from '../services/sheetService';

export const Feed: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<'All' | UserType>('All');

  useEffect(() => {
    fetchComplaints().then(setComplaints);
  }, []);

  const filteredComplaints = filter === 'All' 
    ? complaints 
    : complaints.filter(c => c.user === filter);

  const getStatusBadge = (status: ComplaintStatus) => {
    switch(status) {
        case ComplaintStatus.Approved:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    <span className="material-symbols-outlined text-sm">verified</span> Approved
                </span>
            );
        case ComplaintStatus.InProgress:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                    <span className="material-symbols-outlined text-sm">schedule</span> In Progress
                </span>
            );
        case ComplaintStatus.Compensated:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-600 border border-green-500/20">
                     <span className="material-symbols-outlined text-sm">check_circle</span> Compensated
                </span>
            );
        default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg dark:bg-slate-900 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">gavel</span>
                <h1 className="text-xl font-bold tracking-tight dark:text-white">Акты возмездия</h1>
            </div>
            <button className="size-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">more_horiz</span>
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
                    placeholder="Поиск актов..." 
                    className="block w-full p-3 pl-10 text-sm bg-white dark:bg-slate-800 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-primary outline-none transition-all"
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
                            : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                    {f === 'All' ? 'Все' : f}
                </button>
            ))}
        </div>

        {/* List */}
        <div className="flex flex-col gap-4 px-4">
            {filteredComplaints.length === 0 && (
                <div className="text-center py-10 text-gray-400">Нет жалоб. Мир и покой! 🕊️</div>
            )}
            {filteredComplaints.map(item => (
                <div key={item.id} className={`bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 ${item.status === ComplaintStatus.Compensated ? 'opacity-80 grayscale-[0.3]' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                                <img src={`https://picsum.photos/seed/${item.user}/100`} alt={item.user} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <p className="text-sm font-bold dark:text-white">{item.user}</p>
                                <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>
                        {getStatusBadge(item.status)}
                    </div>
                    
                    <div className="mb-4">
                        <h3 className={`text-base font-bold leading-snug mb-2 dark:text-white ${item.status === ComplaintStatus.Compensated ? 'line-through text-gray-400' : ''}`}>
                            {item.description}
                        </h3>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700">
                             <span className="material-symbols-outlined text-primary text-lg">{item.compensationIcon}</span>
                             <p className="text-sm text-gray-600 dark:text-gray-300">
                                <span className="font-semibold">Возмещение:</span> {item.compensation}
                             </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};