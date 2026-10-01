import React from 'react';
import { FlowAndPatron as FlowAndPatronType, FlowPatronData } from '../types';
import { Activity, Crown, Plus, Minus, Heart } from 'lucide-react';

type Props = {
  data: FlowAndPatronType;
  update: (type: 'fluxo' | 'patrono', field: keyof FlowPatronData, value: any) => void;
  readonly?: boolean;
};

interface BoxCardProps {
  type: 'fluxo' | 'patrono';
  title: string;
  defaultName: string;
  data: FlowPatronData;
  update: (field: keyof FlowPatronData, value: any) => void;
  readonly: boolean;
  theme: 'cyan' | 'amber';
}

const FlowPatronBox: React.FC<BoxCardProps> = ({
  type,
  title,
  defaultName,
  data,
  update,
  readonly,
  theme
}) => {
  const level = data.level ?? 1;
  const hp = Math.max(0, Math.min(10, data.hp ?? 10));
  const modifier = level - hp;
  const displayName = data.name || defaultName;

  const isCyan = theme === 'cyan';

  const themeStyles = isCyan ? {
    border: 'border-cyan-500/30 hover:border-cyan-400/50',
    titleColor: 'text-cyan-400',
    bgGlow: 'bg-cyan-500/10',
    accentText: 'text-cyan-300',
    pipActive: 'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]',
    pipInactive: 'bg-black/60 border-white/10 opacity-40',
    iconBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
  } : {
    border: 'border-amber-500/30 hover:border-amber-400/50',
    titleColor: 'text-amber-400',
    bgGlow: 'bg-amber-500/10',
    accentText: 'text-amber-300',
    pipActive: 'bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
    pipInactive: 'bg-black/60 border-white/10 opacity-40',
    iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  };

  const handlePipClick = (index: number) => {
    if (readonly) return;
    const targetHp = index + 1;
    if (hp === targetHp) {
      update('hp', index);
    } else {
      update('hp', targetHp);
    }
  };

  const formattedMod = modifier >= 0 ? `+${modifier}` : `${modifier}`;

  return (
    <div className={`flex flex-col bg-[#050508]/40 backdrop-blur-xl border rounded-[2rem] p-5 sm:p-6 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden gap-4 ${themeStyles.border}`}>
      {/* Subtle Glow */}
      <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full ${themeStyles.bgGlow} blur-2xl pointer-events-none`} />

      {/* Header: Título Apenas (Sem Ícone, Sem Subtítulo) e MOD na Direita */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 relative z-10">
        <span className={`text-xs uppercase font-bold tracking-[0.2em] ${themeStyles.titleColor}`}>
          {title}
        </span>

        {/* Exibição Única de MOD */}
        <div 
          className="flex flex-col items-center shrink-0"
          title={`Modificador = Nível (${level}) - PV (${hp}) = ${formattedMod}`}
        >
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/40">
            MOD
          </span>
          <div className={`text-base sm:text-lg font-black font-mono px-3 py-0.5 rounded-xl border leading-tight ${
            modifier > 0
              ? 'text-emerald-300 bg-emerald-950/70 border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
              : modifier < 0
                ? 'text-rose-300 bg-rose-950/70 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'text-slate-200 bg-white/5 border-white/20'
          }`}>
            {formattedMod}
          </div>
        </div>
      </div>

      {/* Linha de Nível e PV (Valor) Lado a Lado */}
      <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-2xl p-3 shadow-inner relative z-10">
        {/* Nível (Com controles - e + apenas em modo edição) */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
            Nível:
          </span>
          <span className={`text-2xl font-light font-mono ${themeStyles.accentText}`}>
            {level}
          </span>

          {!readonly && (
            <div className="flex items-center gap-1 ml-1 border-l border-white/10 pl-2">
              <button
                type="button"
                onClick={() => update('level', Math.max(0, level - 1))}
                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 flex items-center justify-center transition-all cursor-pointer"
                title="Diminuir Nível"
              >
                <Minus size={12} />
              </button>
              <button
                type="button"
                onClick={() => update('level', level + 1)}
                className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 flex items-center justify-center transition-all cursor-pointer"
                title="Aumentar Nível"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>

        {/* PV (Valor) */}
        <div className="flex items-center gap-1.5">
          <Heart size={13} className="text-rose-400 fill-rose-500/20" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
            PV:
          </span>
          <span className="text-sm font-mono font-bold text-white/90">
            <span className={hp > 5 ? 'text-emerald-400' : hp > 2 ? 'text-amber-400' : 'text-rose-400'}>{hp}</span>
            <span className="text-white/30"> / 10</span>
          </span>
        </div>
      </div>

      {/* Linha com apenas os riscos e os botões - (esquerda) e + (direita) */}
      <div className="flex items-center gap-2.5 w-full relative z-10 bg-black/40 border border-white/10 rounded-2xl p-3 shadow-inner">
        {/* Botão - na ESQUERDA */}
        <button
          type="button"
          onClick={() => update('hp', Math.max(0, hp - 1))}
          disabled={hp <= 0}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:scale-95 text-rose-300 hover:text-white border border-rose-500/30 disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
          title="Reduzir Pontos de Vida (-)"
        >
          <Minus size={16} />
        </button>

        {/* Riscos / Pips no centro ocupando toda a largura */}
        <div className="flex items-center gap-1 flex-1 py-1">
          {Array.from({ length: 10 }).map((_, i) => {
            const isActive = i < hp;
            return (
              <button
                key={i}
                type="button"
                onClick={() => handlePipClick(i)}
                className={`h-7 flex-1 rounded-md border transition-all duration-200 cursor-pointer ${
                  isActive ? themeStyles.pipActive : themeStyles.pipInactive
                } hover:scale-110 active:scale-95`}
                title={`PV ${i + 1} de 10`}
              />
            );
          })}
        </div>

        {/* Botão + na DIREITA */}
        <button
          type="button"
          onClick={() => update('hp', Math.min(10, hp + 1))}
          disabled={hp >= 10}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 text-emerald-300 hover:text-white border border-emerald-500/30 disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
          title="Aumentar Pontos de Vida (+)"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export const FlowAndPatron: React.FC<Props> = ({ data, update, readonly = false }) => {
  const fluxoData = data.fluxo || { level: 1, hp: 10, name: 'Fluxo Arcano' };
  const patronoData = data.patrono || { level: 1, hp: 10, name: 'Patrono Primordial' };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      <FlowPatronBox
        type="fluxo"
        title="Fluxo"
        defaultName="Fluxo Arcano"
        data={fluxoData}
        update={(field, val) => update('fluxo', field, val)}
        readonly={readonly}
        theme="cyan"
      />

      <FlowPatronBox
        type="patrono"
        title="Patrono"
        defaultName="Patrono Primordial"
        data={patronoData}
        update={(field, val) => update('patrono', field, val)}
        readonly={readonly}
        theme="amber"
      />
    </div>
  );
};


