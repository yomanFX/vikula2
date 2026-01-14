
import React, { useEffect, useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
    
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
      alert("Вы запретили уведомления.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-pop">
      <div className="w-full max-w-sm google-card p-6 shadow-2xl bg-white dark:bg-[#1E1E1E]">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black font-display dark:text-white">Настройки</h2>
          <button onClick={onClose} className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200">
            <span className="material-symbols-rounded text-gray-500">close</span>
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl mb-4 transition-all">
          <div className="flex items-center gap-4">
            <div className={`size-12 rounded-full flex items-center justify-center ${darkMode ? 'bg-indigo-900 text-indigo-400' : 'bg-yellow-100 text-yellow-600'}`}>
              <span className="material-symbols-rounded text-2xl">{darkMode ? 'dark_mode' : 'light_mode'}</span>
            </div>
            <div>
              <p className="font-bold text-lg dark:text-white">Темная тема</p>
              <p className="text-xs text-gray-500 font-bold">{darkMode ? 'Включена' : 'Выключена'}</p>
            </div>
          </div>
          <button 
            onClick={toggleDarkMode}
            className={`w-14 h-8 rounded-full transition-colors relative ${darkMode ? 'bg-indigo-500' : 'bg-gray-300'}`}
          >
            <div className={`size-6 bg-white rounded-full absolute top-1 transition-all shadow-sm ${darkMode ? 'left-7' : 'left-1'}`}></div>
          </button>
        </div>

        {/* Notifications Toggle */}
        <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl mb-8">
          <div className="flex items-center gap-4">
            <div className={`size-12 rounded-full flex items-center justify-center ${notificationsEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
              <span className="material-symbols-rounded text-2xl">notifications</span>
            </div>
            <div>
              <p className="font-bold text-lg dark:text-white">Уведомления</p>
              <p className="text-xs text-gray-500 font-bold">Push-пуш</p>
            </div>
          </div>
          <button 
            onClick={requestNotifications}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${notificationsEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            {notificationsEnabled ? 'ВКЛ' : 'Включить'}
          </button>
        </div>

        <div className="text-center mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
           <p className="text-xs font-bold text-gray-400 mb-2">
             Версия 2.0 • Google Pop Design
           </p>
           
           <div className="space-y-1">
               <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-black">
                   MADE FOR VIKULYA & YANIK
               </p>
           </div>
        </div>
      </div>
    </div>
  );
};