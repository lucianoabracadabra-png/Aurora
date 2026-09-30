import React from 'react';
import { Personality as PersonalityType } from '../types';

type Props = {
  data: PersonalityType;
  update: (field: keyof PersonalityType, value: number) => void;
  readonly?: boolean;
  onRoll?: (name: string, value: number) => void;
};

const TRAITS: { key: keyof PersonalityType; label: string }[] = [
  { key: 'courage', label: 'Coragem' },
  { key: 'conviction', label: 'Convicção' },
  { key: 'serenity', label: 'Serenidade' },
];

export const Personality: React.FC<Props> = ({ data, update, readonly = false, onRoll }) => {
  const cycleValue = (current: number) => (current >= 5 ? 1 : current + 1);

  return (
    <div className="grid grid-cols-3 divide-x divide-white/10 bg-white/[0.01] rounded-2xl overflow-hidden border border-white/5">
      {TRAITS.map(t => {
        const val = data[t.key];
        return (
          <div
            key={t.key}
            onClick={() => {
              if (readonly && onRoll) onRoll(t.label, val);
            }}
            title={readonly && onRoll ? `Clique para rolar teste de ${t.label} (${val}d10)` : undefined}
            className={`flex flex-col items-center justify-center p-4 transition-all duration-200 group select-none ${
              readonly && onRoll ? 'cursor-pointer hover:bg-violet-500/[0.06] active:scale-95' : ''
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {!readonly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    update(t.key, Math.max(1, val - 1));
                  }}
                  className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center text-xs transition-colors cursor-pointer"
                  title="Diminuir"
                >
                  -
                </button>
              )}

              <span
                onClick={(e) => {
                  if (!readonly) {
                    e.stopPropagation();
                    update(t.key, cycleValue(val));
                  }
                }}
                className={`text-4xl font-light text-white leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] group-hover:text-violet-200 transition-colors ${
                  !readonly ? 'cursor-pointer hover:scale-105' : ''
                }`}
                title={!readonly ? 'Clique para alternar (1-5)' : undefined}
              >
                {val}
              </span>

              {!readonly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    update(t.key, Math.min(5, val + 1));
                  }}
                  className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center text-xs transition-colors cursor-pointer"
                  title="Aumentar"
                >
                  +
                </button>
              )}
            </div>

            <span className="text-[10px] tracking-widest uppercase font-medium text-violet-400 group-hover:text-violet-300 transition-colors drop-shadow-[0_0_8px_currentColor]">
              {t.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
