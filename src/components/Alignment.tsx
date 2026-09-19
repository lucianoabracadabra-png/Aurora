import React from 'react';
import { Alignment as AlignmentType } from '../types';

type Props = {
  data: AlignmentType;
  update: (field: keyof AlignmentType, value: number) => void;
  readonly?: boolean;
  expanded?: boolean;
};

const TogglePair = ({
  topLabel,
  bottomLabel,
  value,
  onChange,
  readonly = false,
  expanded = true,
}: {
  topLabel: string;
  bottomLabel: string;
  value: number; // 0 for top, 100 for bottom
  onChange: (v: number) => void;
  readonly?: boolean;
  expanded?: boolean;
}) => {
  const isTopActive = value === 0;
  
  if (!expanded) {
    return (
      <div 
        className={`flex items-center justify-center py-2 ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        onClick={(e) => {
          e.stopPropagation();
          if (!readonly) onChange(isTopActive ? 100 : 0);
        }}
      >
        <span className={`text-[10px] uppercase tracking-[0.2em] font-bold ${isTopActive ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'}`}>
          {isTopActive ? topLabel : bottomLabel}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={`flex flex-col items-center justify-center gap-4 py-4 ${readonly ? 'cursor-default' : 'cursor-pointer'} group`}
      onClick={(e) => {
        e.stopPropagation();
        if (!readonly) onChange(isTopActive ? 100 : 0);
      }}
    >
      <span className={`text-[11px] uppercase tracking-[0.2em] transition-all duration-500 ${isTopActive ? 'text-rose-400 font-bold drop-shadow-[0_0_10px_rgba(244,63,94,0.8)] scale-110' : 'text-slate-500 group-hover:text-slate-400'}`}>
        {topLabel}
      </span>
      <div className={`w-px h-8 transition-colors duration-500 ${isTopActive ? 'bg-gradient-to-b from-rose-400/80 to-transparent shadow-[0_0_10px_rgba(244,63,94,1)]' : 'bg-gradient-to-t from-cyan-400/80 to-transparent shadow-[0_0_10px_rgba(34,211,238,1)]'}`} />
      <span className={`text-[11px] uppercase tracking-[0.2em] transition-all duration-500 ${!isTopActive ? 'text-cyan-400 font-bold drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] scale-110' : 'text-slate-500 group-hover:text-slate-400'}`}>
        {bottomLabel}
      </span>
    </div>
  );
};

export const Alignment: React.FC<Props> = ({ data, update, readonly = false, expanded = true }) => {
  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className={`grid grid-cols-3 divide-x divide-white/10 overflow-hidden bg-white/[0.01] ${expanded ? 'rounded-2xl' : 'rounded-xl'}`}
    >
      <TogglePair
        topLabel="Individualismo"
        bottomLabel="Altruísmo"
        value={data.altruism} // 0 = Individualism, 100 = Altruism
        onChange={(v) => update('altruism', v)}
        readonly={readonly}
        expanded={expanded}
      />
      <TogglePair
        topLabel="Emoção"
        bottomLabel="Lógica"
        value={data.logic}
        onChange={(v) => update('logic', v)}
        readonly={readonly}
        expanded={expanded}
      />
      <TogglePair
        topLabel="Corrupção"
        bottomLabel="Integridade"
        value={data.integrity}
        onChange={(v) => update('integrity', v)}
        readonly={readonly}
        expanded={expanded}
      />
    </div>
  );
};
