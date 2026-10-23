import React from 'react';
import { BodyHealth, DamageType } from '../types';
import { Minus, Plus, X } from 'lucide-react';

type Props = {
  data: BodyHealth;
  update: (part: keyof BodyHealth, index: number, value: DamageType) => void;
  readonly?: boolean;
  isGmView?: boolean;
  isEditing?: boolean;
  onResizePart?: (part: keyof BodyHealth, delta: number) => void;
  showDamageOverlay?: boolean;
  onCloseDamageOverlay?: () => void;
};

// Valores e pesos de dano para medição interna
export const DAMAGE_WEIGHTS: Record<DamageType, number> = {
  none: 0,
  simple: 1, // Dano Simples: 1 ponto
  lethal: 2, // Dano Letal: 2 pontos (equivale a 2 simples)
  aggravated: 4 // Dano Agravado: 4 pontos (equivale a 2 letais ou 4 simples)
};

const DamageBox: React.FC<{ 
  value: DamageType; 
  onChange: (v: DamageType) => void; 
  readonly: boolean;
  emptyHighlight?: 'blue' | 'orange' | 'red' | null;
}> = ({ value, onChange, readonly, emptyHighlight }) => {
  const emptyStyle = emptyHighlight === 'orange'
    ? 'bg-orange-500/10 border-orange-500/40 hover:border-orange-400 hover:bg-orange-500/20 shadow-[inset_0_0_8px_rgba(249,115,22,0.15)]'
    : emptyHighlight === 'blue'
      ? 'bg-blue-500/10 border-blue-400/40 hover:border-blue-300 hover:bg-blue-500/20 shadow-[inset_0_0_8px_rgba(59,130,246,0.15)]'
      : emptyHighlight === 'red'
        ? 'bg-red-950/20 border-red-900/40 hover:border-red-800 hover:bg-red-950/30 shadow-[inset_0_0_8px_rgba(153,27,27,0.15)]'
        : `bg-white/[0.03] border-white/15 ${!readonly ? 'hover:border-white/40 hover:bg-white/[0.08]' : ''}`;

  const colors = {
    none: emptyStyle,
    simple: 'bg-blue-500 border-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.6)]',
    lethal: 'bg-orange-500 border-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.6)]',
    aggravated: 'bg-red-600 border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.6)]'
  };

  const nextState: Record<DamageType, DamageType> = {
    none: 'simple',
    simple: 'lethal',
    lethal: 'aggravated',
    aggravated: 'none'
  };

  return (
    <button
      type="button"
      disabled={readonly}
      data-damage-box="true"
      aria-label={`Damage box: ${value}`}
      className={`damage-box relative w-full aspect-square border rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-150 select-none ${colors[value]} ${
        readonly ? 'opacity-80 cursor-default' : 'cursor-pointer active:scale-90 hover:scale-[1.03]'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        if (!readonly) onChange(nextState[value]);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      title={!readonly ? "Clique para alternar dano (Vazio > Simples [1pt] > Letal [2pts] > Agravado [4pts])" : undefined}
    />
  );
};

const BodyPart = ({ 
  label, 
  boxes, 
  onChange, 
  onReset,
  readonly,
  columns = 4,
  isGmView,
  isEditing,
  onResize,
  showDamageOverlay,
  onCloseDamageOverlay,
}: { 
  label: string; 
  boxes: DamageType[]; 
  onChange: (index: number, v: DamageType) => void;
  onReset?: () => void;
  readonly: boolean;
  columns?: number;
  isGmView?: boolean;
  isEditing?: boolean;
  onResize?: (delta: number) => void;
  isTorso?: boolean;
  showDamageOverlay?: boolean;
  onCloseDamageOverlay?: () => void;
}) => {
  // -------------------------------------------------------------------------
  // CÁLCULO INTERNO QUE MEDE AS CAIXAS (SIMPLES > LETAL > AGRAVADO)
  // -------------------------------------------------------------------------
  const totalCapacity = boxes.length;
  const simpleCount = boxes.filter(b => b === 'simple').length;
  const lethalCount = boxes.filter(b => b === 'lethal').length;
  const aggravatedCount = boxes.filter(b => b === 'aggravated').length;

  // Valor total acumulado de dano
  const totalDamage = (simpleCount * DAMAGE_WEIGHTS.simple) + 
                      (lethalCount * DAMAGE_WEIGHTS.lethal) + 
                      (aggravatedCount * DAMAGE_WEIGHTS.aggravated);

  // Metas equivalentes de preenchimento
  const fullSimpleThreshold = totalCapacity * DAMAGE_WEIGHTS.simple; // Ex: 6 caixas * 1 = 6 pts
  const fullLethalThreshold = totalCapacity * DAMAGE_WEIGHTS.lethal; // Ex: 6 caixas * 2 = 12 pts
  const fullAggravatedThreshold = totalCapacity * DAMAGE_WEIGHTS.aggravated; // Ex: 6 caixas * 4 = 24 pts

  // Estados de preenchimento equivalente em todas as caixas de membros
  const isAggravatedFull = totalCapacity > 0 && totalDamage >= fullAggravatedThreshold;
  const isLethalFull = totalCapacity > 0 && totalDamage >= fullLethalThreshold && !isAggravatedFull;
  const isSimpleFull = totalCapacity > 0 && totalDamage >= fullSimpleThreshold && !isLethalFull && !isAggravatedFull;

  // Estilização dinâmica da moldura externa em todos os membros:
  // - Simples cheio: AZUL
  // - Letal cheio: LARANJA pulsando suavemente (só a cor)
  // - Agravado cheio: VERMELHO APAGADO
  let containerBorderGlow = 'border-white/10 hover:border-white/20 bg-[#050508]/40 shadow-[0_8px_32px_rgba(0,0,0,0.3)]';
  let gradientOverlay = 'bg-gradient-to-b from-rose-500/[0.03] to-transparent';
  let emptyHighlight: 'blue' | 'orange' | 'red' | null = null;

  if (isAggravatedFull) {
    // Tudo de dano agravado: VERMELHO APAGADO
    containerBorderGlow = 'border-red-900/70 bg-red-950/20 shadow-[0_0_15px_rgba(153,27,27,0.3)] ring-1 ring-red-950/60';
    gradientOverlay = 'bg-gradient-to-b from-red-950/30 to-transparent';
    emptyHighlight = 'red';
  } else if (isLethalFull) {
    // Tudo de dano letal: LARANJA e pulsando suavemente (apenas cor/brilho)
    containerBorderGlow = 'border-orange-500 bg-orange-950/25 shadow-[0_0_30px_rgba(249,115,22,0.5)] ring-1 ring-orange-400/60 animate-pulse';
    gradientOverlay = 'bg-gradient-to-b from-orange-500/25 via-orange-900/10 to-transparent';
    emptyHighlight = 'orange';
  } else if (isSimpleFull) {
    // Ao encher tudo de dano simples: AZUL
    containerBorderGlow = 'border-blue-500 bg-blue-950/25 shadow-[0_0_25px_rgba(59,130,246,0.45)] ring-1 ring-blue-400/60';
    gradientOverlay = 'bg-gradient-to-b from-blue-500/20 via-blue-900/10 to-transparent';
    emptyHighlight = 'blue';
  }

  return (
    <div 
      onDoubleClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest('button') || 
          target.closest('[data-damage-box="true"]') || 
          target.closest('.damage-box') || 
          target.closest('.damage-box-grid')
        ) {
          return;
        }
        if (!readonly && onReset) onReset();
      }}
      title={!readonly ? `${label} (Clique duplo na moldura externa para limpar todos os ferimentos)` : undefined}
      className={`flex flex-col justify-between backdrop-blur-xl rounded-2xl p-2.5 sm:p-3 relative overflow-hidden h-full transition-all duration-300 cursor-pointer ${containerBorderGlow}`}
    >
      <div className={`absolute inset-0 pointer-events-none transition-colors duration-300 ${gradientOverlay}`} />
      
      {/* Topo: Título da Parte do Corpo + Contagem */}
      <div className="flex flex-col items-center justify-center w-full mb-2 relative z-10 select-none min-h-[22px]">
        <div className="flex items-center justify-center w-full relative">
          {isGmView && isEditing && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onResize) onResize(-1);
              }}
              disabled={boxes.length <= 1}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-white/5 hover:bg-rose-500/20 active:scale-90 text-white/50 hover:text-rose-300 border border-white/10 flex items-center justify-center transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed z-20 shrink-0"
              title={`Diminuir caixas de HP de ${label} (-)`}
            >
              <Minus size={10} />
            </button>
          )}

          <div className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/90 text-center flex items-center gap-1.5 justify-center leading-tight ${isGmView && isEditing ? 'px-4' : 'px-0.5'}`}>
            <span className="whitespace-normal text-center leading-tight">{label}</span>
            <span className="text-[9px] font-mono text-white/40 font-normal shrink-0">({boxes.length})</span>
          </div>

          {isGmView && isEditing && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onResize) onResize(1);
              }}
              disabled={boxes.length >= 16}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-white/5 hover:bg-emerald-500/20 active:scale-90 text-white/50 hover:text-emerald-300 border border-white/10 flex items-center justify-center transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed z-20 shrink-0"
              title={`Aumentar caixas de HP de ${label} (+)`}
            >
              <Plus size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Overlay com Cálculo e Medição Interna de Dano em cima de cada membro */}
      {showDamageOverlay && (
        <div 
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-30 bg-[#070512]/95 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl flex flex-col justify-between text-left text-xs animate-in fade-in duration-150 border border-white/15 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-1">
            <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider truncate">
              {label} • Dano
            </span>
            {onCloseDamageOverlay && (
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseDamageOverlay();
                }}
                className="text-white/40 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
                title="Fechar medição"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-0.5 text-[9px] sm:text-[10px] font-mono text-white/80 py-1">
            <div className="flex justify-between">
              <span>Simples ({simpleCount}x1):</span>
              <strong className="text-blue-300">+{simpleCount * 1} pts</strong>
            </div>
            <div className="flex justify-between">
              <span>Letal ({lethalCount}x2):</span>
              <strong className="text-orange-300">+{lethalCount * 2} pts</strong>
            </div>
            <div className="flex justify-between">
              <span>Agravado ({aggravatedCount}x4):</span>
              <strong className="text-rose-400">+{aggravatedCount * 4} pts</strong>
            </div>
            <div className="h-px bg-white/10 my-0.5" />
            <div className="flex justify-between font-bold text-white">
              <span>Total Acumulado:</span>
              <span className="text-amber-300">{totalDamage} pts</span>
            </div>
            <div className="flex justify-between text-white/50 text-[8px] sm:text-[9px] pt-0.5">
              <span>Cheio Simples (1x):</span>
              <span>{fullSimpleThreshold} pts</span>
            </div>
            <div className="flex justify-between text-white/50 text-[8px] sm:text-[9px]">
              <span>Cheio Letal (2x):</span>
              <span>{fullLethalThreshold} pts</span>
            </div>
            <div className="flex justify-between text-white/50 text-[8px] sm:text-[9px]">
              <span>Cheio Agravado (4x):</span>
              <span>{fullAggravatedThreshold} pts</span>
            </div>
          </div>

          <div className="text-[8px] text-white/40 italic text-center pt-0.5 border-t border-white/5">
            1 Letal = 2S • 1 Agravado = 4S
          </div>
        </div>
      )}

      {/* Grid das Caixas de Dano */}
      <div 
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className="damage-box-grid grid gap-1.5 sm:gap-2 mt-auto w-full relative z-10 cursor-default"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {boxes.map((val, idx) => (
          <DamageBox 
            key={idx} 
            value={val} 
            onChange={(v) => onChange(idx, v)} 
            readonly={readonly}
            emptyHighlight={emptyHighlight}
          />
        ))}
      </div>
    </div>
  );
};

