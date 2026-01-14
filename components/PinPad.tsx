
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
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#F2F6FC] dark:bg-[#121212] transition-colors">
      
      <div className="mb-12 flex flex-col items-center animate-slideUp">
        <div className="size-24 bg-white dark:bg-[#1E1E1E] rounded-[32px] flex items-center justify-center mb-6 shadow-floating transform rotate-6">
            <span className="material-symbols-rounded text-6xl text-googleBlue">lock</span>
        </div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 font-display tracking-tight">Привет!</h1>
        <p className="text-gray-500 font-bold">Введите код доступа</p>
      </div>

      {/* Google Dots */}
      <div className="flex gap-4 mb-16 h-5 items-center">
        {[0, 1, 2, 3].map(i => {
           const colors = ['bg-googleBlue', 'bg-googleRed', 'bg-googleYellow', 'bg-googleGreen'];
           return (
            <div key={i} className={`rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                ${pin.length > i 
                    ? error 
                        ? 'bg-red-500 w-4 h-4 translate-x-1' 
                        : `${colors[i]} w-6 h-6 shadow-sm`
                    : 'bg-gray-200 dark:bg-gray-700 w-3 h-3'}`} 
            />
           );
        })}
      </div>

      {/* Keys */}
      <div className="grid grid-cols-3 gap-x-6 gap-y-6 w-full max-w-[320px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num, idx) => (
          <button key={num} onClick={() => handleNum(num.toString())}
            className="size-24 rounded-full bg-white dark:bg-[#1E1E1E] text-4xl font-black font-display text-gray-800 dark:text-white shadow-sticker active:shadow-pressed active:scale-90 transition-all duration-200"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {num}
          </button>
        ))}
        <div></div>
        <button onClick={() => handleNum('0')} className="size-24 rounded-full bg-white dark:bg-[#1E1E1E] text-4xl font-black font-display text-gray-800 dark:text-white shadow-sticker active:shadow-pressed active:scale-90 transition-all duration-200">0</button>
        <button onClick={handleDelete} className="size-24 flex items-center justify-center text-gray-400 active:text-gray-900 dark:active:text-white transition-colors active:scale-90">
             <span className="material-symbols-rounded text-4xl">backspace</span>
        </button>
      </div>
    </div>
  );
};