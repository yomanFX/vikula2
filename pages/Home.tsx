import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { UserType, Complaint } from '../types';
import { fetchComplaints } from '../services/sheetService';

const ChartData = [
  { val: 10 }, { val: 12 }, { val: 8 }, { val: 14 }, { val: 11 }, { val: 15 }, { val: 14 }
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [recentActivity, setRecentActivity] = useState<Complaint[]>([]);

  useEffect(() => {
    fetchComplaints().then(data => {
      setRecentActivity(data.slice(0, 3));
    });
  }, []);

  const handleProfileSelect = (user: UserType) => {
    // Navigate to create flow with pre-selected user context (passed via state)
    navigate('/create/step1', { state: { accusedUser: user } });
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">bar_chart</span>
        </div>
        <h1 className="text-lg font-bold">Система Учета Претензий</h1>
        <button className="size-10 flex items-center justify-center">
            <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      {/* KPI Card */}
      <div className="bg-white rounded-2xl p-5 shadow-ios mb-8 relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
            <div>
                <p className="text-gray-500 text-sm font-medium">Претензий за неделю</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-bold text-gray-900">14</span>
                    <span className="text-green-500 text-sm font-bold">+5% KPI</span>
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
        {/* Progress bar */}
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
                    <span className="text-primary">TIER A</span>
                    <span className="text-primary">85%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <button 
                    onClick={() => handleProfileSelect(UserType.Vikulya)}
                    className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-xl active:scale-95 transition-transform"
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
                    <span className="text-red-500">CRITICAL</span>
                    <span className="text-red-500">42%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '42%' }}></div>
                </div>
                <button 
                    onClick={() => handleProfileSelect(UserType.Yanik)}
                    className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-xl active:scale-95 transition-transform"
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
            {recentActivity.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-ios flex gap-4 items-center">
                    <div className={`size-12 rounded-lg flex items-center justify-center shrink-0 ${item.points > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        <span className="material-symbols-outlined">{item.points > 0 ? 'check_circle' : 'warning'}</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{item.category}</h4>
                        <p className="text-xs text-gray-500">{item.user} • {new Date(item.timestamp).getHours()}ч назад</p>
                    </div>
                    <span className={`text-xs font-bold ${item.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {item.points > 0 ? '+' : ''}{item.points} PTS
                    </span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};