export const HealthTracker: React.FC<Props> = ({ 
  data, 
  update, 
  readonly = false, 
  isGmView = false,
  isEditing = false,
  onResizePart,
  showDamageOverlay = false,
  onCloseDamageOverlay
}) => {
  const clearPart = (part: keyof BodyHealth) => {
    data[part].forEach((_, i) => update(part, i, 'none'));
  };

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4 w-full">
      <BodyPart 
        label="Braço Esquerdo" 
        boxes={data.leftArm} 
        onChange={(i, v) => update('leftArm', i, v)} 
        onReset={() => clearPart('leftArm')}
        readonly={readonly} 
        isGmView={isGmView}
        isEditing={isEditing}
        onResize={(delta) => onResizePart && onResizePart('leftArm', delta)}
        showDamageOverlay={showDamageOverlay}
        onCloseDamageOverlay={onCloseDamageOverlay}
      />
      <BodyPart 
        label="Cabeça" 
        boxes={data.head} 
        onChange={(i, v) => update('head', i, v)} 
        onReset={() => clearPart('head')}
        readonly={readonly} 
        isGmView={isGmView}
        isEditing={isEditing}
        onResize={(delta) => onResizePart && onResizePart('head', delta)}
        showDamageOverlay={showDamageOverlay}
        onCloseDamageOverlay={onCloseDamageOverlay}
      />
      <BodyPart 
        label="Braço Direito" 
        boxes={data.rightArm} 
        onChange={(i, v) => update('rightArm', i, v)} 
        onReset={() => clearPart('rightArm')}
        readonly={readonly} 
        isGmView={isGmView}
        isEditing={isEditing}
        onResize={(delta) => onResizePart && onResizePart('rightArm', delta)}
        showDamageOverlay={showDamageOverlay}
        onCloseDamageOverlay={onCloseDamageOverlay}
      />
      
      <BodyPart 
        label="Perna Esquerda" 
        boxes={data.leftLeg} 
        onChange={(i, v) => update('leftLeg', i, v)} 
        onReset={() => clearPart('leftLeg')}
        readonly={readonly} 
        isGmView={isGmView}
        isEditing={isEditing}
        onResize={(delta) => onResizePart && onResizePart('leftLeg', delta)}
        showDamageOverlay={showDamageOverlay}
        onCloseDamageOverlay={onCloseDamageOverlay}
      />
      <BodyPart 
        label="Torso" 
        boxes={data.torso} 
        onChange={(i, v) => update('torso', i, v)} 
        onReset={() => clearPart('torso')}
        readonly={readonly} 
        isGmView={isGmView}
        isEditing={isEditing}
        onResize={(delta) => onResizePart && onResizePart('torso', delta)}
        showDamageOverlay={showDamageOverlay}
        onCloseDamageOverlay={onCloseDamageOverlay}
        isTorso={true}
      />
      <BodyPart 
        label="Perna Direita" 
        boxes={data.rightLeg} 
        onChange={(i, v) => update('rightLeg', i, v)} 
        onReset={() => clearPart('rightLeg')}
        readonly={readonly} 
        isGmView={isGmView}
        isEditing={isEditing}
        onResize={(delta) => onResizePart && onResizePart('rightLeg', delta)}
        showDamageOverlay={showDamageOverlay}
        onCloseDamageOverlay={onCloseDamageOverlay}
      />
    </div>
  );
};
