
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import { UserType, ActivityType, SHOP_ITEMS } from '../types';
import { useComplaints } from '../context/ComplaintContext';
import { SettingsModal } from '../components/SettingsModal';
import { AvatarFrame } from '../components/AvatarFrame';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { complaints, vikulyaStats, yanikStats, loading, refreshData, avatars } = useComplaints();
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

  const chartData = ['Сб', 'Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт'].map(d => ({ name: d, good: 0, bad: 0 }));
  weeklyActivity.forEach(item => {
      const dayIndex = (new Date(item.timestamp).getDay() + 1) % 7;
      item.points > 0 ? chartData[dayIndex].good += item.points : chartData[dayIndex].bad += Math.abs(item.points);
  });

  const recentActivity = complaints.slice(0, 5);
  const handleProfileSelect = (user: UserType) => navigate('/create/step1', { state: { accusedUser: user } });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-white text-4xl">refresh</span></div>;

  return (
    <div className="pb-28 pt-2 px-4 max-w-md mx-auto min-h-screen">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      <header className="flex justify-between items-center mb-6 pt-safe-top sticky top-0 z-20 transition-all duration-300">
        <button onClick={() => setIsSettingsOpen(true)} className="glass-panel size-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"><span className="material-symbols-outlined text-white/80">settings</span></button>
        <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">ВикСуд</h1>
        <button onClick={() => refreshData()} className="glass-panel size-10 rounded-full flex items-center justify-center active:rotate-180 transition-transform"><span className="material-symbols-outlined text-white/80">refresh</span></button>
      </header>

      {/* Hero KPI - Liquid Glass */}
      <div className="glass-panel p-6 mb-8 relative overflow-hidden transition-transform hover:scale-[1.01]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="flex justify-between items-end relative z-10">
            <div>
                <p className="text-secondary text-xs font-bold uppercase tracking-wider mb-1">События недели</p>
                <div className="text-6xl font-black text-white tracking-tighter drop-shadow-md">{weeklyCount}</div>
                <p className="text-[10px] text-tertiary mt-2 font-bold">Сброс в субботу</p>
            </div>
            <div className="h-16 w-32">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <Tooltip cursor={false} contentStyle={{ display: 'none' }} />
                        <Bar dataKey="good" fill="#4ade80" radius={[4, 4, 4, 4]} barSize={6} stackId="a" />
                        <Bar dataKey="bad" fill="#f87171" radius={[4, 4, 4, 4]} barSize={6} stackId="a" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Profiles */}
      <div className="grid grid-cols-2 gap-4 mb-8">
          {[UserType.Vikulya, UserType.Yanik].map(user => {
             const stats = user === UserType.Vikulya ? vikulyaStats : yanikStats;
             return (
                <div key={user} onClick={() => handleProfileSelect(user)} className="group glass-panel p-5 flex flex-col items-center cursor-pointer transition-all active:scale-95 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="mb-3 transition-transform group-hover:scale-105 drop-shadow-lg">
                         <AvatarFrame 
                            frameId={equippedFrames[user]} 
                            src={avatars[user]} 
                            size="lg" 
                         />
                    </div>

                    <h3 className="font-bold text-lg text-white mb-0.5 relative z-10">{user}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-3 relative z-10 ${stats.score >= 500 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{Math.round(stats.score/10)}% Надежность</span>
                    <button className="w-full py-2 glass-btn-secondary text-xs font-bold rounded-xl relative z-10">Пожаловаться</button>
                </div>
             );
          })}
      </div>

      {/* Recent List */}
      <div>
        <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-lg font-bold text-white">Последнее</h2>
            <button onClick={() => navigate('/feed')} className="text-xs font-bold text-white/50 hover:text-white transition-colors">Все</button>
        </div>
        <div className="flex flex-col gap-3">
            {recentActivity.map((item, i) => {
                let title = item.category;
                let icon = item.categoryIcon;
                
                if (item.type === ActivityType.Purchase) {
                     const shopItem = SHOP_ITEMS.find(s => s.id === item.category);
                     if (shopItem) {
                         title = `Куплено: ${shopItem.name}`;
                         icon = shopItem.icon;
                     }
                } else if (item.type === ActivityType.GoodDeed) {
                     title = item.description;
                }

                return (
                <div key={item.id} className="glass-panel p-4 flex gap-4 items-center transition-all hover:translate-x-1 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 text-2xl shadow-inner ${item.points > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{title}</h4>
                        <p className="text-xs text-secondary truncate">{item.user} • {new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-sm font-black ${item.points > 0 ? 'text-green-400' : 'text-red-400'}`}>{item.points > 0 ? '+' : ''}{item.points}</span>
                </div>
            )})}
        </div>
      </div>
    </div>
  );
};
