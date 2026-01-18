
import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const tabs = useMemo(() => [
    { id: 'home', path: '/', icon: 'home' },
    { id: 'feed', path: '/feed', icon: 'dynamic_feed' },
    { id: 'create', path: '/create/step1', icon: 'add_circle' },
    { id: 'profile', path: '/profile', icon: 'person' },
    { id: 'court', path: '/court', icon: 'balance' },
  ], []);

  const activeIndex = tabs.findIndex(tab => tab.path === path);
  const lensIndex = activeIndex >= 0 ? activeIndex : 0;

  if (path === '/create/step1' || path === '/create/step2') return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-8 pointer-events-none">
      <nav className="glass-panel pointer-events-auto h-[70px] px-2 rounded-full max-w-[360px] w-full relative mx-4 overflow-hidden backdrop-blur-3xl">
        
        {/* The Swaying Magnifying Lens - Lighter and more refractive */}
        <div 
            className="absolute top-1/2 -translate-y-1/2 h-[50px] w-[50px] rounded-full z-0 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
            style={{ 
                left: `calc(20% * ${lensIndex} + 10% - 25px)`,
                background: 'rgba(255, 255, 255, 0.15)',
                boxShadow: '0 0 20px rgba(255,255,255,0.3), inset 0 0 10px rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                backdropFilter: 'brightness(1.5)'
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
                                ${isActive ? 'font-variation-filled -translate-y-1 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'opacity-60 text-white hover:opacity-100'}
                            `}
                            style={{ 
                                fontSize: isCreate ? '32px' : '26px',
                                textShadow: isActive ? '0 0 10px rgba(255,255,255,0.5)' : 'none'
                            }}
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
