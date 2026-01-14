
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserType, ActivityType } from '../types';
import { useComplaints } from '../context/ComplaintContext';
import { SettingsModal } from '../components/SettingsModal';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { complaints, vikulyaStats, yanikStats, loading, refreshData, avatars } = useComplaints();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const getStartOfWeeklyCycle = () => {
      const now = new Date();
      const diff = (now.getDay() + 1) % 7; 
      const lastSaturday = new Date(now);
      lastSaturday.setDate(now.getDate() - diff);
      lastSaturday.setHours(0, 0, 0, 0);
      return lastSaturday;
  };

  const startOfWeek = getStartOfWeeklyCycle();
  const weeklyActivity = complaints.filter(c => new Date(c.timestamp) >= startOfWeek);
  const weeklyCount = weeklyActivity.length;
  const recentActivity = complaints.slice(0, 5);

  const handleProfileSelect = (user: UserType) => navigate('/create/step1', { state: { accusedUser: user } });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="material-symbols-rounded animate-spin text-googleBlue text-5xl">refresh</span></div>;

  return (
    <div className="pb-32 pt-4 px-4 max-w-md mx-auto min-h-screen">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      {/* Header */}
      <header className="flex justify-between items-center mb-8 sticky top-0 z-20 bg-[#F2F6FC]/90 backdrop-blur-sm pt-safe-top pb-2 transition-all">
        <button onClick={() => setIsSettingsOpen(true)} className="size-12 rounded-full bg-white dark:bg-[#1E1E1E] shadow-sm flex items-center justify-center active:scale-90 transition-transform"><span className="material-symbols-rounded text-gray-600">settings</span></button>
        <h1 className="text-3xl font-black tracking-tighter text-gray-900 dark:text-white font-display">ВикСуд<span className="text-googleBlue">.</span></h1>
        <button onClick={() => refreshData()} className="size-12 rounded-full bg-white dark:bg-[#1E1E1E] shadow-sm flex items-center justify-center active:rotate-180 transition-transform"><span className="material-symbols-rounded text-gray-600">refresh</span></button>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
          
          {/* Main Stats Card */}
          <div className="col-span-2 google-card p-8 bg-white dark:bg-[#1E1E1E] overflow-hidden group relative hover:shadow-floating">
            <div className="absolute top-0 right-0 p-6 opacity-20">
                 <span className="material-symbols-rounded text-8xl text-googleBlue -rotate-12">calendar_month</span>
            </div>
            
            <div className="relative z-10">
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-2">За неделю</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-7xl font-black text-gray-900 dark:text-white font-display tracking-tight leading-none">{weeklyCount}</span>
                    <span className="text-xl text-gray-400 font-bold">событий</span>
                </div>
            </div>
            
            <div className="mt-6 flex gap-2">
                <div className="h-4 flex-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div className="h-full bg-googleBlue rounded-full w-full animate-pop origin-left"></div>
                </div>
            </div>
          </div>

          {/* User Cards */}
          {[UserType.Vikulya, UserType.Yanik].map(user => {
             const stats = user === UserType.Vikulya ? vikulyaStats : yanikStats;
             const isGreen = stats.score >= 500;
             return (
                <div key={user} onClick={() => handleProfileSelect(user)} className="google-card p-5 flex flex-col items-center cursor-pointer active:scale-95 transition-transform relative">
                    <div className="size-24 rounded-full mb-4 shadow-sm overflow-hidden bg-gray-100 border-4 border-white dark:border-[#2C2C2C]">
                        <img src={avatars[user]} onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${user}/200` }} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-black text-xl text-gray-900 dark:text-white mb-1 font-display">{user}</h3>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-1 mt-1 border
                        ${isGreen 
                            ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' 
                            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'}`}>
                        {Math.round(stats.score/10)}% Доверия
                    </div>
                </div>
             );
          })}
      </div>

      {/* Recent List */}
      <div>
        <div className="flex justify-between items-center mb-5 px-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white font-display">Недавнее</h2>
            <button onClick={() => navigate('/feed')} className="bg-white dark:bg-[#1E1E1E] shadow-sm text-gray-600 dark:text-gray-300 px-5 py-2 rounded-full text-xs font-bold hover:bg-gray-50 active:scale-95 transition-all">Все</button>
        </div>
        <div className="flex flex-col gap-3">
            {recentActivity.map((item, i) => (
                <div key={item.id} className="google-card p-4 flex gap-4 items-center animate-slideUp" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-2xl
                        ${item.points > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.categoryIcon}
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                        <h4 className="font-bold text-base text-gray-900 dark:text-white truncate font-display">{item.type === ActivityType.GoodDeed ? item.description : item.category}</h4>
                        <p className="text-xs text-gray-500 font-bold truncate mt-1">{item.user} • {new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-2 ${item.points > 0 ? 'border-green-100 text-green-600 bg-green-50' : 'border-red-100 text-red-600 bg-red-50'}`}>
                        {item.points > 0 ? '+' : ''}{item.points}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};