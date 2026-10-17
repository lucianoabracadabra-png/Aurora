import React from 'react';
import { SpiritusData } from '../types';
import { Card } from './ui/Card';
import { Sparkles, Shield, Zap } from 'lucide-react';

type Props = {
  data: SpiritusData;
  updateFluxo: (value: number) => void;
  updatePatrono: (value: number) => void;
  updateRachadura: (index: number, value: boolean) => void;
  readonly: boolean;
  onRollFluxo?: () => void;
  onRollPatrono?: () => void;
};

export const Spiritus: React.FC<Props> = ({
  data,
  updateFluxo,
  updatePatrono,
  updateRachadura,
  readonly,
  onRollFluxo,
  onRollPatrono
}) => {
  const fluxoVal = Math.max(0, data?.fluxo ?? 2);
  const patronoVal = Math.max(0, data?.patrono ?? 3);
  const rachaduraBoxes = data?.rachadura ?? Array(10).fill(false);

  return (
    <Card title="Spiritus" titleClassName="text-amber-400" icon={<Sparkles size={16} />}>
      <div className="flex flex-col gap-5">
        {/* Atributos: Fluxo e Patrono */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Fluxo */}
          <div
            onClick={() => {
              if (readonly && onRollFluxo) onRollFluxo();
            }}
            title={readonly ? (onRollFluxo ? "Clique para rolar teste de Fluxo" : "Fluxo") : "Fluxo"}
            className={`relative group flex flex-col items-center justify-center p-4 rounded-2xl border bg-black/40 border-amber-500/30 hover:border-amber-400/50 transition-all select-none shadow-inner ${
              readonly && onRollFluxo ? 'cursor-pointer hover:bg-white/[0.04] active:scale-[0.98]' : ''
            }`}
          >
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />
            <div className="flex items-center gap-1.5 mb-2 text-amber-400">
              <Zap size={14} className="fill-amber-400/20" />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-300/90">
                Fluxo
              </span>
            </div>

            <div className="flex items-center justify-center gap-2">
              {!readonly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateFluxo(Math.max(0, fluxoVal - 1));
                  }}
                  className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center text-xs transition-colors cursor-pointer shrink-0 active:scale-95"
                  title="Diminuir Fluxo"
                >
                  -
                </button>
              )}

              <span className="text-3xl sm:text-4xl font-light font-mono tabular-nums text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                {fluxoVal}
              </span>

              {!readonly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateFluxo(fluxoVal + 1);
                  }}
                  className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center text-xs transition-colors cursor-pointer shrink-0 active:scale-95"
                  title="Aumentar Fluxo"
                >
                  +
                </button>
              )}
            </div>
          </div>

          {/* Patrono */}
          <div
            onClick={() => {
              if (readonly && onRollPatrono) onRollPatrono();
            }}
            title={readonly ? (onRollPatrono ? "Clique para rolar teste de Patrono" : "Patrono") : "Patrono"}
            className={`relative group flex flex-col items-center justify-center p-4 rounded-2xl border bg-black/40 border-amber-500/30 hover:border-amber-400/50 transition-all select-none shadow-inner ${
              readonly && onRollPatrono ? 'cursor-pointer hover:bg-white/[0.04] active:scale-[0.98]' : ''
            }`}
          >
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />
            <div className="flex items-center gap-1.5 mb-2 text-amber-400">
              <Shield size={14} className="fill-amber-400/20" />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-300/90">
                Patrono
              </span>
            </div>

            <div className="flex items-center justify-center gap-2">
              {!readonly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updatePatrono(Math.max(0, patronoVal - 1));
                  }}
                  className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center text-xs transition-colors cursor-pointer shrink-0 active:scale-95"
                  title="Diminuir Patrono"
                >
                  -
                </button>
              )}

              <span className="text-3xl sm:text-4xl font-light font-mono tabular-nums text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                {patronoVal}
              </span>

              {!readonly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updatePatrono(patronoVal + 1);
                  }}
                  className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center text-xs transition-colors cursor-pointer shrink-0 active:scale-95"
                  title="Aumentar Patrono"
                >
                  +
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rachadura (Caixas de toggle como o HP do fluxo) */}
        <div className="flex flex-col gap-2.5 bg-black/40 border border-amber-500/20 rounded-2xl p-3.5 shadow-inner">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-400/80">
              Rachadura
            </span>
            <span className="text-[9px] font-mono text-white/40">
              {rachaduraBoxes.filter(Boolean).length} / {rachaduraBoxes.length} ativas
            </span>
          </div>

          <div className="grid grid-cols-10 gap-1.5 w-full">
            {rachaduraBoxes.map((isActive, idx) => (
              <button
                key={idx}
                type="button"
                disabled={false}
                onClick={() => updateRachadura(idx, !isActive)}
                className={`w-full aspect-square rounded-lg border transition-all duration-150 select-none cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.7)]'
                    : 'bg-white/[0.03] border-white/15 hover:border-amber-400/40 hover:bg-white/[0.08]'
                } active:scale-90`}
                title={`Rachadura ${idx + 1} (Clique para alternar)`}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
