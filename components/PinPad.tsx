
import React, { useState, useEffect } from 'react';

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
          // Slight delay for UX
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
    <div className="fixed inset-0 z-[100] bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-6 transition-all duration-500">
      <div className="mb-12 flex flex-col items-center">
        <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-float">
            <span className="material-symbols-outlined text-4xl">lock</span>
        </div>
        <h1 className="text-2xl font-bold dark:text-white mb-2 font-display">Введите код</h1>
        <p className="text-gray-400 text-sm">Для доступа к семейному бюджету</p>
      </div>

      {/* Dots */}
      <div className="flex gap-4 mb-12 h-4">
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i} 
            className={`size-3.5 rounded-full transition-all duration-300 ${
              pin.length > i 
                ? error ? 'bg-red-500 scale-110' : 'bg-primary scale-110' 
                : 'bg-gray-300 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-x-8 gap-y-6 w-full max-w-[300px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleNum(num.toString())}
            className="size-16 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-2xl font-semibold text-gray-800 dark:text-white active:scale-95 transition-transform flex items-center justify-center"
          >
            {num}
          </button>
        ))}
        <div className="size-16"></div> {/* Empty slot */}
        <button
            onClick={() => handleNum('0')}
            className="size-16 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-2xl font-semibold text-gray-800 dark:text-white active:scale-95 transition-transform flex items-center justify-center"
          >
            0
        </button>
        <button
            onClick={handleDelete}
            className="size-16 flex items-center justify-center text-gray-400 hover:text-gray-600 active:scale-95 transition-transform"
        >
             <span className="material-symbols-outlined text-3xl">backspace</span>
        </button>
      </div>
    </div>
  );
};
