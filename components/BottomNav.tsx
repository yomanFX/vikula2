
import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  // Define tabs configuration
  // Moved hook call up before any conditional returns to fix React Error #300
  const tabs = useMemo(() => [
    { id: 'home', path: '/', icon: 'home' },
    { id: 'feed', path: '/feed', icon: 'dynamic_feed' },
    { id: 'create', path: '/create/step1', icon: 'add_circle' }, // Center action
    { id: 'profile', path: '/profile', icon: 'person' },
    { id: 'court', path: '/court', icon: 'balance' },
  ], []);

  // Determine active index for the lens position
  const activeIndex = tabs.findIndex(tab => tab.path === path);
  // Default to 0 if unknown (or handle sub-routes)
  const lensIndex = activeIndex >= 0 ? activeIndex : 0;

  // Don't show nav on wizard steps if you prefer, OR keep it for consistency as requested ("one bar that doesnt change")
  // Hiding it creates a jarring effect. I will show it everywhere except maybe full-screen modals.
  if (path === '/create/step1' || path === '/create/step2') return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 pointer-events-none">
      <nav className="glass-panel pointer-events-auto h-[70px] px-2 rounded-full shadow-2xl max-w-[360px] w-full relative mx-4 overflow-hidden border border-white/40 dark:border-white/10 bg-white/40 dark:bg-black/30 backdrop-blur-xl">
        
        {/* The Swaying Magnifying Lens */}
        <div 
            className="nav-lens"
            style={{ 
                left: `calc(20% * ${lensIndex} + 10% - 24px)` // 20% width per item, 10% is center, 24px is half lens width
            }}
        />

        {/* The Icons Grid */}
        <div className="grid grid-cols-5 h-full relative z-10">
            {tabs.map((tab, index) => {
                const isActive = activeIndex === index;
                const isCreate = tab.id === 'create';

                return (
                    <button 
                        key={tab.id}
                        onClick={() => navigate(tab.path)}
                        className="flex items-center justify-center h-full w-full outline-none tap-highlight-transparent"
                    >
                        <span 
                            className={`material-symbols-outlined transition-all duration-500 ease-out
                                ${isActive ? 'scale-125 font-variation-filled -translate-y-1' : 'scale-100 opacity-60 hover:opacity-100'}
                                ${isActive 
                                    ? (isCreate ? 'text-white' : 'text-primary dark:text-white drop-shadow-sm') 
                                    : 'text-gray-500 dark:text-gray-400'
                                }
                                ${isCreate && !isActive ? 'text-primary' : ''}
                            `}
                            style={{ fontSize: isCreate ? '32px' : '26px' }}
                        >
                            {tab.icon}
                        </span>
                    </button>
                );
            })}
        </div>
      </nav>
    </div>
  );
};
