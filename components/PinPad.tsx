
import React, { useState } from 'react';

interface PinPadProps {
  onUnlock: () => void;
}

export const PinPad: React.FC<PinPadProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const CORRECT_PIN = '3789';

  const handleNum = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      
      if (newPin.length === 4) {
        if (newPin === CORRECT_PIN) {
          setTimeout(() => onUnlock(), 100);
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 transition-all duration-500 animate-fadeIn">
      {/* Background provided by body but we ensure z-index is top */}
      <div className="mb-12 flex flex-col items-center">
        <div className="size-24 glass-panel rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl border-2 border-white/50 animate-float">
            <span className="material-symbols-outlined text-5xl text-gray-900 dark:text-white">lock</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 drop-shadow-sm tracking-tight">ВикСуд</h1>
        <p className="text-gray-600 dark:text-gray-300 text-xs font-bold tracking-[0.2em] uppercase">Security Clearance</p>
      </div>

      {/* Dots */}
      <div className="flex gap-6 mb-16 h-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`size-3 rounded-full transition-all duration-300 border border-gray-400/50 dark:border-white/30 
              ${pin.length > i 
                ? error 
                    ? 'bg-red-500 scale-125 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                    : 'bg-gray-900 dark:bg-white scale-125 shadow-[0_0_10px_rgba(0,0,0,0.2)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
                : 'bg-transparent'}`} 
          />
        ))}
      </div>

      {/* Keys */}
      <div className="grid grid-cols-3 gap-x-6 gap-y-6 w-full max-w-[320px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button key={num} onClick={() => handleNum(num.toString())}
            className="size-20 rounded-full glass-panel border border-white/40 dark:border-white/20 text-3xl font-medium text-gray-900 dark:text-white active:bg-white/40 dark:active:bg-white/20 transition-all flex items-center justify-center shadow-lg active:scale-95"
          >
            {num}
          </button>
        ))}
        <div></div>
        <button onClick={() => handleNum('0')} className="size-20 rounded-full glass-panel border border-white/40 dark:border-white/20 text-3xl font-medium text-gray-900 dark:text-white active:bg-white/40 dark:active:bg-white/20 transition-all flex items-center justify-center shadow-lg active:scale-95">0</button>
        <button onClick={handleDelete} className="size-20 flex items-center justify-center text-gray-800 dark:text-white/70 active:text-gray-900 dark:active:text-white transition-colors active:scale-95">
             <span className="material-symbols-outlined text-3xl">backspace</span>
        </button>
      </div>
    </div>
  );
};