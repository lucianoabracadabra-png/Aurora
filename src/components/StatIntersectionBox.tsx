import React, { useRef, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Card } from './ui/Card';

export interface StatIntersectionBoxProps {
  title: string;
  theme: 'rose' | 'cyan' | 'emerald';
  children: React.ReactNode;
  manaSpent: number;
  manaTotal: number;
  onManaChange: (v: number) => void;
  readonly: boolean;
}

export const StatIntersectionBox: React.FC<StatIntersectionBoxProps> = ({
  title,
  theme,
  children,
  manaSpent,
  manaTotal,
  onManaChange,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const titleThemeColors = {
    rose: 'text-rose-400',
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400'
  };

  const manaLabels = {
    rose: 'Vigor',
    cyan: 'Foco',
    emerald: 'Graça'
  };

  const currentMana = Math.max(0, manaTotal - manaSpent);
  const percent = manaTotal > 0 ? Math.min(100, Math.max(0, (currentMana / manaTotal) * 100)) : 0;

  const barGradients = {
    rose: 'from-rose-600 via-pink-500 to-rose-400',
    cyan: 'from-cyan-600 via-sky-500 to-cyan-300',
    emerald: 'from-emerald-600 via-green-500 to-emerald-300'
  };

  const adjustMana = (delta: number) => {
    const newCurrent = Math.min(manaTotal, Math.max(0, currentMana + delta));
    onManaChange(manaTotal - newCurrent);
  };

  const resetMana = () => {
    onManaChange(0);
  };

  return (
    <Card 
      ref={ref}
      title={title} 
      titleClassName={titleThemeColors[theme]}
    >
      {/* SEÇÃO DE MANA DO EIXO COM BARRA DE ENERGIA E CONTROLADORES */}
      <div className="flex flex-col gap-2.5 bg-white/[0.02] border border-white/5 rounded-2xl p-3 sm:p-3.5 mb-6 shadow-inner relative overflow-hidden">
        {/* Top Header: Rótulo do Eixo & Valores */}
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] tracking-widest uppercase font-bold text-white/70">
              {manaLabels[theme]}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-black font-mono tabular-nums tracking-tight drop-shadow-[0_0_12px_currentColor] ${titleThemeColors[theme]}`}>
              {currentMana}
            </span>
            <span className="text-[11px] font-mono tabular-nums text-white/40">/ {manaTotal}</span>
          </div>
        </div>

        {/* Barra de Energia Dinâmica */}
        <div className="relative w-full h-5 sm:h-6 rounded-full bg-black/60 border border-white/10 p-1 overflow-hidden shadow-inner flex items-center">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barGradients[theme]} transition-all duration-700 ease-out relative shadow-[0_0_15px_rgba(255,255,255,0.3)]`}
            style={{ width: `${percent}%` }}
          >
            {percent > 0 && (
              <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/80 rounded-full blur-[1px] shadow-[0_0_10px_white]" />
            )}
          </div>
        </div>

        {/* Escala Contínua de Controladores de Mana: -5 -3 -1 reset +1 +3 +5 */}
        <div className="grid grid-cols-7 gap-1 pt-1.5 border-t border-white/5 relative z-10 select-none">
          {[-5, -3, -1].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => adjustMana(delta)}
              disabled={currentMana <= 0}
              className="w-full py-1 px-0.5 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 hover:border-white/20 text-white/70 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all text-[10px] sm:text-[11px] font-mono font-semibold cursor-pointer text-center"
              title={`Gastar ${Math.abs(delta)} pontos de mana (${delta})`}
            >
              {delta}
            </button>
          ))}

          {/* Reset */}
          <button
            type="button"
            onClick={resetMana}
            disabled={manaSpent === 0}
            className="w-full py-1 px-0.5 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 hover:border-white/20 text-white/70 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center cursor-pointer text-center"
            title="Resetar (Recuperar toda a mana)"
          >
            <RotateCcw size={12} className="text-white/60" />
          </button>

          {[1, 3, 5].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => adjustMana(delta)}
              disabled={currentMana >= manaTotal}
              className="w-full py-1 px-0.5 rounded-lg bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 hover:border-white/20 text-white/70 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all text-[10px] sm:text-[11px] font-mono font-semibold cursor-pointer text-center"
              title={`Recuperar ${delta} pontos de mana (+${delta})`}
            >
              +{delta}
            </button>
          ))}
        </div>
      </div>
      {children}
    </Card>
  );
};
