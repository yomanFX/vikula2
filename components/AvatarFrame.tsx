
import React from 'react';

interface AvatarFrameProps {
  frameId: string | null;
  src: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AvatarFrame: React.FC<AvatarFrameProps> = ({ frameId, src, size = 'lg', className = '' }) => {
  const sizeClasses = {
    sm: 'size-12',
    md: 'size-16',
    lg: 'size-32',
    xl: 'size-40'
  };

  const frameSize = sizeClasses[size];
  
  // Default circular image if no frame
  if (!frameId || frameId === 'frame_classic') {
    return (
      <div className={`${frameSize} rounded-full border-4 border-[#8B5A2B] shadow-inner overflow-hidden relative ${className} bg-gray-200`}>
        <img src={src} alt="avatar" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${frameSize} relative flex items-center justify-center ${className}`}>
        
      {/* THE AVATAR IMAGE (Masked) */}
      <div className="absolute inset-[14%] rounded-full overflow-hidden z-10 bg-gray-900">
         <img src={src} alt="avatar" className="w-full h-full object-cover" />
      </div>

      {/* --- FRAME RENDERERS --- */}

      {/* 1. GOLD DRAGON (Legendary) */}
      {frameId === 'frame_gold' && (
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-20 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
            <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FCD34D" />
                    <stop offset="50%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#FCD34D" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            {/* Outer Ring */}
            <circle cx="50" cy="50" r="46" fill="none" stroke="url(#goldGrad)" strokeWidth="4" />
            {/* Dragon Claws Bottom */}
            <path d="M20,80 Q50,100 80,80 L75,85 Q50,95 25,85 Z" fill="#B45309" stroke="#78350F" strokeWidth="1" />
            {/* Dragon Wings Top */}
            <path d="M10,40 Q0,20 30,10 L50,5 L70,10 Q100,20 90,40" fill="none" stroke="url(#goldGrad)" strokeWidth="3" strokeLinecap="round" filter="url(#glow)" />
            {/* Gem */}
            <circle cx="50" cy="90" r="4" fill="#EF4444" stroke="#7F1D1D" strokeWidth="1" />
        </svg>
      )}

      {/* 2. NEON CYBER (Epic) */}
      {frameId === 'frame_neon' && (
        <div className="absolute inset-0 w-full h-full z-20">
            <svg viewBox="0 0 100 100" className="w-full h-full animate-pulse-slow">
                <defs>
                    <linearGradient id="neonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                </defs>
                {/* Tech Circle */}
                <circle cx="50" cy="50" r="44" fill="none" stroke="url(#neonGrad)" strokeWidth="2" strokeDasharray="10 5" />
                <circle cx="50" cy="50" r="48" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.5" />
                
                {/* HUD Elements */}
                <path d="M10,50 L20,50" stroke="#3b82f6" strokeWidth="2" />
                <path d="M90,50 L80,50" stroke="#3b82f6" strokeWidth="2" />
                <path d="M50,10 L50,20" stroke="#a855f7" strokeWidth="2" />
                <path d="M50,90 L50,80" stroke="#a855f7" strokeWidth="2" />
            </svg>
        </div>
      )}

      {/* 3. NATURE DRUID (Rare) */}
      {frameId === 'frame_nature' && (
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-20">
             {/* Vines */}
             <circle cx="50" cy="50" r="45" fill="none" stroke="#15803d" strokeWidth="5" strokeLinecap="round" strokeDasharray="20 10" />
             {/* Leaves */}
             <path d="M10,50 Q5,30 20,40 Z" fill="#4ade80" />
             <path d="M90,50 Q95,70 80,60 Z" fill="#4ade80" />
             <path d="M50,10 Q70,5 60,20 Z" fill="#22c55e" />
             <circle cx="50" cy="92" r="3" fill="#facc15" />
        </svg>
      )}

      {/* 4. VOID (Epic) */}
      {frameId === 'frame_void' && (
        <div className="absolute inset-0 w-full h-full z-20">
             <div className="absolute inset-0 rounded-full border-[6px] border-purple-900 shadow-[0_0_20px_#581c87]"></div>
             <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[spin_10s_linear_infinite]">
                 <circle cx="50" cy="50" r="48" fill="none" stroke="#9333ea" strokeWidth="1" strokeDasharray="2 8" />
             </svg>
             <div className="absolute -bottom-2 w-full text-center text-2xl animate-bounce">👁️</div>
        </div>
      )}

      {/* 5. LOVE (Rare) */}
      {frameId === 'frame_love' && (
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-20">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#ec4899" strokeWidth="4" />
            <path d="M50,85 L45,80 L50,75 L55,80 Z" fill="#f43f5e" />
            <text x="50" y="15" fontSize="10" textAnchor="middle" fill="#ec4899">❤️</text>
            <text x="15" y="50" fontSize="10" textAnchor="middle" fill="#ec4899">❤️</text>
            <text x="85" y="50" fontSize="10" textAnchor="middle" fill="#ec4899">❤️</text>
        </svg>
      )}

      {/* Rarity Gem Placeholder (Bottom) */}
      {frameId !== 'frame_classic' && (
          <div className="absolute bottom-0 z-30 translate-y-1/2">
             <div className="w-8 h-8 rotate-45 border-2 border-white shadow-lg bg-gradient-to-br from-gray-700 to-black flex items-center justify-center">
                <div className="w-4 h-4 bg-white/20"></div>
             </div>
          </div>
      )}
    </div>
  );
};
