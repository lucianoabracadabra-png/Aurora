import React from 'react';
import { Domains as DomainsType } from '../types';
import { Droplets, Wind, Sparkles, Flame, Mountain } from 'lucide-react';

type Props = {
  data: DomainsType;
  update: (field: keyof DomainsType, value: number) => void;
  readonly?: boolean;
};

interface ElementDomainConfig {
  id: keyof DomainsType;
  label: string;
  icon: React.ElementType;
  colorClass: string;
  glowClass: string;
  borderClass: string;
  bgGlow: string;
}

const DOMAIN_ELEMENTS: ElementDomainConfig[] = [
  {
    id: 'water',
    label: 'Água',
    icon: Droplets,
    colorClass: 'text-blue-400',
    glowClass: 'drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]',
    borderClass: 'border-blue-500/50',
    bgGlow: 'bg-blue-500/10'
  },
  {
    id: 'air',
    label: 'Ar',
    icon: Wind,
    colorClass: 'text-cyan-300',
    glowClass: 'drop-shadow-[0_0_10px_rgba(103,232,249,0.8)]',
    borderClass: 'border-cyan-300/50',
    bgGlow: 'bg-cyan-300/10'
  },
  {
    id: 'anima',
    label: 'Anima',
    icon: Sparkles,
    colorClass: 'text-violet-400',
    glowClass: 'drop-shadow-[0_0_10px_rgba(167,139,250,0.8)]',
    borderClass: 'border-violet-500/50',
    bgGlow: 'bg-violet-500/10'
  },
  {
    id: 'fire',
    label: 'Fogo',
    icon: Flame,
    colorClass: 'text-orange-500',
    glowClass: 'drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]',
    borderClass: 'border-orange-500/50',
    bgGlow: 'bg-orange-500/10'
  },
  {
    id: 'earth',
    label: 'Terra',
    icon: Mountain,
    colorClass: 'text-emerald-400',
    glowClass: 'drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]',
    borderClass: 'border-emerald-500/50',
    bgGlow: 'bg-emerald-500/10'
  }
];

export const Domains: React.FC<Props> = ({ data, update, readonly = false }) => {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3.5 w-full">
      {DOMAIN_ELEMENTS.map(elem => {
        const value = data[elem.id] || 0;
        const isActive = value > 0;
        const Icon = elem.icon;

        const cycleValue = () => {
          if (readonly) return;
          update(elem.id, value >= 5 ? 0 : value + 1);
        };

        return (
          <div
            key={elem.id}
            onClick={cycleValue}
            title={readonly ? `${elem.label}: Nível ${value}` : `Clique para alterar nível de ${elem.label} (${value}/5)`}
            className={`relative flex flex-col items-center justify-between p-2.5 sm:p-4 rounded-2xl border transition-all duration-300 select-none overflow-hidden h-28 sm:h-36 shadow-[0_4px_24px_rgba(0,0,0,0.35)] ${
              isActive
                ? `${elem.borderClass} bg-[#0b0813]/85 hover:border-white/30`
                : 'border-white/10 bg-[#0b0813]/60 opacity-60 hover:opacity-90 hover:border-white/20'
            } ${readonly ? 'cursor-default' : 'cursor-pointer active:scale-95 hover:bg-white/[0.04]'}`}
          >
            {/* Background ambient element tint */}
            {isActive && (
              <div className={`absolute inset-0 ${elem.bgGlow} opacity-30 pointer-events-none`} />
            )}

            {/* Icon */}
            <div className="relative z-10 pt-0.5">
              <Icon
                size={22}
                className={`transition-all duration-300 ${
                  isActive
                    ? `${elem.colorClass} ${elem.glowClass} scale-110`
                    : 'text-slate-500'
                }`}
              />
            </div>

            {/* Level value */}
            <div className="relative z-10 flex items-center justify-center gap-1 sm:gap-1.5 my-auto">
              {!readonly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    update(elem.id, Math.max(0, value - 1));
                  }}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center text-[10px] sm:text-xs transition-colors cursor-pointer shrink-0"
                  title="Diminuir"
                >
                  -
                </button>
              )}

              <span
                onClick={(e) => {
                  if (!readonly) {
                    e.stopPropagation();
                    cycleValue();
                  }
                }}
                className={`text-2xl sm:text-3xl font-light leading-none tracking-tight transition-all duration-300 ${
                  !readonly ? 'cursor-pointer hover:scale-105' : ''
                } ${
                  isActive
                    ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.45)]'
                    : 'text-white/20'
                }`}
                title={!readonly ? 'Clique para alternar (0-5)' : undefined}
              >
                {value}
              </span>

              {!readonly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    update(elem.id, Math.min(5, value + 1));
                  }}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center text-[10px] sm:text-xs transition-colors cursor-pointer shrink-0"
                  title="Aumentar"
                >
                  +
                </button>
              )}
            </div>

            {/* Name label */}
            <div className="relative z-10 w-full flex flex-col items-center pb-0.5">
              <span
                className={`text-[9px] sm:text-[10px] uppercase tracking-widest font-bold transition-all duration-300 ${
                  isActive ? elem.colorClass : 'text-slate-400'
                }`}
              >
                {elem.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
