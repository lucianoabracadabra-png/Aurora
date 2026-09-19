import React from 'react';

type DotRatingProps = {
  label: string;
  value: number;
  max?: number;
  onChange: (value: number) => void;
  theme?: 'rose' | 'cyan' | 'emerald';
  readonly?: boolean;
  onRoll?: () => void;
};

const themeMap = {
  rose: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] border-rose-500',
  cyan: 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.6)] border-cyan-500',
  emerald: 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)] border-emerald-500',
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
  return (
    <div 
      onClick={() => {
        if (onRoll) onRoll();
      }}
      className={`relative flex flex-col justify-between gap-2 p-2.5 rounded-xl border border-white/5 bg-white/[0.015] transition-all duration-200 group/skill ${
        onRoll ? 'cursor-pointer hover:bg-white/[0.05] hover:border-white/15 active:scale-[0.99]' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-white/60 text-[10px] tracking-widest uppercase font-medium group-hover/skill:text-white transition-colors select-none">
          {label}
        </span>
        <span className="text-[10px] font-mono text-white/30 group-hover/skill:text-white/60 transition-colors select-none">
          {value}
        </span>
      </div>

      <div className="flex gap-1.5 w-full">
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
                  ? themeMap[theme] 
                  : 'bg-white/5 border border-white/10'
              } ${readonly ? 'cursor-pointer' : 'hover:bg-white/15 cursor-pointer'}`}
              aria-label={`Rate ${label} ${rating}`}
            />
          );
        })}
      </div>
    </div>
  );
};
