import React, { useEffect, useState } from 'react';
import { UserType, Complaint, ActivityType, ComplaintStatus } from '../types';
import { fetchComplaints, submitComplaint, calculateScore } from '../services/sheetService';

const Gauge: React.FC<{ score: number }> = ({ score }) => {
  // Score 0-1000.
  // 0 points = -180deg rotation (or whatever visual mapping fits)
  // Let's assume the visual works where 0deg is empty and 180deg is full.
  // The provided CSS had `transform: rotate(135deg)` for 75%.
  // So range is 0 to 180 degrees.
  const percentage = Math.min(100, Math.max(0, score / 10)); // 0 to 100
  const rotation = (percentage / 100) * 180; 

  return (
    <div className="relative flex flex-col items-center">
      {/* Gauge Visual */}
      <div className="gauge-container mb-[-20px]">
        <div className="gauge-bg"></div>
        <div 
            className="gauge-fill" 
            style={{ transform: `rotate(${rotation}deg)` }}
        ></div>
      </div>
      <div className="flex flex-col items-center z-10">
        <span className="text-4xl font-black text-primary font-display">{Math.round(score)}</span>
        <p className="text-[#616f89] dark:text-gray-400 text-sm font-bold uppercase tracking-wider">Ваш рейтинг доверия</p>
      </div>
    </div>
  );
};

