
import React, { useEffect, useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [liquidMode, setLiquidMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Sync state with local storage/DOM
    const isDark = document.documentElement.classList.contains('dark');
    const isLiquid = document.documentElement.classList.contains('liquid-glass');
    
    setDarkMode(isDark);
    setLiquidMode(isLiquid);
    
    // Check notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, [isOpen]);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  const toggleLiquidMode = () => {
    const html = document.documentElement;
    if (liquidMode) {
      html.classList.remove('liquid-glass');
      localStorage.setItem('liquidMode', 'false');
      setLiquidMode(false);
    } else {
      html.classList.add('liquid-glass');
      localStorage.setItem('liquidMode', 'true');
      setLiquidMode(true);
    }
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      alert("Ваш браузер не поддерживает уведомления.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      new Notification("Ура! 🎉", { body: "Уведомления включены!" });
    } else {
      setNotificationsEnabled(false);
      alert("Вы запретили уведомления. Включите их в настройках телефона.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-sm glass-panel p-6 shadow-2xl animate-scaleIn">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold dark:text-white">Настройки</h2>
          <button onClick={onClose} className="size-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-500">close</span>
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl mb-4 transition-all">
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-indigo-900 text-indigo-400' : 'bg-yellow-100 text-yellow-600'}`}>
              <span className="material-symbols-outlined">{darkMode ? 'dark_mode' : 'light_mode'}</span>
            </div>
            <div>
              <p className="font-bold dark:text-white">Темная тема</p>
              <p className="text-xs text-gray-400">{darkMode ? 'Включена' : 'Выключена'}</p>
            </div>
          </div>
          <button 
            onClick={toggleDarkMode}
            className={`w-12 h-7 rounded-full transition-colors relative ${darkMode ? 'bg-primary' : 'bg-gray-300'}`}
          >
            <div className={`size-5 bg-white rounded-full absolute top-1 transition-all ${darkMode ? 'left-6' : 'left-1'}`}></div>
          </button>
        </div>

        {/* Liquid Glass Mode Toggle */}
        <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl mb-4 border border-blue-100 dark:border-blue-800/30 transition-all">
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-full flex items-center justify-center ${liquidMode ? 'bg-cyan-400 text-white shadow-lg shadow-cyan-400/40' : 'bg-gray-200 text-gray-500'}`}>
              <span className="material-symbols-outlined">blur_on</span>
            </div>
            <div>
              <p className="font-bold dark:text-white flex items-center gap-2">
                  Liquid Glass 
                  <span className="text-[9px] bg-gradient-to-r from-pink-500 to-purple-500 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-widest">STRICT</span>
              </p>
              <p className="text-xs text-gray-400">Apple Vision Pro Physics</p>
            </div>
          </div>
          <button 
            onClick={toggleLiquidMode}
            className={`w-12 h-7 rounded-full transition-colors relative ${liquidMode ? 'bg-cyan-500' : 'bg-gray-300'}`}
          >
            <div className={`size-5 bg-white rounded-full absolute top-1 transition-all shadow-sm ${liquidMode ? 'left-6' : 'left-1'}`}></div>
          </button>
        </div>

        {/* Notifications Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-full flex items-center justify-center ${notificationsEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
              <span className="material-symbols-outlined">notifications</span>
            </div>
            <div>
              <p className="font-bold dark:text-white">Уведомления</p>
              <p className="text-xs text-gray-400">iOS PWA Push</p>
            </div>
          </div>
          <button 
            onClick={requestNotifications}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${notificationsEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            {notificationsEnabled ? 'ВКЛ' : 'Включить'}
          </button>
        </div>

        <div className="text-center mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/50">
           <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
             Версия 1.3.0 • Laws of Glass
           </p>
           
           <div className="space-y-1">
               <p className="text-[10px] uppercase tracking-widest text-primary/80 font-bold">
                   РАЗРАБОТАНО ЯНИКОМ ДЛЯ ВИКУЛИ
               </p>
           </div>
        </div>
      </div>
    </div>
  );
};