
import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const tabs = useMemo(() => [
    { id: 'home', path: '/', icon: 'home', label: 'Главная' },
    { id: 'feed', path: '/feed', icon: 'dynamic_feed', label: 'Лента' },
    { id: 'create', path: '/create/step1', icon: 'add', label: 'Создать' }, 
    { id: 'profile', path: '/profile', icon: 'person', label: 'Профиль' },
    { id: 'court', path: '/court', icon: 'gavel', label: 'Суд' },
  ], []);

  if (path === '/create/step1' || path === '/create/step2') return null;
  
  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav className="pointer-events-auto bg-surface dark:bg-[#1E1E1E] h-20 px-4 rounded-full shadow-floating flex items-center gap-1 border border-black/5 dark:border-white/10">
        
        {tabs.map((tab) => {
            const isActive = tab.path === path;
            const isCreate = tab.id === 'create';

            return (
                <button 
                    key={tab.id}
                    onClick={() => navigate(tab.path)}
                    className="relative flex flex-col items-center justify-center size-14 rounded-full outline-none tap-highlight-transparent group"
                >
                    {/* Active Pill Animation */}
                    <div 
                        className={`absolute inset-0 m-auto transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] rounded-full
                        ${isActive 
                            ? (isCreate ? 'bg-googleBlue size-14 rotate-0 shadow-lg shadow-blue-500/30' : 'bg-blue-100 dark:bg-blue-900/50 w-16 h-10 rounded-[20px]') 
                            : 'bg-transparent size-0 opacity-0'}`}
                    />

                    <span 
                        className={`material-symbols-rounded relative z-10 transition-all duration-300
                            ${isActive 
                                ? (isCreate ? 'text-white text-[32px]' : 'text-googleBlue dark:text-blue-200') 
                                : (isCreate ? 'text-white bg-googleBlue p-3 rounded-2xl shadow-md' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300')
                            }
                        `}
                        style={{ fontSize: isCreate && !isActive ? '28px' : isActive ? '28px' : '26px' }}
                    >
                        {tab.icon}
                    </span>
                </button>
            );
        })}
      </nav>
    </div>
  );
};