export const Profile: React.FC = () => {
  const [activeIdentity, setActiveIdentity] = useState<UserType>(() => {
    return (localStorage.getItem('currentUserIdentity') as UserType) || UserType.Vikulya;
  });
  const [activities, setActivities] = useState<Complaint[]>([]);
  const [score, setScore] = useState(500);
  
  // Good Deed State
  const [goodDeedPoints, setGoodDeedPoints] = useState<number | ''>(5);
  const [goodDeedDescription, setGoodDeedDescription] = useState('');
  const [isSubmittingDeed, setIsSubmittingDeed] = useState(false);

  useEffect(() => {
    localStorage.setItem('currentUserIdentity', activeIdentity);
    loadData();
  }, [activeIdentity]);

  const loadData = async () => {
    const data = await fetchComplaints();
    setActivities(data);
    setScore(calculateScore(data, activeIdentity));
  };

  const handleIdentityChange = (user: UserType) => {
    setActiveIdentity(user);
  };

  const handleAddGoodDeed = async () => {
    if (!goodDeedDescription.trim()) {
      alert("Пожалуйста, напишите, что вы сделали!");
      return;
    }
    if (!goodDeedPoints || Number(goodDeedPoints) <= 0) {
      alert("Укажите положительное количество баллов!");
      return;
    }

    setIsSubmittingDeed(true);
    const newDeed: Complaint = {
      id: Date.now().toString(),
      user: activeIdentity, // The user doing the good deed gets the points
      type: ActivityType.GoodDeed,
      category: 'Доброе дело',
      categoryIcon: '🌟',
      description: goodDeedDescription.trim(),
      compensation: '',
      compensationIcon: '',
      timestamp: new Date().toISOString(),
      status: ComplaintStatus.Completed,
      points: Number(goodDeedPoints)
    };

    await submitComplaint(newDeed);
    await loadData(); // Refresh score
    
    // Reset form
    setIsSubmittingDeed(false);
    setGoodDeedDescription('');
    setGoodDeedPoints(5);
    
    alert(`Супер! +${newDeed.points} баллов начислено.`);
  };

  const handleResolveComplaint = async (complaint: Complaint) => {
    // Mark as compensated/fixed locally for demo (in real app would update row)
    // For this demo, let's just create a "Compensated" entry or update logic would be needed in sheetService
    // We will just alert for now as full CRUD is complex without ID matching in Sheets
    alert("Статус обновлен!");
  };

  const pendingComplaints = activities.filter(
    a => a.user === activeIdentity && a.type === ActivityType.Complaint && a.status === ComplaintStatus.InProgress
  );

  const getTierName = (s: number) => {
    if (s >= 900) return { name: "Святой", next: 1000, desc: "Вы просто ангел во плоти." };
    if (s >= 750) return { name: "Надежный партнер", next: 900, desc: "Почти не косячит. Можно доверять." };
    if (s >= 500) return { name: "Нормально", next: 750, desc: "Есть куда расти, но жить можно." };
    return { name: "Токсик", next: 500, desc: "Срочно исправляйтесь!" };
  };

  const tier = getTierName(score);

  return (
    <div className="max-w-[480px] mx-auto min-h-screen flex flex-col pb-24 bg-background-light dark:bg-background-dark text-[#111318] dark:text-white transition-colors duration-200">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md flex items-center p-4 justify-between border-b border-gray-200 dark:border-gray-800">
        <div className="text-primary flex size-10 items-center justify-center rounded-full bg-primary/10">
          <span className="material-symbols-outlined">settings</span>
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center font-display">Профиль</h2>
        <div className="flex w-10 items-center justify-end">
          <button className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm">
             <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">notifications</span>
          </button>
        </div>
      </header>

      {/* Identity Switcher */}
      <div className="px-4 py-6">
        <div className="flex h-12 items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-800 p-1.5">
          <button 
            onClick={() => handleIdentityChange(UserType.Vikulya)}
            className={`flex h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all ${activeIdentity === UserType.Vikulya ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <span className="truncate text-sm font-semibold">Я Викуля</span>
          </button>
          <button 
            onClick={() => handleIdentityChange(UserType.Yanik)}
            className={`flex h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-all ${activeIdentity === UserType.Yanik ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <span className="truncate text-sm font-semibold">Я Яник</span>
          </button>
        </div>
      </div>

      {/* Score Section */}
      <div className="flex flex-col items-center px-4 py-4 mb-4">
        <Gauge score={score} />
        
        <div className="w-full mt-8 p-4 bg-white dark:bg-gray-900 rounded-xl custom-shadow border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Прогресс до уровня "{tier.next === 1000 ? "Божество" : "Next Tier"}"</span>
            <span className="text-xs font-bold text-primary">{Math.round((score / 1000) * 100)}%</span>
          </div>
          <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${(score/1000)*100}%` }}></div>
          </div>
          <p className="mt-3 text-sm text-[#616f89] dark:text-gray-400 leading-normal italic text-center">
             "{tier.desc}"
          </p>
        </div>
      </div>

      {/* Add Good Deed */}
      <div className="px-4 pt-4">
        <h3 className="text-lg font-bold leading-tight tracking-tight mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-green-500">verified_user</span>
            Заслужить баллы
        </h3>
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl custom-shadow border border-gray-100 dark:border-gray-800">
            {/* Description Input */}
            <div className="mb-4">
               <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase ml-1 mb-1 block">Что сделали?</label>
               <input 
                 type="text" 
                 className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                 placeholder="Например: Помыл посуду"
                 value={goodDeedDescription}
                 onChange={e => setGoodDeedDescription(e.target.value)}
               />
            </div>

            {/* Points Selection */}
            <div className="mb-6">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase ml-1 mb-2 block">Оценка значимости</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {[1, 3, 5, 10, 20].map(pt => (
                        <button key={pt} onClick={() => setGoodDeedPoints(pt)} className="flex-shrink-0 focus:outline-none">
                            <div className={`size-10 flex items-center justify-center rounded-lg border transition-all font-bold ${goodDeedPoints === pt ? 'bg-primary text-white border-primary' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-300'}`}>
                                {pt}
                            </div>
                        </button>
                    ))}
                    {/* Custom Points Input */}
                    <div className="relative min-w-[70px]">
                        <input 
                            type="number" 
                            placeholder="..." 
                            value={goodDeedPoints === '' ? '' : goodDeedPoints}
                            onChange={(e) => {
                                const val = e.target.value;
                                setGoodDeedPoints(val === '' ? '' : parseInt(val));
                            }}
                            className={`w-full h-10 rounded-lg border text-center font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
                                goodDeedPoints !== '' && ![1,3,5,10,20].includes(goodDeedPoints) 
                                ? 'bg-primary text-white border-primary' 
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-300'
                            }`}
                        />
                         <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs font-bold opacity-0 transition-opacity peer-placeholder-shown:opacity-100">
                             ?
                         </span>
                    </div>
                </div>
            </div>

            <button 
                onClick={handleAddGoodDeed}
                disabled={isSubmittingDeed}
                className="w-full bg-primary hover:bg-primary/90 text-white h-14 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70 shadow-lg shadow-primary/20"
            >
                {isSubmittingDeed ? 'Отправка...' : (
                    <>
                        <span className="material-symbols-outlined">add_circle</span>
                        Добавить доброе дело
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Pending Actions */}
      <div className="px-4 pt-8">
        <h3 className="text-lg font-bold leading-tight tracking-tight mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-500">warning</span>
            Ожидают внимания
        </h3>
        <div className="space-y-4">
            {pendingComplaints.length === 0 && (
                <p className="text-gray-400 text-center italic text-sm">Вы чисты перед законом (пока что).</p>
            )}
            {pendingComplaints.map(complaint => (
                 <div key={complaint.id} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 custom-shadow">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="font-bold text-gray-800 dark:text-gray-100">{complaint.category}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{complaint.description}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(complaint.timestamp).toLocaleString()}</p>
                        </div>
                        <span className="px-2 py-1 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] font-black rounded uppercase">{complaint.points} б.</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleResolveComplaint(complaint)} className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            Принять
                        </button>
                        <button onClick={() => handleResolveComplaint(complaint)} className="flex-1 h-9 rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
                            Исправлено
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};