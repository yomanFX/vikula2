
import React from 'react';

export const Court: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="size-24 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-6 shadow-ios border border-indigo-100 dark:border-indigo-800">
        <span className="material-symbols-outlined text-5xl text-indigo-500">balance</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-display">Судебные Разбирательства</h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-8 text-sm leading-relaxed">
        Здесь будут проходить слушания по особо тяжким преступлениям и апелляции.
      </p>
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
        <span className="size-2 rounded-full bg-gray-400 animate-pulse"></span>
        Скоро
      </span>
    </div>
  );
};
