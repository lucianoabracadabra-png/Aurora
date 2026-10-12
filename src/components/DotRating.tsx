import React from 'react';

export type DotRatingProps = {
  label: string;
  value: number;
  max?: number;
  onChange: (value: number) => void;
  theme?: 'rose' | 'cyan' | 'emerald' | 'violet';
  readonly?: boolean;
  onRoll?: () => void;
};

const themeMap = {
  rose: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] border-rose-500',
  cyan: 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.6)] border-cyan-500',
  emerald: 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)] border-emerald-500',
  violet: 'bg-violet-500 shadow-[0_0_8px_rgba(167,139,250,0.6)] border-violet-500'
};

const valueColorMap = {
  rose: 'text-rose-400',
  cyan: 'text-cyan-400',
  emerald: 'text-emerald-400',
  violet: 'text-violet-400'
};

export const DotRating: React.FC<DotRatingProps> = ({
  label,
  value,
  max = 7,
  onChange,
  theme = 'rose',
  readonly = false,
  onRoll,
}) => {
  // Determine pulse animation level for the level buttons/dots
  const getDotPulseClass = () => {
    if (value === 5) {
      return `animate-pulse-5-${theme}`;
    }
    if (value === 6) {
      return `animate-pulse-6-${theme}`;
    }
    if (value >= 7) {
      return 'animate-pulse-7-white bg-white';
    }
    return '';
  };

  const getContainerGlowClass = () => {
    if (value === 5) {
      return 'border-white/20 bg-white/[0.03] shadow-[0_0_12px_rgba(255,255,255,0.05)]';
    }
    if (value === 6) {
      return 'border-white/40 bg-white/[0.05] shadow-[0_0_16px_rgba(255,255,255,0.15)]';
    }
    if (value >= 7) {
      return 'border-white/70 bg-white/[0.08] shadow-[0_0_24px_rgba(255,255,255,0.25)]';
    }
    return 'border-white/5 bg-white/[0.015]';
  };

  const dotPulseClass = getDotPulseClass();
  const containerGlowClass = getContainerGlowClass();

  return (
    <div 
      onClick={() => {
        if (readonly && onRoll) onRoll();
      }}
      className={`relative flex flex-col justify-between gap-2 p-2.5 rounded-xl border transition-all duration-300 group/skill ${containerGlowClass} ${
        readonly && onRoll ? 'cursor-pointer hover:bg-white/[0.08] hover:border-white/30 active:scale-[0.99]' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-white/70 text-[10px] tracking-widest uppercase font-medium group-hover/skill:text-white transition-colors select-none truncate pr-1">
          {label}
        </span>
        <span className={`text-[10px] font-mono font-bold transition-all select-none ${
          value >= 7
            ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]'
            : value === 6
              ? 'text-white/90 drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]'
              : value === 5
                ? `${valueColorMap[theme]} drop-shadow-[0_0_6px_currentColor]`
                : 'text-white/40 group-hover/skill:text-white/70'
        }`}>
          {value}
        </span>
      </div>

      <div className="flex gap-1.5 w-full items-center">
        {Array.from({ length: max }).map((_, i) => {
          const rating = i + 1;
          const isActive = rating <= value;
          
          return (
            <button
              key={i}
              type="button"
              disabled={readonly}
              onClick={(e) => {
                if (!readonly) {
                  e.stopPropagation();
                  onChange(value === rating ? rating - 1 : rating);
                }
              }}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                isActive 
                  ? `${themeMap[theme]} ${dotPulseClass}` 
                  : 'bg-white/5 border border-white/10'
              } ${readonly ? 'cursor-pointer' : 'hover:bg-white/20 cursor-pointer'}`}
              aria-label={`Rate ${label} ${rating}`}
            />
          );
        })}
      </div>
    </div>
  );
};
