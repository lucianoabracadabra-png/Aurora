import React from 'react';

export interface AttributeInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  theme: 'rose' | 'cyan' | 'emerald';
  readonly: boolean;
  onRoll?: () => void;
}

export const AttributeInput: React.FC<AttributeInputProps> = ({
  label,
  value,
  onChange,
  theme,
  readonly,
  onRoll
}) => {
  const themeColors = {
    rose: 'border-rose-500/20 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]',
    cyan: 'border-cyan-500/20 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]',
    emerald: 'border-emerald-500/20 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]'
  };

  const displayLabel = label.length > 5 ? label.slice(0, 5) : label;

  return (
    <div
      onClick={() => {
        if (readonly && onRoll) onRoll();
      }}
      title={readonly ? (onRoll ? `Clique para rolar teste de ${label} (${value})` : label) : label}
      className={`relative group/attr flex flex-col flex-1 items-center justify-center p-2 sm:p-3 rounded-xl border bg-white/[0.015] transition-all select-none ${
        themeColors[theme].split(' ')[0]
      } ${
        readonly && onRoll
          ? 'cursor-pointer hover:bg-white/[0.05] hover:border-white/20 active:scale-[0.98]'
          : ''
      }`}
    >
      <span
        title={label}
        className="text-[9px] uppercase tracking-widest text-white/50 mb-1.5 font-bold group-hover/attr:text-white/80 transition-colors text-center w-full truncate"
      >
        {displayLabel}
      </span>

      <div className="flex items-center justify-center gap-1 sm:gap-1.5 my-auto">
        {!readonly && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(Math.max(0, value - 1));
            }}
            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center text-[10px] sm:text-xs transition-colors cursor-pointer shrink-0"
            title="Diminuir"
          >
            -
          </button>
        )}

        {readonly ? (
          <span className={`text-3xl sm:text-4xl font-light font-mono tabular-nums leading-none ${themeColors[theme].split(' ').slice(1).join(' ')}`}>
            {value}
          </span>
        ) : (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange(value + 1);
            }}
            className={`text-2xl sm:text-3xl font-light font-mono tabular-nums leading-none cursor-pointer hover:scale-105 transition-transform ${themeColors[theme].split(' ').slice(1).join(' ')}`}
            title="Clique para aumentar (+1)"
          >
            {value}
          </span>
        )}

        {!readonly && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(value + 1);
            }}
            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center text-[10px] sm:text-xs transition-colors cursor-pointer shrink-0"
            title="Aumentar"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
};
