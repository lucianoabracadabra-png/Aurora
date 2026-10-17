import React from 'react';
import { BodyHealth, DamageType } from '../types';
import { Heart, Minus, Plus } from 'lucide-react';

type Props = {
  data: BodyHealth;
  update: (part: keyof BodyHealth, index: number, value: DamageType) => void;
  readonly?: boolean;
  isGmView?: boolean;
  isEditing?: boolean;
  onResizePart?: (part: keyof BodyHealth, delta: number) => void;
};

const DamageBox: React.FC<{ value: DamageType; onChange: (v: DamageType) => void; readonly: boolean }> = ({ value, onChange, readonly }) => {
  const colors = {
    none: `bg-white/[0.03] border-white/15 ${!readonly ? 'hover:border-white/40 hover:bg-white/[0.08]' : ''}`,
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
      aria-label={`Damage box: ${value}`}
      className={`relative w-full aspect-square border rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-150 select-none ${colors[value]} ${
        readonly ? 'opacity-80 cursor-default' : 'cursor-pointer active:scale-90 hover:scale-[1.03]'
      }`}
      onClick={() => {
        if (!readonly) onChange(nextState[value]);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!readonly) onChange('none');
      }}
      title={!readonly ? "Clique para alternar dano • Clique duplo para limpar" : undefined}
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
  onResize
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
}) => {
  return (
    <div 
      onDoubleClick={() => {
        if (!readonly && onReset) onReset();
      }}
      title={!readonly ? `${label} (Clique duplo para limpar esta caixa)` : undefined}
      className="flex flex-col justify-between bg-[#050508]/40 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-2.5 sm:p-3 relative overflow-hidden h-full shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.03] to-transparent pointer-events-none" />
      
      {/* Título: sem caixas/espaçadores ocultos empurrando o texto. Botões do GM posicionados de forma limpa */}
      <div className="flex items-center justify-center w-full mb-2 relative z-10 select-none min-h-[22px]">
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

        <div className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/90 text-center flex items-center gap-1 justify-center leading-tight ${isGmView && isEditing ? 'px-4' : 'px-0.5'}`}>
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

      <div 
        className="grid gap-1.5 sm:gap-2 mt-auto w-full relative z-10"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {boxes.map((val, idx) => (
          <DamageBox 
            key={idx} 
            value={val} 
            onChange={(v) => onChange(idx, v)} 
            readonly={readonly} 
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
  onResizePart 
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
      />
    </div>
  );
};
