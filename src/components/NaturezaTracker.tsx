import React from 'react';
import { Domains as DomainsType, NaturezaSpent } from '../types';
import { Droplets, Wind, Sparkles, Flame, Mountain, Minus, Plus, RotateCcw } from 'lucide-react';

type Props = {
  domains: DomainsType;
  personalityTotal: number;
  naturezaSpent: NaturezaSpent;
  onNaturezaChange: (domain: keyof DomainsType, value: number) => void;
  readonly?: boolean;
};

interface ElementConfig {
  id: keyof DomainsType;
  name: string;
  icon: React.ElementType;
  color: string;
  accentColor: string;
  borderColor: string;
  barColor: string;
  bgGlow: string;
}

const ELEMENTS: ElementConfig[] = [
  {
    id: 'water',
    name: 'Água',
    icon: Droplets,
    color: 'text-blue-400',
    accentColor: 'text-cyan-300',
    borderColor: 'border-blue-500/30 hover:border-blue-400/60',
    barColor: 'from-blue-600 via-blue-500 to-cyan-400',
    bgGlow: 'bg-blue-500/15'
  },
  {
    id: 'air',
    name: 'Ar',
    icon: Wind,
    color: 'text-cyan-300',
    accentColor: 'text-sky-200',
    borderColor: 'border-cyan-400/30 hover:border-cyan-300/60',
    barColor: 'from-teal-600 via-cyan-500 to-sky-300',
    bgGlow: 'bg-cyan-400/15'
  },
  {
    id: 'anima',
    name: 'Anima',
    icon: Sparkles,
    color: 'text-violet-400',
    accentColor: 'text-fuchsia-300',
    borderColor: 'border-violet-500/30 hover:border-violet-400/60',
    barColor: 'from-violet-600 via-purple-500 to-fuchsia-400',
    bgGlow: 'bg-violet-500/15'
  },
  {
    id: 'fire',
    name: 'Fogo',
    icon: Flame,
    color: 'text-orange-400',
    accentColor: 'text-amber-300',
    borderColor: 'border-orange-500/30 hover:border-orange-400/60',
    barColor: 'from-red-600 via-orange-500 to-amber-400',
    bgGlow: 'bg-orange-500/15'
  },
  {
    id: 'earth',
    name: 'Terra',
    icon: Mountain,
    color: 'text-emerald-400',
    accentColor: 'text-teal-300',
    borderColor: 'border-emerald-500/30 hover:border-emerald-400/60',
    barColor: 'from-emerald-600 via-green-500 to-teal-300',
    bgGlow: 'bg-emerald-500/15'
  }
];

