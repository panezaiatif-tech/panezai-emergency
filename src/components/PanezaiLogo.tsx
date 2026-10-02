import React from 'react';

interface PanezaiLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const PanezaiLogo: React.FC<PanezaiLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 32, text: 'text-sm' },
    md: { icon: 44, text: 'text-base' },
    lg: { icon: 64, text: 'text-xl' },
    xl: { icon: 96, text: 'text-2xl' },
  };

  const { icon, text } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Precision Vector Emblem */}
      <div
        className="relative flex-shrink-0"
        style={{ width: icon, height: icon }}
      >
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full drop-shadow-xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Golden Border Shield */}
          <path
            d="M60 6L108 24V60C108 90 60 114 60 114C60 114 12 90 12 60V24L60 6Z"
            fill="url(#shieldGradient)"
            stroke="url(#goldBorder)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Inner Shield Inset */}
          <path
            d="M60 14L98 28V58C98 83 60 104 60 104C60 104 22 83 22 58V28L60 14Z"
            fill="#062817"
            stroke="#10B981"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />

          {/* Emergency Cross / Crescent & Star */}
          {/* Crescent */}
          <path
            d="M58 32C47 32 38 41 38 52C38 63 47 72 58 72C63.5 72 68.5 69.8 72 66.2C64 67.5 56 62.5 54 54.5C52.2 47.3 56.5 40 64 36C62 33.5 60.1 32 58 32Z"
            fill="#FFFFFF"
          />

          {/* 5-pointed Star */}
          <polygon
            points="68,40 70,44 74,44 71,46.5 72,50.5 68,48 64,50.5 65,46.5 62,44 66,44"
            fill="#FACC15"
          />

          {/* Emergency Lifeline ECG Pulse in vibrant red */}
          <path
            d="M26 68H44L48 58L54 78L60 54L66 74L70 66L74 70H94"
            stroke="#EF4444"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Golden Star Base Accent */}
          <circle cx="60" cy="94" r="3" fill="#F59E0B" />
          <circle cx="50" cy="91" r="2" fill="#F59E0B" opacity="0.8" />
          <circle cx="70" cy="91" r="2" fill="#F59E0B" opacity="0.8" />

          {/* Gradients */}
          <defs>
            <linearGradient id="shieldGradient" x1="60" y1="6" x2="60" y2="114" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0B4628" />
              <stop offset="0.6" stopColor="#062E1A" />
              <stop offset="1" stopColor="#03160D" />
            </linearGradient>

            <linearGradient id="goldBorder" x1="12" y1="6" x2="108" y2="114" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="0.3" stopColor="#EAB308" />
              <stop offset="0.7" stopColor="#CA8A04" />
              <stop offset="1" stopColor="#FACC15" />
            </linearGradient>
          </defs>
        </svg>

        {/* Live Active Glow Dot */}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#091122]"></span>
        </span>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-black tracking-tight text-white uppercase ${text}`}>
              PANEZAI
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 border border-amber-600/50 px-1.5 py-0.5 rounded">
              OFFICIAL
            </span>
          </div>
          <span className="text-[10px] sm:text-xs font-extrabold tracking-widest text-emerald-400 uppercase mt-0.5">
            EMERGENCY NETWORK
          </span>
        </div>
      )}
    </div>
  );
};
