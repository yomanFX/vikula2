
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { UserType, ActivityType } from '../types';
import { useComplaints } from '../context/ComplaintContext';

const ChartData = [
  { val: 10 }, { val: 12 }, { val: 8 }, { val: 14 }, { val: 11 }, { val: 15 }, { val: 14 }
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { complaints, vikulyaStats, yanikStats, loading } = useComplaints();

  // Get first 5 from context
  const recentActivity = complaints.slice(0, 5);

  const handleProfileSelect = (user: UserType) => {
    navigate('/create/step1', { state: { accusedUser: user } });
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'bg-green-500';
    if (score >= 500) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score: number) => {
      if (score >= 800) return 'text-green-500';
      if (score >= 500) return 'text-yellow-600';
      return 'text-red-500';
  };

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
          </div>
      );
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto animate-fadeIn">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 pt-safe-top">
        <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">bar_chart</span>
        </div>
        <h1 className="text-lg font-bold">Система Учета Претензий</h1>
        <button className="size-10 flex items-center justify-center text-gray-400">
            <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      {/* KPI Card */}
      <div className="bg-white rounded-2xl p-5 shadow-ios mb-8 relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
            <div>
                <p className="text-gray-500 text-sm font-medium">Претензий за неделю</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-bold text-gray-900">{recentActivity.filter(x => x.type === ActivityType.Complaint).length}</span>
                    <span className="text-red-500 text-sm font-bold">Активны</span>
                </div>
            </div>
            <div className="h-10 w-20">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ChartData}>
                        <Line type="monotone" dataKey="val" stroke="#2b6cee" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: '65%' }}></div>
        </div>
      </div>

      {/* Profile Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Выберите профиль</h2>
        <p className="text-gray-500 text-sm mb-4">Для инициации процесса обжалования</p>
        
        <div className="grid grid-cols-2 gap-4">
            {/* Vikulya Card */}
            <div className="bg-white p-4 rounded-2xl shadow-ios flex flex-col items-center">
                <div className="size-20 rounded-full bg-indigo-100 mb-3 overflow-hidden border-2 border-white shadow-sm">
                    <img src="https://picsum.photos/seed/vikulya/200" alt="Vikulya" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-lg">{UserType.Vikulya}</h3>
                <p className="text-xs text-gray-400 mb-3">Индекс надежности</p>
                <div className="w-full flex justify-between text-[10px] font-bold mb-1">
                    <span className={getScoreTextColor(vikulyaStats.score)}>{vikulyaStats.tier.name.toUpperCase()}</span>
                    <span className={getScoreTextColor(vikulyaStats.score)}>{Math.round(vikulyaStats.score / 10)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4 overflow-hidden">
                    <div className={`h-1.5 rounded-full transition-all duration-1000 ${getScoreColor(vikulyaStats.score)}`} style={{ width: `${vikulyaStats.score / 10}%` }}></div>
                </div>
                <button 
                    onClick={() => handleProfileSelect(UserType.Vikulya)}
                    className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-xl active:scale-95 transition-transform shadow-lg shadow-primary/20"
                >
                    Жалоба
                </button>
            </div>

            {/* Yanik Card */}
            <div className="bg-white p-4 rounded-2xl shadow-ios flex flex-col items-center">
                <div className="size-20 rounded-full bg-orange-100 mb-3 overflow-hidden border-2 border-white shadow-sm">
                    <img src="https://picsum.photos/seed/yanik/200" alt="Yanik" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-lg">{UserType.Yanik}</h3>
                <p className="text-xs text-gray-400 mb-3">Индекс надежности</p>
                <div className="w-full flex justify-between text-[10px] font-bold mb-1">
                    <span className={getScoreTextColor(yanikStats.score)}>{yanikStats.tier.name.toUpperCase()}</span>
                    <span className={getScoreTextColor(yanikStats.score)}>{Math.round(yanikStats.score / 10)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4 overflow-hidden">
                    <div className={`h-1.5 rounded-full transition-all duration-1000 ${getScoreColor(yanikStats.score)}`} style={{ width: `${yanikStats.score / 10}%` }}></div>
                </div>
                <button 
                    onClick={() => handleProfileSelect(UserType.Yanik)}
                    className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-xl active:scale-95 transition-transform shadow-lg shadow-primary/20"
                >
                    Жалоба
                </button>
            </div>
        </div>
      </div>

      {/* Recent Activity Mini Feed */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Последняя активность</h2>
        <div className="flex flex-col gap-3">
            {recentActivity.map(item => {
                const title = item.type === ActivityType.GoodDeed ? item.description : item.category;
                const isGood = item.points > 0;
                
                return (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-ios flex gap-4 items-center border border-gray-50">
                        <div className={`size-12 rounded-lg flex items-center justify-center shrink-0 text-2xl ${isGood ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {item.categoryIcon}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{title}</h4>
                            <p className="text-xs text-gray-500">
                                {item.user} • {new Date(item.timestamp).toLocaleDateString()}
                            </p>
                        </div>
                        <span className={`text-xs font-bold whitespace-nowrap ${isGood ? 'text-green-500' : 'text-red-500'}`}>
                            {isGood ? '+' : ''}{item.points} PTS
                        </span>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