export const NaturezaTracker: React.FC<Props> = ({
  domains,
  personalityTotal,
  naturezaSpent,
  onNaturezaChange,
  readonly = false
}) => {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 md:gap-3.5 w-full">
      {ELEMENTS.map(elem => {
        const domainValue = domains[elem.id];
        const isActive = domainValue > 0;
        // 1º Threshold: soma da personalidade
        const firstThreshold = personalityTotal;
        // 2º Threshold: soma personalidade + soma de cada domínio relacionado
        const secondThreshold = firstThreshold + domainValue;
        const spent = naturezaSpent[elem.id] || 0;
        const currentMana = Math.max(0, secondThreshold - spent);
        const percent = secondThreshold > 0 ? Math.min(100, Math.max(0, (currentMana / secondThreshold) * 100)) : 0;
        const firstThresholdPercent = secondThreshold > 0 ? (firstThreshold / secondThreshold) * 100 : 100;
        const isSecondThresholdActive = currentMana > firstThreshold;
        const Icon = elem.icon;

        const handleSpendChange = (newSpent: number) => {
          if (readonly) return;
          const clamped = Math.min(secondThreshold, Math.max(0, newSpent));
          onNaturezaChange(elem.id, clamped);
        };

        return (
          <div
            key={elem.id}
            className={`flex flex-col items-center justify-between bg-[#0b0813]/80 backdrop-blur-xl border rounded-2xl sm:rounded-3xl p-1.5 sm:p-3 relative overflow-hidden transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.4)] ${
              isActive ? `${elem.borderColor} hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]` : 'border-white/10 opacity-75 hover:opacity-100'
            }`}
          >
            {/* Background ambient glow */}
            {isActive && (
              <div className={`absolute -top-8 -right-8 w-20 h-20 rounded-full ${elem.bgGlow} blur-2xl pointer-events-none`} />
            )}

            {/* Column Header: Apenas Ícone Solto com o espaçamento e respiro da caixa anterior */}
            <div className="flex items-center justify-center relative w-full py-1.5 sm:py-2.5 relative z-10">
              {/* Container invisível que preserva o espaçamento/área da caixa anterior */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
                <Icon 
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${elem.color} drop-shadow-sm`} 
                  title={elem.name}
                />
              </div>
              {spent > 0 && !readonly && (
                <button
                  type="button"
                  onClick={() => handleSpendChange(0)}
                  title={`Restaurar ${elem.name}`}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 sm:p-1 text-white/30 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
              )}
            </div>

            {/* Numeric display: Atual / 1º / 2º */}
            <div className="flex flex-col items-center my-1.5 sm:my-2 relative z-10">
              <span className={`text-xl sm:text-3xl md:text-4xl font-light leading-none tracking-tight ${
                isSecondThresholdActive ? `${elem.accentColor} drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]` : isActive ? elem.color : 'text-white/90'
              }`}>
                {currentMana}
              </span>
              <div
                className="flex items-center gap-1 text-[9px] sm:text-[11px] text-white/40 font-mono mt-0.5 leading-none"
                title={`Personalidade: ${firstThreshold} | Limite: ${secondThreshold}`}
              >
                <span>{firstThreshold}</span>
                <span>/</span>
                <span className={domainValue > 0 ? "text-white/80 font-semibold" : ""}>{secondThreshold}</span>
              </div>
            </div>

            {/* Vertical Bar Chamber */}
            <div className="relative w-full flex items-center justify-center my-1 sm:my-2 z-10">
              <div 
                className="relative w-7 sm:w-10 md:w-12 h-36 sm:h-48 md:h-56 rounded-full bg-black/50 border border-white/10 p-0.5 sm:p-1 flex flex-col justify-end overflow-hidden shadow-inner cursor-pointer"
                onClick={() => {
                  if (!readonly) {
                    if (spent < secondThreshold) handleSpendChange(spent + 1);
                    else handleSpendChange(0);
                  }
                }}
                title={!readonly ? `Clique para gastar (-1). Atual: ${currentMana}/${secondThreshold}` : undefined}
              >
                {/* Background Subtle Division Lines */}
                <div className="absolute inset-x-0 bottom-1/4 border-b border-white/[0.04] pointer-events-none" />
                <div className="absolute inset-x-0 bottom-2/4 border-b border-white/[0.04] pointer-events-none" />
                <div className="absolute inset-x-0 bottom-3/4 border-b border-white/[0.04] pointer-events-none" />

                {/* Linha divisória da personalidade (quando domínio > 0) */}
                {domainValue > 0 && (
                  <div
                    className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                    style={{ bottom: `${firstThresholdPercent}%` }}
                    title={`Base (Personalidade): ${firstThreshold} | Limite: ${secondThreshold}`}
                  >
                    <div className="w-full border-b-2 border-dashed border-white/60 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                  </div>
                )}

                {/* Vertical Filling Fluid */}
                <div
                  className={`w-full rounded-full bg-gradient-to-t ${elem.barColor} transition-all duration-300 relative`}
                  style={{ height: `${percent}%` }}
                >
                  {/* Glowing Top Surface Cap */}
                  {percent > 2 && (
                    <div className="absolute top-0 left-0 right-0 h-1.5 sm:h-2 rounded-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                  )}
                </div>
              </div>
            </div>

            {/* Spent Indicator */}
            <div className="flex items-center justify-center gap-1 w-full text-center my-1 z-10">
              <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider text-white/40">
                Gasto:
              </span>
              <span className={`text-[9px] sm:text-xs font-mono font-bold ${spent > 0 ? 'text-amber-400' : 'text-white/60'}`}>
                {spent}
              </span>
            </div>

            {/* Controls: Gastar (-) / Recuperar (+) */}
            {!readonly ? (
              <div className="flex items-center justify-center gap-1 w-full mt-auto pt-1 relative z-10">
                <button
                  type="button"
                  onClick={() => handleSpendChange(spent + 1)}
                  disabled={spent >= secondThreshold}
                  title="Gastar 1 ponto (diminui reserva)"
                  className="w-6 h-6 sm:w-8 sm:h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] active:scale-95 border border-white/10 text-white/70 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSpendChange(spent - 1)}
                  disabled={spent <= 0}
                  title="Recuperar 1 ponto (aumenta reserva)"
                  className="w-6 h-6 sm:w-8 sm:h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] active:scale-95 border border-white/10 text-white/70 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-center text-[8px] sm:text-[9px] text-white/30 pt-1 font-mono">
                {isSecondThresholdActive ? 'Ampliado' : 'Base'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
