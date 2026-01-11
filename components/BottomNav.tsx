
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  // Hide nav on the creation wizard pages
  if (path === '/create/step1' || path === '/create/step2') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 pb-safe pt-2 z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-[70px] px-2">
        <button 
          onClick={() => navigate('/')}
          className={`flex flex-col items-center gap-1 w-14 ${path === '/' ? 'text-primary' : 'text-gray-400'}`}
        >
          <span className={`material-symbols-outlined text-2xl ${path === '/' ? 'font-variation-filled' : ''}`}>home</span>
          <span className="text-[10px] font-medium">Главная</span>
        </button>

        <button 
          onClick={() => navigate('/feed')}
          className={`flex flex-col items-center gap-1 w-14 ${path === '/feed' ? 'text-primary' : 'text-gray-400'}`}
        >
          <span className="material-symbols-outlined text-2xl">dynamic_feed</span>
          <span className="text-[10px] font-medium">Лента</span>
        </button>

        <div className="-mt-8">
          <button 
            onClick={() => navigate('/create/step1')}
            className="flex items-center justify-center size-14 rounded-full bg-primary text-white shadow-lg shadow-primary/40 ring-4 ring-white active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-3xl">add</span>
          </button>
        </div>

        <button 
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center gap-1 w-14 ${path === '/profile' ? 'text-primary' : 'text-gray-400'}`}
        >
          <span className="material-symbols-outlined text-2xl">person</span>
          <span className="text-[10px] font-medium">Профиль</span>
        </button>

        <button 
          onClick={() => navigate('/court')}
          className={`flex flex-col items-center gap-1 w-14 ${path === '/court' ? 'text-primary' : 'text-gray-400'}`}
        >
          <span className="material-symbols-outlined text-2xl">balance</span>
          <span className="text-[10px] font-medium">Суд</span>
        </button>
      </div>
    </nav>
  );
};
